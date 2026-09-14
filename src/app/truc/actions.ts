"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { tinhTrangHan } from "@/lib/domain/han-xu-ly";
import { daMoCongTruc, dongCongTruc, moCongTruc } from "@/lib/server/cong-truc";
import {
  doiTrangThaiGoBo, doiTrangThaiYeuCauDuLieu, ghiNhatKy,
  layYeuCauDuLieu, layYeuCauGoBo,
} from "@/lib/server/requests";
import { rutToanBoDongY, xoaDuLieuHo, xuatDuLieuHo } from "@/lib/server/thuc-thi-yeu-cau";

export async function hanhDongMoCongTruc(_truoc: { loi?: string } | null, form: FormData) {
  const kq = await moCongTruc(String(form.get("nguoiTruc") ?? ""), String(form.get("ma") ?? ""));
  if (!kq.ok) return { loi: kq.loi };
  redirect("/truc");
}

export async function hanhDongDongCongTruc() {
  await dongCongTruc();
  redirect("/truc");
}

/**
 * Tiếp nhận một yêu cầu dữ liệu.
 *
 * BR-39: phản hồi đã tiếp nhận trong 2 ngày làm việc. Bước này tách khỏi bước
 * hoàn thành vì luật cũng tách: có hai mốc thời hạn khác nhau, và người trực
 * phải bấm được cái trước mà chưa làm xong cái sau.
 */
export async function hanhDongTiepNhan(form: FormData) {
  const phien = await daMoCongTruc();
  if (!phien) redirect("/truc");
  const id = String(form.get("id"));
  const yc = layYeuCauDuLieu(id);
  if (!yc) return;

  doiTrangThaiYeuCauDuLieu(id, "da-tiep-nhan");
  ghiNhatKy({
    loaiYeuCau: "du-lieu",
    maYeuCau: id,
    hanhDong: "tiep-nhan",
    tuTrangThai: yc.trangThai,
    sangTrangThai: "da-tiep-nhan",
    nguoiTruc: phien.nguoiTruc,
    ghiChu: null,
    // Mốc của bước này là hạn TIẾP NHẬN, không phải hạn hoàn thành.
    dungHan: tinhTrangHan(yc.nhanLuc, yc.hanTiepNhan, false).conLaiMs >= 0,
  });
  revalidatePath("/truc");
}

/**
 * Hoàn thành một yêu cầu dữ liệu — và LÀM THẬT việc người dùng yêu cầu.
 *
 * Đây là chỗ phân biệt một quy trình thật với một quy trình trên giấy. Đổi
 * trạng thái mà không làm gì thì người dùng vẫn không nhận được thứ họ xin.
 */
export async function hanhDongHoanThanh(form: FormData) {
  const phien = await daMoCongTruc();
  if (!phien) redirect("/truc");
  const id = String(form.get("id"));
  const yc = layYeuCauDuLieu(id);
  if (!yc) return;

  let ghiChu: string;
  switch (yc.loai) {
    case "rut-dong-y": {
      const so = rutToanBoDongY(yc.householdId);
      ghiChu = `Đã tắt toàn bộ ${so} mục đích xử lý; lịch sử đồng ý cũ giữ nguyên làm bằng chứng.`;
      break;
    }
    case "xoa": {
      const kq = xoaDuLieuHo(yc.householdId);
      ghiChu = kq
        ? `Đã xóa toàn bộ dữ liệu: ${kq.soCon} hồ sơ trẻ, ${kq.soLuotBai} lượt làm bài, ${kq.soViecAnh} lượt chụp.`
        : "Hộ đã không còn trong hệ thống.";
      break;
    }
    case "xem":
    case "xuat-du-lieu": {
      const ban = xuatDuLieuHo(yc.householdId);
      ghiChu = ban
        ? `Đã dựng bản xuất dữ liệu: ${ban.con.length} hồ sơ trẻ, ${ban.lichSuHocTap.length} lượt làm bài.`
        : "Hộ đã không còn trong hệ thống.";
      break;
    }
    default:
      ghiChu = String(form.get("ghiChu") ?? "").trim() || "Đã xử lý thủ công.";
  }

  // Với yêu cầu xóa, bản ghi yêu cầu mất theo hộ, nên phải ghi nhật ký TRƯỚC
  // khi đổi trạng thái — nhật ký là thứ duy nhất còn lại để chứng minh.
  ghiNhatKy({
    loaiYeuCau: "du-lieu",
    maYeuCau: id,
    hanhDong: `hoan-thanh:${yc.loai}`,
    tuTrangThai: yc.trangThai,
    sangTrangThai: "hoan-thanh",
    nguoiTruc: phien.nguoiTruc,
    ghiChu,
    dungHan: tinhTrangHan(yc.nhanLuc, yc.hanHoanThanh, false).conLaiMs >= 0,
  });
  if (yc.loai !== "xoa") doiTrangThaiYeuCauDuLieu(id, "hoan-thanh");
  revalidatePath("/truc");
}

export async function hanhDongGoBo(form: FormData) {
  const phien = await daMoCongTruc();
  if (!phien) redirect("/truc");
  const id = String(form.get("id"));
  const sang = String(form.get("sang")) as "dang-xem-xet" | "da-go" | "tu-choi";
  const ghiChu = String(form.get("ghiChu") ?? "").trim() || null;
  const yc = layYeuCauGoBo(id);
  if (!yc) return;

  doiTrangThaiGoBo(id, sang, ghiChu);
  ghiNhatKy({
    loaiYeuCau: "go-bo",
    maYeuCau: id,
    hanhDong: sang,
    tuTrangThai: yc.trangThai,
    sangTrangThai: sang,
    nguoiTruc: phien.nguoiTruc,
    ghiChu,
    dungHan: tinhTrangHan(yc.nhanLuc, yc.hanXuLy, false).conLaiMs >= 0,
  });
  revalidatePath("/truc");
}
