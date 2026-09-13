import { randomUUID } from "node:crypto";
import { getDb } from "./db";

/**
 * Yêu cầu của người dùng về dữ liệu của mình (BR-39) và yêu cầu gỡ bỏ nội dung
 * (BR-23, CR-06).
 *
 * Các mốc thời hạn dưới đây là RÀNG BUỘC VẬN HÀNH CỨNG, không phải cam kết dịch
 * vụ tự đặt ra, nên chúng được tính tự động khi nhận yêu cầu và hiện lên bảng
 * trực. Có một địa chỉ thư điện tử là chưa đủ: phải có người trực và có hạn.
 */
export type LoaiYeuCau = "xem" | "chinh-sua" | "rut-dong-y" | "xoa" | "xuat-du-lieu";

export const HAN_TIEP_NHAN_NGAY_LAM_VIEC = 2;
export const HAN_XEM_CHINH_SUA_NGAY = 10;
export const HAN_RUT_DONG_Y_GIO = 72;
export const HAN_GO_BO_GIO = 24;

/** Cộng số ngày làm việc, bỏ qua thứ bảy và chủ nhật. */
export function congNgayLamViec(tu: Date, soNgay: number): Date {
  const d = new Date(tu);
  let con = soNgay;
  while (con > 0) {
    d.setDate(d.getDate() + 1);
    const thu = d.getDay();
    if (thu !== 0 && thu !== 6) con -= 1;
  }
  return d;
}

export function hanHoanThanh(loai: LoaiYeuCau, nhanLuc: Date): Date {
  const d = new Date(nhanLuc);
  if (loai === "rut-dong-y" || loai === "xoa") {
    d.setHours(d.getHours() + HAN_RUT_DONG_Y_GIO);
    return d;
  }
  d.setDate(d.getDate() + HAN_XEM_CHINH_SUA_NGAY);
  return d;
}

export interface YeuCauDuLieu {
  id: string;
  householdId: string;
  loai: LoaiYeuCau;
  noiDung: string | null;
  nhanLuc: string;
  hanTiepNhan: string;
  hanHoanThanh: string;
  trangThai: "moi" | "da-tiep-nhan" | "hoan-thanh";
  xuLyLuc: string | null;
}

export function taoYeuCauDuLieu(householdId: string, loai: LoaiYeuCau, noiDung: string | null): YeuCauDuLieu {
  const now = new Date();
  const yc: YeuCauDuLieu = {
    id: randomUUID(),
    householdId,
    loai,
    noiDung,
    nhanLuc: now.toISOString(),
    hanTiepNhan: congNgayLamViec(now, HAN_TIEP_NHAN_NGAY_LAM_VIEC).toISOString(),
    hanHoanThanh: hanHoanThanh(loai, now).toISOString(),
    trangThai: "moi",
    xuLyLuc: null,
  };
  getDb()
    .prepare(
      `INSERT INTO data_requests (id, household_id, loai, noi_dung, nhan_luc, han_tiep_nhan, han_hoan_thanh, trang_thai, xu_ly_luc)
       VALUES (?,?,?,?,?,?,?,?,NULL)`,
    )
    .run(yc.id, yc.householdId, yc.loai, yc.noiDung, yc.nhanLuc, yc.hanTiepNhan, yc.hanHoanThanh, yc.trangThai);
  return yc;
}

export function danhSachYeuCauDuLieu(householdId: string): YeuCauDuLieu[] {
  const rs = getDb()
    .prepare("SELECT * FROM data_requests WHERE household_id = ? ORDER BY nhan_luc DESC")
    .all(householdId) as {
    id: string; household_id: string; loai: LoaiYeuCau; noi_dung: string | null;
    nhan_luc: string; han_tiep_nhan: string; han_hoan_thanh: string;
    trang_thai: YeuCauDuLieu["trangThai"]; xu_ly_luc: string | null;
  }[];
  return rs.map((r) => ({
    id: r.id,
    householdId: r.household_id,
    loai: r.loai,
    noiDung: r.noi_dung,
    nhanLuc: r.nhan_luc,
    hanTiepNhan: r.han_tiep_nhan,
    hanHoanThanh: r.han_hoan_thanh,
    trangThai: r.trang_thai,
    xuLyLuc: r.xu_ly_luc,
  }));
}

export interface YeuCauGoBo {
  id: string;
  nguoiGui: string;
  lienHe: string;
  doiTuong: string;
  lyDo: string;
  nhanLuc: string;
  hanXuLy: string;
  trangThai: "moi" | "dang-xem-xet" | "da-go" | "tu-choi";
  ghiChu: string | null;
}

export function taoYeuCauGoBo(input: Omit<YeuCauGoBo, "id" | "nhanLuc" | "hanXuLy" | "trangThai" | "ghiChu">): YeuCauGoBo {
  const now = new Date();
  const han = new Date(now);
  han.setHours(han.getHours() + HAN_GO_BO_GIO);
  const yc: YeuCauGoBo = {
    id: randomUUID(),
    ...input,
    nhanLuc: now.toISOString(),
    hanXuLy: han.toISOString(),
    trangThai: "moi",
    ghiChu: null,
  };
  getDb()
    .prepare(
      `INSERT INTO takedowns (id, nguoi_gui, lien_he, doi_tuong, ly_do, nhan_luc, han_xu_ly, trang_thai, ghi_chu)
       VALUES (?,?,?,?,?,?,?,?,NULL)`,
    )
    .run(yc.id, yc.nguoiGui, yc.lienHe, yc.doiTuong, yc.lyDo, yc.nhanLuc, yc.hanXuLy, yc.trangThai);
  return yc;
}

export function nhatKyGoBo(gioiHan = 50): YeuCauGoBo[] {
  const rs = getDb()
    .prepare("SELECT * FROM takedowns ORDER BY nhan_luc DESC LIMIT ?")
    .all(gioiHan) as {
    id: string; nguoi_gui: string; lien_he: string; doi_tuong: string; ly_do: string;
    nhan_luc: string; han_xu_ly: string; trang_thai: YeuCauGoBo["trangThai"]; ghi_chu: string | null;
  }[];
  return rs.map((r) => ({
    id: r.id,
    nguoiGui: r.nguoi_gui,
    lienHe: r.lien_he,
    doiTuong: r.doi_tuong,
    lyDo: r.ly_do,
    nhanLuc: r.nhan_luc,
    hanXuLy: r.han_xu_ly,
    trangThai: r.trang_thai,
    ghiChu: r.ghi_chu,
  }));
}
