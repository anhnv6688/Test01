import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { CHI_PHI_MOI_TRANG_GIA_DINH, type LuotDung } from "@/lib/domain/metering";
import { PHIEN_BAN_VAN_BAN_DONG_Y, type BanGhiDongY, type MucDich } from "@/lib/privacy/consent";
import type { MaGoi, DiaBan } from "@/lib/domain/pricing";
import type { Attempt } from "@/lib/domain/types";

export interface Ho {
  id: string;
  ten: string;
  diaBan: DiaBan;
  goi: MaGoi;
  hetHanAt: string | null;
  pin: string;
}

export interface Con {
  id: string;
  householdId: string;
  tenGoi: string;
  lop: 1 | 2;
}

type HoRow = { id: string; ten: string; dia_ban: DiaBan; goi: MaGoi; het_han_at: string | null; pin: string };
type ConRow = { id: string; household_id: string; ten_goi: string; lop: 1 | 2 };

function doiHo(r: HoRow): Ho {
  return { id: r.id, ten: r.ten, diaBan: r.dia_ban, goi: r.goi, hetHanAt: r.het_han_at, pin: r.pin };
}

function doiCon(r: ConRow): Con {
  return { id: r.id, householdId: r.household_id, tenGoi: r.ten_goi, lop: r.lop };
}

export function layHo(id: string): Ho | null {
  const r = getDb().prepare("SELECT * FROM households WHERE id = ?").get(id) as HoRow | undefined;
  return r ? doiHo(r) : null;
}

export function hoDauTien(): Ho | null {
  const r = getDb().prepare("SELECT * FROM households ORDER BY created_at LIMIT 1").get() as HoRow | undefined;
  return r ? doiHo(r) : null;
}

/** BR-11: một thuê bao phục vụ cả hộ, không giới hạn số con. */
export function danhSachCon(householdId: string): Con[] {
  const rs = getDb()
    .prepare("SELECT * FROM children WHERE household_id = ? ORDER BY created_at")
    .all(householdId) as ConRow[];
  return rs.map(doiCon);
}

export function layCon(id: string): Con | null {
  const r = getDb().prepare("SELECT * FROM children WHERE id = ?").get(id) as ConRow | undefined;
  return r ? doiCon(r) : null;
}

export function themCon(householdId: string, tenGoi: string, lop: 1 | 2): Con {
  const id = randomUUID();
  getDb()
    .prepare("INSERT INTO children (id, household_id, ten_goi, lop, created_at) VALUES (?,?,?,?,?)")
    .run(id, householdId, tenGoi, lop, new Date().toISOString());
  return { id, householdId, tenGoi, lop };
}

export interface TienDoPhien {
  sessionId: string;
  childId: string;
  batDau: string;
  ke: { templateId: string; seed: number }[];
  viTri: number;
  bacGoiYDaMo: number;
  lanThu: number;
  daDong: boolean;
}

export function moPhien(
  sessionId: string,
  childId: string,
  batDau: string,
  ke: { templateId: string; seed: number }[] = [],
): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO sessions (id, child_id, bat_dau, ket_thuc, hat_giong, ke_json, vi_tri, bac_goi_y, lan_thu)
       VALUES (?,?,?,NULL,0,?,0,0,1)`,
    )
    .run(sessionId, childId, batDau, JSON.stringify(ke));
}

/** Đọc lại phiên từ kho, dùng khi bộ nhớ tiến trình không còn giữ phiên đó. */
export function docPhien(sessionId: string): TienDoPhien | null {
  const r = getDb().prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as
    | { id: string; child_id: string; bat_dau: string; ket_thuc: string | null;
        ke_json: string; vi_tri: number; bac_goi_y: number; lan_thu: number }
    | undefined;
  if (!r) return null;
  return {
    sessionId: r.id,
    childId: r.child_id,
    batDau: r.bat_dau,
    ke: JSON.parse(r.ke_json) as { templateId: string; seed: number }[],
    viTri: r.vi_tri,
    bacGoiYDaMo: r.bac_goi_y,
    lanThu: r.lan_thu,
    daDong: r.ket_thuc !== null,
  };
}

export function ghiTienDoPhien(
  sessionId: string,
  viTri: number,
  bacGoiYDaMo: number,
  lanThu: number,
): void {
  getDb()
    .prepare("UPDATE sessions SET vi_tri = ?, bac_goi_y = ?, lan_thu = ? WHERE id = ?")
    .run(viTri, bacGoiYDaMo, lanThu, sessionId);
}

export function dongPhien(sessionId: string, hatGiong: number): void {
  getDb()
    .prepare("UPDATE sessions SET ket_thuc = ?, hat_giong = ? WHERE id = ?")
    .run(new Date().toISOString(), hatGiong, sessionId);
}

export function ghiLanTraLoi(sessionId: string, childId: string, a: Attempt): void {
  getDb()
    .prepare(
      `INSERT INTO attempts
       (session_id, child_id, item_id, template_id, yccd, given, correct, trap_id, hints_used, attempt_no, elapsed_ms, at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      sessionId, childId, a.itemId, a.templateId, a.yccd, a.given,
      a.correct ? 1 : 0, a.trapId, a.hintsUsed, a.attemptNo, a.elapsedMs, a.at,
    );
}

type AttemptRow = {
  item_id: string; template_id: string; yccd: string; given: number; correct: number;
  trap_id: string | null; hints_used: number; attempt_no: number; elapsed_ms: number; at: string;
};

function doiAttempt(r: AttemptRow): Attempt {
  return {
    itemId: r.item_id,
    templateId: r.template_id,
    yccd: r.yccd,
    given: r.given,
    correct: r.correct === 1,
    trapId: r.trap_id,
    hintsUsed: r.hints_used,
    attemptNo: r.attempt_no,
    elapsedMs: r.elapsed_ms,
    at: r.at,
  };
}

/**
 * BR-09: dữ liệu và lịch sử học tập của trẻ không bao giờ bị khóa khi thuê bao
 * hết hạn. Vì vậy hàm này KHÔNG nhận tham số nào về gói cước hay hạn thuê bao —
 * không có chỗ nào để cắm một điều kiện chặn vào.
 */
export function lichSuCuaCon(childId: string, gioiHan = 500): Attempt[] {
  const rs = getDb()
    .prepare("SELECT * FROM attempts WHERE child_id = ? ORDER BY at DESC LIMIT ?")
    .all(childId, gioiHan) as AttemptRow[];
  return rs.map(doiAttempt).reverse();
}

export function lanTraLoiTheoPhien(sessionId: string): Attempt[] {
  const rs = getDb()
    .prepare("SELECT * FROM attempts WHERE session_id = ? ORDER BY at")
    .all(sessionId) as AttemptRow[];
  return rs.map(doiAttempt);
}

export function lanTraLoiTrongNgay(childId: string, ngay: string): Attempt[] {
  const rs = getDb()
    .prepare("SELECT * FROM attempts WHERE child_id = ? AND at LIKE ? ORDER BY at")
    .all(childId, `${ngay}%`) as AttemptRow[];
  return rs.map(doiAttempt);
}

export function ghiDongY(householdId: string, mucDich: MucDich, dongY: boolean): void {
  getDb()
    .prepare(
      "INSERT INTO consents (household_id, muc_dich, dong_y, at, phien_ban_van_ban) VALUES (?,?,?,?,?)",
    )
    .run(householdId, mucDich, dongY ? 1 : 0, new Date().toISOString(), PHIEN_BAN_VAN_BAN_DONG_Y);
}

export function lichSuDongY(householdId: string): BanGhiDongY[] {
  const rs = getDb()
    .prepare("SELECT * FROM consents WHERE household_id = ? ORDER BY at")
    .all(householdId) as {
    household_id: string; muc_dich: MucDich; dong_y: number; at: string; phien_ban_van_ban: string;
  }[];
  return rs.map((r) => ({
    householdId: r.household_id,
    mucDich: r.muc_dich,
    dongY: r.dong_y === 1,
    at: r.at,
    phienBanVanBan: r.phien_ban_van_ban,
  }));
}

/** BR-31: chỉ gọi hàm này SAU khi đã có kết quả trả về cho phụ huynh. */
export function ghiLuotXuLyTrang(householdId: string): void {
  getDb()
    .prepare("INSERT INTO meter_events (household_id, hanh_vi, chi_phi_uoc_tinh, at) VALUES (?,?,?,?)")
    .run(householdId, "xu-ly-trang-anh", CHI_PHI_MOI_TRANG_GIA_DINH, new Date().toISOString());
}

export function soTrangDaDungThangNay(householdId: string, moc = new Date()): number {
  return demTrang(householdId, moc.toISOString().slice(0, 7));
}

/**
 * Số trang đã xử lý trong ngày hôm nay.
 *
 * Trần của gói miễn phí tính theo ngày và lượt thừa không cộng dồn (VM-07, chốt
 * ngày 13/9/2026). Việc "không cộng dồn" không cần cơ chế nào để thực hiện: hàm
 * này chỉ đếm các lượt phát sinh trong đúng ngày đang xét, nên không tồn tại
 * kho lượt tích lũy nào để mà cộng dồn.
 *
 * Mốc ngày tính theo giờ Việt Nam chứ không theo giờ quốc tế, vì lượt phải làm
 * mới lúc nửa đêm ở nhà người dùng. Nếu cắt theo giờ quốc tế thì với múi giờ
 * +07:00, lượt sẽ làm mới lúc bảy giờ sáng — đúng vào giữa giờ trẻ chuẩn bị đi
 * học, và phụ huynh sẽ thấy lượt "hết" một cách khó hiểu suốt buổi tối.
 */
export function soTrangDaDungHomNay(householdId: string, moc = new Date()): number {
  return demTrang(householdId, ngayVietNam(moc));
}

export function mucDaDung(householdId: string, moc = new Date()): { homNay: number; thangNay: number } {
  return {
    homNay: soTrangDaDungHomNay(householdId, moc),
    thangNay: soTrangDaDungThangNay(householdId, moc),
  };
}

/** Ngày theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function ngayVietNam(moc = new Date()): string {
  return new Date(moc.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

/**
 * Đếm số lượt có dấu thời gian bắt đầu bằng tiền tố cho trước.
 *
 * Với trần theo ngày, tiền tố là ngày giờ Việt Nam, nên cột at phải được so
 * theo giờ Việt Nam chứ không theo giờ quốc tế đã lưu. Vì vậy phép so dịch cột
 * at đi bảy giờ ngay trong câu truy vấn.
 */
function demTrang(householdId: string, tienTo: string): number {
  const theoGioVN = "strftime('%Y-%m-%dT%H:%M:%S', at, '+7 hours')";
  const r = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM meter_events WHERE household_id = ? AND ${theoGioVN} LIKE ?`,
    )
    .get(householdId, `${tienTo}%`) as { n: number };
  return r.n;
}

export function luotDungCuaHo(householdId: string): LuotDung[] {
  const rs = getDb()
    .prepare("SELECT * FROM meter_events WHERE household_id = ? ORDER BY at")
    .all(householdId) as { household_id: string; hanh_vi: string; chi_phi_uoc_tinh: number; at: string }[];
  return rs.map((r) => ({
    householdId: r.household_id,
    hanhVi: "xu-ly-trang-anh",
    at: r.at,
    chiPhiUocTinh: r.chi_phi_uoc_tinh,
  }));
}

export interface ViecAnh {
  id: string;
  householdId: string;
  loai: "doc-de-bai" | "cham-bai-lam";
  thanhCong: boolean;
  ketQua: unknown;
  maLoi: string | null;
  at: string;
}

export function ghiViecAnh(v: Omit<ViecAnh, "id" | "at"> & { vungDaChe: unknown }): string {
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO photo_jobs (id, household_id, loai, thanh_cong, ket_qua_json, ma_loi, vung_da_che_json, at)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .run(
      id, v.householdId, v.loai, v.thanhCong ? 1 : 0,
      v.ketQua ? JSON.stringify(v.ketQua) : null, v.maLoi,
      JSON.stringify(v.vungDaChe), new Date().toISOString(),
    );
  return id;
}

export function lichSuViecAnh(householdId: string, gioiHan = 50): ViecAnh[] {
  const rs = getDb()
    .prepare("SELECT * FROM photo_jobs WHERE household_id = ? ORDER BY at DESC LIMIT ?")
    .all(householdId, gioiHan) as {
    id: string; household_id: string; loai: ViecAnh["loai"]; thanh_cong: number;
    ket_qua_json: string | null; ma_loi: string | null; at: string;
  }[];
  return rs.map((r) => ({
    id: r.id,
    householdId: r.household_id,
    loai: r.loai,
    thanhCong: r.thanh_cong === 1,
    ketQua: r.ket_qua_json ? JSON.parse(r.ket_qua_json) : null,
    maLoi: r.ma_loi,
    at: r.at,
  }));
}
