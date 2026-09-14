"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dongCong, moCong } from "@/lib/server/cong-phu-huynh";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import {
  ghiDongY, ghiNguoiGiamHo, ghiThangNamSinh, layCon, themCon,
} from "@/lib/server/repo";
import { taoYeuCauDuLieu, type LoaiYeuCau } from "@/lib/server/requests";
import type { MucDich } from "@/lib/privacy/consent";
import { mucDatDuocQuaMaMotLan, type QuanHe } from "@/lib/privacy/nguoi-giam-ho";
import { guiMa, kiemMaCuaHo } from "@/lib/server/ma-mot-lan";
import { kiemThangNamSinh } from "@/lib/privacy/tuoi";

export async function hanhDongMoCong(_truoc: { loi?: string } | null, form: FormData) {
  const kq = await moCong(String(form.get("pin") ?? ""));
  if (!kq.ok) return { loi: kq.loi };
  redirect("/phu-huynh");
}

export async function hanhDongDongCong() {
  await dongCong();
  redirect("/phu-huynh");
}

export async function hanhDongDoiDongY(form: FormData) {
  const ho = await daMoCong();
  if (!ho) redirect("/phu-huynh");
  const mucDich = String(form.get("mucDich")) as MucDich;
  const bat = form.get("bat") === "1";
  ghiDongY(ho.id, mucDich, bat);
  revalidatePath("/phu-huynh/quyen-rieng-tu");
}

export async function hanhDongThemCon(form: FormData) {
  const ho = await daMoCong();
  if (!ho) redirect("/phu-huynh");
  const ten = String(form.get("tenGoi") ?? "").trim();
  const lop = Number(form.get("lop")) === 1 ? 1 : 2;
  if (ten) themCon(ho.id, ten, lop);
  revalidatePath("/phu-huynh");
}

export async function hanhDongYeuCauDuLieu(form: FormData) {
  const ho = await daMoCong();
  if (!ho) redirect("/phu-huynh");
  const loai = String(form.get("loai")) as LoaiYeuCau;
  const noiDung = String(form.get("noiDung") ?? "").trim() || null;
  taoYeuCauDuLieu(ho.id, loai, noiDung);
  revalidatePath("/phu-huynh/du-lieu-cua-toi");
}

/**
 * Ghi người đại diện ở mức TỰ KHAI.
 *
 * Vẫn giữ lại vì không phải hộ nào cũng nhận được tin nhắn ngay, và chặn cứng
 * ở đây sẽ khóa luôn cả phần luyện tập của con. Nhưng mức ghi xuống luôn là
 * "tu-khai", không nhận mức nào từ biểu mẫu — muốn mức mạnh hơn thì phải đi
 * qua luồng mã một lần ở hanhDongXacMinhMa.
 */
export async function hanhDongGhiNguoiGiamHo(form: FormData) {
  const ho = await daMoCong();
  if (!ho) redirect("/phu-huynh");
  const hoTen = String(form.get("hoTen") ?? "").trim();
  const quanHe = String(form.get("quanHe")) as QuanHe;
  const tuXacNhan = form.get("tuXacNhan") === "1";
  if (!hoTen || !tuXacNhan) {
    revalidatePath("/phu-huynh/nguoi-giam-ho");
    return;
  }
  ghiNguoiGiamHo({
    householdId: ho.id,
    quanHe,
    hoTen,
    phuongThuc: "tu-khai",
    tuXacNhanDaiDien: true,
  });
  revalidatePath("/phu-huynh/nguoi-giam-ho");
}

export async function hanhDongGhiThangNamSinh(form: FormData) {
  const ho = await daMoCong();
  if (!ho) redirect("/phu-huynh");
  const childId = String(form.get("childId") ?? "");
  const con = layCon(childId);
  if (!con || con.householdId !== ho.id) redirect("/phu-huynh");
  try {
    ghiThangNamSinh(
      childId,
      kiemThangNamSinh({ nam: Number(form.get("nam")), thang: Number(form.get("thang")) }),
    );
  } catch {
    // Gõ nhầm năm sinh thì không ghi gì, và trang sẽ vẫn hiện là chưa khai.
  }
  revalidatePath("/phu-huynh/nguoi-giam-ho");
}

/**
 * Sự đồng ý của CHÍNH đứa trẻ, với trẻ từ đủ 7 tuổi (CR-05).
 *
 * Ghi riêng khỏi sự đồng ý của người giám hộ, và không hàm nào trong hai hàm
 * suy ra hàm kia: người giám hộ đồng ý thay con là không hợp lệ, mà con đồng ý
 * một mình cũng không hợp lệ.
 */
export async function hanhDongConDongY(form: FormData) {
  const ho = await daMoCong();
  if (!ho) redirect("/phu-huynh");
  const childId = String(form.get("childId") ?? "");
  const con = layCon(childId);
  if (!con || con.householdId !== ho.id) redirect("/phu-huynh");
  const mucDich = String(form.get("mucDich")) as MucDich;
  ghiDongY(ho.id, mucDich, form.get("bat") === "1", "tre-em", childId);
  revalidatePath("/phu-huynh/nguoi-giam-ho");
}

export async function hanhDongGuiMa(_truoc: unknown, form: FormData) {
  const ho = await daMoCong();
  if (!ho) redirect("/phu-huynh");
  const kq = await guiMa(ho.id, String(form.get("soDienThoai") ?? ""));
  revalidatePath("/phu-huynh/nguoi-giam-ho");
  if (!kq.ok) return { loi: kq.thongBao };
  return {
    daGui: true,
    haiSoCuoi: kq.haiSoCuoi,
    // Chỉ khác null khi đang chạy bản giả lập, xem src/lib/server/ma-mot-lan.ts.
    maHienThi: kq.maHienThi,
  };
}

/**
 * Xác minh bằng mã một lần, rồi ghi bản ghi người đại diện.
 *
 * Mức xác minh KHÔNG lấy từ biểu mẫu. Nó do mucDatDuocQuaMaMotLan quyết định,
 * dựa vào việc tin nhắn có thật sự được gửi ra ngoài hay không. Đây là chỗ sửa
 * một lỗ hổng của bản trước: trang này từng cho phụ huynh tự chọn mức xác minh
 * bằng nút tròn, nghĩa là ai cũng bấm được vào "đã xác minh bằng mã một lần" mà
 * không làm gì cả.
 */
export async function hanhDongXacMinhMa(_truoc: unknown, form: FormData) {
  const ho = await daMoCong();
  if (!ho) redirect("/phu-huynh");

  const hoTen = String(form.get("hoTen") ?? "").trim();
  const quanHe = String(form.get("quanHe")) as QuanHe;
  if (!hoTen || form.get("tuXacNhan") !== "1") {
    return { loi: "Anh chị điền họ tên và tích vào dòng xác nhận giúp nhé." };
  }

  const kq = kiemMaCuaHo(ho.id, String(form.get("ma") ?? "").trim());
  revalidatePath("/phu-huynh/nguoi-giam-ho");
  if (!kq.ok) {
    return {
      loi:
        kq.soLanConLai !== undefined
          ? `${kq.thongBao} Còn ${kq.soLanConLai} lần thử.`
          : kq.thongBao,
    };
  }

  ghiNguoiGiamHo({
    householdId: ho.id,
    quanHe,
    hoTen,
    phuongThuc: mucDatDuocQuaMaMotLan(kq.laGiaLap),
    tuXacNhanDaiDien: true,
    haiSoCuoi: kq.haiSoCuoi,
  });
  return { xong: true };
}
