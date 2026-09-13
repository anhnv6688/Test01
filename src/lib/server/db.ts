import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Kho dữ liệu.
 *
 * Một điểm của lược đồ này cần nói rõ vì nó là yêu cầu nghiệp vụ chứ không phải
 * lựa chọn kỹ thuật: KHÔNG có bảng nào, cột nào chứa ảnh gốc do phụ huynh chụp
 * (BR-35). Bảng photo_jobs chỉ giữ kết quả đã cấu trúc hóa. Ảnh sống trong bộ
 * nhớ tiến trình đúng bằng thời gian một lần gọi, xem src/lib/privacy/retention.ts.
 *
 * Điểm thứ hai: không có cột nào lưu ảnh hay đặc trưng khuôn mặt trẻ (NT-03),
 * và không có cột nào lưu đặc trưng nét chữ (CR-18). Nét chữ chỉ được đọc thành
 * chữ số rồi bỏ; không trích xuất đặc trưng, không so khớp giữa các lần nộp.
 */
const DUONG_DAN = process.env.OLY_DB ?? ".data/oly.sqlite";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  if (DUONG_DAN !== ":memory:") mkdirSync(dirname(DUONG_DAN), { recursive: true });
  db = new Database(DUONG_DAN);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  taoBang(db);
  return db;
}

function taoBang(d: Database.Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS households (
      id TEXT PRIMARY KEY,
      ten TEXT NOT NULL,
      dia_ban TEXT NOT NULL CHECK (dia_ban IN ('do-thi','tinh')),
      goi TEXT NOT NULL,
      het_han_at TEXT,
      pin TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Không có cột ảnh, không có cột ngày sinh đầy đủ: chỉ giữ đúng mức cần để
    -- chọn đúng khối lớp (nguyên tắc tối thiểu hóa dữ liệu).
    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      ten_goi TEXT NOT NULL,
      lop INTEGER NOT NULL CHECK (lop IN (1,2)),
      created_at TEXT NOT NULL
    );

    -- Kế hoạch phiên nằm ở đây chứ không chỉ trong bộ nhớ tiến trình: trẻ tải
    -- lại trang hoặc máy chủ khởi động lại thì phiên vẫn đi tiếp được. Cột
    -- ke_json chỉ chứa các cặp (mã khuôn dạng, hạt) — không có đáp án, nên lưu
    -- xuống đây không làm lộ gì cho bề mặt của trẻ (BR-03).
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      bat_dau TEXT NOT NULL,
      ket_thuc TEXT,
      hat_giong INTEGER NOT NULL DEFAULT 0,
      ke_json TEXT NOT NULL DEFAULT '[]',
      vi_tri INTEGER NOT NULL DEFAULT 0,
      bac_goi_y INTEGER NOT NULL DEFAULT 0,
      lan_thu INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL,
      template_id TEXT NOT NULL,
      yccd TEXT NOT NULL,
      given INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      trap_id TEXT,
      hints_used INTEGER NOT NULL,
      attempt_no INTEGER NOT NULL,
      elapsed_ms INTEGER NOT NULL,
      at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS consents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      muc_dich TEXT NOT NULL,
      dong_y INTEGER NOT NULL,
      at TEXT NOT NULL,
      phien_ban_van_ban TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meter_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      hanh_vi TEXT NOT NULL,
      chi_phi_uoc_tinh INTEGER NOT NULL,
      at TEXT NOT NULL
    );

    -- Chỉ kết quả đã cấu trúc hóa. Cố ý không có cột ảnh (BR-35).
    CREATE TABLE IF NOT EXISTS photo_jobs (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      loai TEXT NOT NULL,
      thanh_cong INTEGER NOT NULL,
      ket_qua_json TEXT,
      ma_loi TEXT,
      vung_da_che_json TEXT NOT NULL,
      at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS data_requests (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      loai TEXT NOT NULL,
      noi_dung TEXT,
      nhan_luc TEXT NOT NULL,
      han_tiep_nhan TEXT NOT NULL,
      han_hoan_thanh TEXT NOT NULL,
      trang_thai TEXT NOT NULL,
      xu_ly_luc TEXT
    );

    CREATE TABLE IF NOT EXISTS takedowns (
      id TEXT PRIMARY KEY,
      nguoi_gui TEXT NOT NULL,
      lien_he TEXT NOT NULL,
      doi_tuong TEXT NOT NULL,
      ly_do TEXT NOT NULL,
      nhan_luc TEXT NOT NULL,
      han_xu_ly TEXT NOT NULL,
      trang_thai TEXT NOT NULL,
      ghi_chu TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_attempts_child ON attempts(child_id, at);
    CREATE INDEX IF NOT EXISTS idx_meter_household ON meter_events(household_id, at);
  `);
}
