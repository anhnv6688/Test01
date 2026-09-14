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
import type { PhuongThucXacMinh, QuanHe } from "@/lib/privacy/nguoi-giam-ho";
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

export async function hanhDongGhiNguoiGiamHo(form: FormData) {
  const ho = await daMoCong();
  if (!ho) redirect("/phu-huynh");
  const hoTen = String(form.get("hoTen") ?? "").trim();
  const quanHe = String(form.get("quanHe")) as QuanHe;
  const phuongThuc = String(form.get("phuongThuc")) as PhuongThucXacMinh;
  // Không có ô này thì không ghi gì cả: xác nhận mình là người đại diện theo
  // pháp luật là nội dung của chính lời xác nhận, không phải tùy chọn kèm theo.
  const tuXacNhan = form.get("tuXacNhan") === "1";
  if (!hoTen || !tuXacNhan) {
    revalidatePath("/phu-huynh/nguoi-giam-ho");
    return;
  }
  ghiNguoiGiamHo({ householdId: ho.id, quanHe, hoTen, phuongThuc, tuXacNhanDaiDien: true });
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
