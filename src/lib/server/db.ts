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
    -- Cột nam_sinh và thang_sinh thêm ở phần di trú bên dưới, không lưu NGÀY
    -- sinh: xem src/lib/privacy/tuoi.ts để biết vì sao tháng năm là mức tối
    -- thiểu mà vẫn tính lại được mốc 7 tuổi về sau (CR-05).
    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      ten_goi TEXT NOT NULL,
      lop INTEGER NOT NULL CHECK (lop IN (1,2)),
      created_at TEXT NOT NULL
    );

    /*
     * Người đại diện theo pháp luật của trẻ (CR-05).
     *
     * Bảng riêng chứ không phải vài cột trong households, vì đây là bằng chứng
     * pháp lý có thời điểm và có phiên bản văn bản: nó phải giữ được cả bản ghi
     * cũ khi người giám hộ xác minh lại bằng phương thức mạnh hơn. Bản đang có
     * hiệu lực là bản mới nhất.
     */
    CREATE TABLE IF NOT EXISTS guardians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      quan_he TEXT NOT NULL CHECK (quan_he IN ('cha','me','nguoi-giam-ho')),
      ho_ten TEXT NOT NULL,
      phuong_thuc TEXT NOT NULL,
      tu_xac_nhan_dai_dien INTEGER NOT NULL,
      phien_ban_van_ban TEXT NOT NULL,
      xac_minh_luc TEXT NOT NULL
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

    /*
     * Sự đồng ý. Hai cột nguoi_dong_y và child_id thêm ở phần di trú bên dưới.
     *
     * Vì sao phải phân biệt AI đồng ý: với trẻ từ đủ 7 tuổi, quy định đòi sự
     * đồng ý của CẢ trẻ lẫn người giám hộ. Hai sự đồng ý đó không thay thế được
     * cho nhau, nên không thể gộp vào cùng một dòng. Sự đồng ý của người giám
     * hộ áp cho cả hộ (child_id để trống); sự đồng ý của trẻ gắn với đúng đứa
     * trẻ đó, vì một hộ có thể có bé lớp 1 sáu tuổi và bé lớp 2 tám tuổi, và
     * hai bé thuộc hai chế độ khác nhau.
     */
    CREATE TABLE IF NOT EXISTS consents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      muc_dich TEXT NOT NULL,
      dong_y INTEGER NOT NULL,
      at TEXT NOT NULL,
      phien_ban_van_ban TEXT NOT NULL
    );

    -- Cột tang ghi lần xử lý này thuộc tầng nào: 1 là chỉ phiên âm, 2 là có
    -- gọi thêm mô hình soạn giảng. Tách ra để đo được TẦN SUẤT TẦNG 2 trong
    -- vận hành thật — đó là biến quyết định chi phí trung bình mỗi trang, và
    -- hiện chưa ai đo (BR-22, điều kiện ra mắt số 3).
    CREATE TABLE IF NOT EXISTS meter_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      hanh_vi TEXT NOT NULL,
      chi_phi_uoc_tinh INTEGER NOT NULL,
      tang INTEGER NOT NULL DEFAULT 1,
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

    /*
     * Nhật ký xử lý yêu cầu.
     *
     * CR-06 đòi "nhật ký xử lý đầy đủ" và BO-05 đòi chứng minh được sự tuân
     * thủ khi bị kiểm tra. Vì vậy bảng này CỐ Ý KHÔNG có khóa ngoại tới
     * households: khi một hộ yêu cầu xóa dữ liệu và Ô Ly xóa thật, bản ghi
     * yêu cầu của họ mất theo, nhưng dấu vết "đã nhận yêu cầu này, đã xử lý
     * lúc này, đúng hạn hay không" phải còn lại. Nếu bảng này cũng bị xóa dây
     * chuyền thì việc tuân thủ tốt nhất lại xóa mất bằng chứng tuân thủ.
     *
     * Đổi lại, bảng này tuyệt đối không được chứa dữ liệu cá nhân — chỉ mã
     * yêu cầu, loại, hành động, người trực và mốc thời gian.
     */
    CREATE TABLE IF NOT EXISTS nhat_ky_xu_ly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loai_yeu_cau TEXT NOT NULL CHECK (loai_yeu_cau IN ('du-lieu','go-bo')),
      ma_yeu_cau TEXT NOT NULL,
      hanh_dong TEXT NOT NULL,
      tu_trang_thai TEXT,
      sang_trang_thai TEXT NOT NULL,
      nguoi_truc TEXT NOT NULL,
      ghi_chu TEXT,
      dung_han INTEGER NOT NULL,
      at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_guardians_ho ON guardians(household_id, xac_minh_luc);
    CREATE INDEX IF NOT EXISTS idx_nhat_ky_ma ON nhat_ky_xu_ly(ma_yeu_cau, at);
    CREATE INDEX IF NOT EXISTS idx_attempts_child ON attempts(child_id, at);
    CREATE INDEX IF NOT EXISTS idx_meter_household ON meter_events(household_id, at);
  `);
  diTru(d);
}

/**
 * Thêm cột cho cơ sở dữ liệu đã tồn tại.
 *
 * CREATE TABLE IF NOT EXISTS không đụng tới bảng đã có, nên cột mới phải thêm
 * riêng. Mọi cột thêm ở đây đều phải cho phép rỗng hoặc có giá trị mặc định:
 * một hộ đã đăng ký từ trước không có gì để điền vào cột mới, và cổng kiểm tra
 * ở src/lib/privacy/nguoi-giam-ho.ts sẽ coi ô rỗng là CHƯA đủ điều kiện chứ
 * không coi là đã đủ.
 */
function diTru(d: Database.Database): void {
  themCotNeuThieu(d, "children", "nam_sinh", "INTEGER");
  themCotNeuThieu(d, "children", "thang_sinh", "INTEGER");
  themCotNeuThieu(d, "consents", "nguoi_dong_y", "TEXT NOT NULL DEFAULT 'nguoi-giam-ho'");
  themCotNeuThieu(d, "consents", "child_id", "TEXT");
}

function themCotNeuThieu(
  d: Database.Database,
  bang: string,
  cot: string,
  kieu: string,
): void {
  const cols = d.prepare(`PRAGMA table_info(${bang})`).all() as { name: string }[];
  if (cols.some((c) => c.name === cot)) return;
  d.exec(`ALTER TABLE ${bang} ADD COLUMN ${cot} ${kieu}`);
}
