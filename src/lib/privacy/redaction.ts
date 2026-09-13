/**
 * Lớp thứ nhất của thiết kế ba lớp: cắt ảnh NGAY TRÊN THIẾT BỊ (BR-32).
 *
 * Cách viết cũ ở BRD 1.1 — "khử nhận dạng trước khi rời hệ thống" — dễ bị hiểu
 * là làm ở phía máy chủ, mà làm ở máy chủ thì công ty vẫn đã tiếp nhận và lưu
 * ảnh có tên. Bản 1.2 sửa lại: việc che phải xong trước khi ảnh rời điện thoại.
 *
 * Bảo đảm thật của yêu cầu này nằm ở KIẾN TRÚC chứ không ở đoạn mã kiểm tra:
 * trình duyệt vẽ ảnh lên canvas, tô đè vùng chứa họ tên — tên lớp — tên trường,
 * rồi chỉ xuất ra ảnh đã tô đè. Pixel gốc của vùng đó không bao giờ được đóng
 * gói vào yêu cầu mạng. Phần kiểm tra ở máy chủ dưới đây là lớp chặn phụ, dùng
 * để bắt lỗi lập trình và để có dấu vết trong nhật ký khi rà soát (điều kiện ra
 * mắt số 10 đòi kiểm tra bằng nhật ký, không chỉ bằng tài liệu mô tả).
 */

/** Vùng đã tô đè, theo tỷ lệ 0–1 so với kích thước ảnh. */
export interface VungDaChe {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChungTuCheAnh {
  /** Trình duyệt khẳng định đã tô đè trước khi mã hóa ảnh. */
  daCheTrenThietBi: true;
  vung: VungDaChe[];
  /** Siêu dữ liệu EXIF đã bị loại bỏ khi vẽ lại qua canvas. */
  daBoExif: true;
  /** Phiên bản đoạn mã che, để đối chiếu khi rà soát nhật ký. */
  phienBan: string;
}

export const PHIEN_BAN_CHE = "che-tren-thiet-bi@1";

/** Vùng che tối thiểu: dải đầu trang, nơi trẻ viết họ tên — lớp — trường. */
export const VUNG_DAU_TRANG_MAC_DINH: VungDaChe = { x: 0, y: 0, w: 1, h: 0.16 };

export class ThieuCheAnhError extends Error {
  constructor(lyDo: string) {
    super(`Ảnh bị từ chối vì chưa đạt yêu cầu che thông tin cá nhân: ${lyDo}`);
    this.name = "ThieuCheAnhError";
  }
}

/**
 * Chặn ở máy chủ. Thà từ chối một ảnh hợp lệ còn hơn nhận một ảnh có tên trẻ.
 */
export function kiemTraChungTuChe(ct: unknown): asserts ct is ChungTuCheAnh {
  if (!ct || typeof ct !== "object") throw new ThieuCheAnhError("thiếu chứng từ che");
  const c = ct as Partial<ChungTuCheAnh>;
  if (c.daCheTrenThietBi !== true) throw new ThieuCheAnhError("chưa che trên thiết bị");
  if (c.daBoExif !== true) throw new ThieuCheAnhError("chưa loại bỏ siêu dữ liệu ảnh");
  if (!Array.isArray(c.vung) || c.vung.length === 0) throw new ThieuCheAnhError("không có vùng nào được tô đè");
  const dienTich = c.vung.reduce((s, v) => s + Math.max(0, v.w) * Math.max(0, v.h), 0);
  if (dienTich <= 0.005) throw new ThieuCheAnhError("vùng tô đè quá nhỏ, không thể phủ hết dải họ tên");
}
