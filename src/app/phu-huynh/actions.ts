"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dongCong, moCong } from "@/lib/server/cong-phu-huynh";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { ghiDongY, themCon } from "@/lib/server/repo";
import { taoYeuCauDuLieu, type LoaiYeuCau } from "@/lib/server/requests";
import type { MucDich } from "@/lib/privacy/consent";

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
