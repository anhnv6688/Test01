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

/* ------------------------------------------------------------------------ */
/* Nhật ký xử lý và các hành động của người trực                             */
/* ------------------------------------------------------------------------ */

export interface DongNhatKy {
  id: number;
  loaiYeuCau: "du-lieu" | "go-bo";
  maYeuCau: string;
  hanhDong: string;
  tuTrangThai: string | null;
  sangTrangThai: string;
  nguoiTruc: string;
  ghiChu: string | null;
  dungHan: boolean;
  at: string;
}

/**
 * Ghi một dòng nhật ký.
 *
 * Trường dungHan được chốt TẠI THỜI ĐIỂM xử lý chứ không tính lại về sau. Nếu
 * tính lại thì một yêu cầu xử lý đúng hạn hôm nay sẽ vẫn hiện là đúng hạn, còn
 * một yêu cầu xử lý muộn sẽ mãi mãi hiện là muộn — nghe thì giống nhau, nhưng
 * chốt sẵn mới là bằng chứng, tính lại chỉ là suy đoán từ dữ liệu hiện tại.
 */
export function ghiNhatKy(d: Omit<DongNhatKy, "id" | "at">): void {
  getDb()
    .prepare(
      `INSERT INTO nhat_ky_xu_ly
       (loai_yeu_cau, ma_yeu_cau, hanh_dong, tu_trang_thai, sang_trang_thai, nguoi_truc, ghi_chu, dung_han, at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      d.loaiYeuCau, d.maYeuCau, d.hanhDong, d.tuTrangThai, d.sangTrangThai,
      d.nguoiTruc, d.ghiChu, d.dungHan ? 1 : 0, new Date().toISOString(),
    );
}

type NhatKyRow = {
  id: number; loai_yeu_cau: "du-lieu" | "go-bo"; ma_yeu_cau: string; hanh_dong: string;
  tu_trang_thai: string | null; sang_trang_thai: string; nguoi_truc: string;
  ghi_chu: string | null; dung_han: number; at: string;
};

function doiNhatKy(r: NhatKyRow): DongNhatKy {
  return {
    id: r.id,
    loaiYeuCau: r.loai_yeu_cau,
    maYeuCau: r.ma_yeu_cau,
    hanhDong: r.hanh_dong,
    tuTrangThai: r.tu_trang_thai,
    sangTrangThai: r.sang_trang_thai,
    nguoiTruc: r.nguoi_truc,
    ghiChu: r.ghi_chu,
    dungHan: r.dung_han === 1,
    at: r.at,
  };
}

export function nhatKyXuLy(gioiHan = 200): DongNhatKy[] {
  const rs = getDb()
    .prepare("SELECT * FROM nhat_ky_xu_ly ORDER BY at DESC LIMIT ?")
    .all(gioiHan) as NhatKyRow[];
  return rs.map(doiNhatKy);
}

export function nhatKyCuaYeuCau(maYeuCau: string): DongNhatKy[] {
  const rs = getDb()
    .prepare("SELECT * FROM nhat_ky_xu_ly WHERE ma_yeu_cau = ? ORDER BY at")
    .all(maYeuCau) as NhatKyRow[];
  return rs.map(doiNhatKy);
}

/** Mọi yêu cầu dữ liệu của mọi hộ — dùng cho bảng trực. */
export function moiYeuCauDuLieu(): YeuCauDuLieu[] {
  const rs = getDb()
    .prepare("SELECT * FROM data_requests ORDER BY han_hoan_thanh")
    .all() as {
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

export function doiTrangThaiYeuCauDuLieu(
  id: string,
  sang: YeuCauDuLieu["trangThai"],
): void {
  getDb()
    .prepare("UPDATE data_requests SET trang_thai = ?, xu_ly_luc = ? WHERE id = ?")
    .run(sang, sang === "hoan-thanh" ? new Date().toISOString() : null, id);
}

export function doiTrangThaiGoBo(id: string, sang: YeuCauGoBo["trangThai"], ghiChu: string | null): void {
  getDb()
    .prepare("UPDATE takedowns SET trang_thai = ?, ghi_chu = ? WHERE id = ?")
    .run(sang, ghiChu, id);
}

export function layYeuCauGoBo(id: string): YeuCauGoBo | null {
  return nhatKyGoBo(500).find((x) => x.id === id) ?? null;
}

export function layYeuCauDuLieu(id: string): YeuCauDuLieu | null {
  return moiYeuCauDuLieu().find((x) => x.id === id) ?? null;
}
