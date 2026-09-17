import { getDb } from "./db";

/**
 * Giới hạn số lần thử mã PIN của cổng phụ huynh.
 *
 * Vì sao cần: PIN bốn chữ số là 10.000 khả năng. Không có gì làm chậm lại thì
 * một đoạn mã tự động thử vài chục lần mỗi giây dò hết trong VÀI PHÚT — không
 * phải vài năm. Sau cánh cửa đó là lời giải đầy đủ của các bài, lịch sử học của
 * con, và nút xuất toàn bộ dữ liệu của hộ.
 *
 * Bốn số vẫn là đúng cho sản phẩm: rào này sinh ra để chặn một đứa trẻ bảy tuổi
 * mượn điện thoại của mẹ, và bắt phụ huynh nhớ mật khẩu dài là đánh đổi sai. Nên
 * chỗ phải siết không phải độ dài mã, mà là TỐC ĐỘ thử. Với chờ luỹ tiến, 10.000
 * khả năng thành nhiều năm, trong khi người gõ nhầm một hai lần không thấy gì.
 *
 * ĐẾM Ở MÁY CHỦ, theo từng hộ. Đếm ở trình duyệt thì xóa cookie là xong, mà kẻ
 * dò mã thì không dùng trình duyệt. Ghi xuống cơ sở dữ liệu chứ không giữ trong
 * bộ nhớ tiến trình: mỗi lần triển khai là một tiến trình mới, và đường lùi khi
 * bản mới không đứng dậy được cũng khởi động lại — một bộ đếm trong bộ nhớ sẽ tự
 * xóa mình đúng vào lúc bận nhất.
 *
 * ĐÁNH ĐỔI, và nó có thật: khóa theo hộ nghĩa là người ngoài dò mã cũng khóa
 * được chính chủ hộ ra ngoài trong mười lăm phút. Cách tránh là khóa theo địa
 * chỉ IP, nhưng nhiều nhà ở Việt Nam ra Internet qua chung một địa chỉ, nên khóa
 * theo IP là khóa nhầm những hộ không liên quan — một kiểu hỏng khó hiểu hơn
 * hẳn với người bị khóa. Chọn khóa theo hộ, và bù lại bằng thời gian ngắn: mười
 * lăm phút thì phiền, nhưng không mất gì.
 */

/** Sai tới lần thứ ba mới bắt đầu chờ. Gõ nhầm một hai lần là chuyện thường. */
export const SAI_TRUOC_KHI_CHO = 3;
/** Chờ khởi điểm, rồi gấp đôi mỗi lần sai tiếp. */
export const CHO_DAU_MS = 2_000;
/** Trần thời gian chờ. Trên mức này thì đằng nào cũng đủ chậm để vô vọng. */
export const CHO_TOI_DA_MS = 16_000;
/** Sai tới lần thứ mười thì khóa hẳn một lúc. */
export const SAI_TRUOC_KHI_KHOA = 10;
export const KHOA_BAO_LAU_MS = 15 * 60_000;

export interface LanThuPin {
  soLanSai: number;
  /** Mốc thời gian lần sai gần nhất, tính bằng mili giây. */
  saiLuc: number | null;
}

export type QuyetDinhThuPin =
  | { choPhep: true }
  | { choPhep: false; conLaiMs: number; lyDo: "cho" | "khoa" };

/**
 * Quyết định có cho thử tiếp không. Thuần tính toán, nhận thời gian vào chứ
 * không tự đọc đồng hồ — để bài kiểm thử tua được thời gian mà không phải chờ
 * thật mười lăm phút.
 */
export function quyetDinhThuPin(lan: LanThuPin, bayGio: number): QuyetDinhThuPin {
  if (lan.soLanSai <= 0 || lan.saiLuc === null) return { choPhep: true };

  if (lan.soLanSai >= SAI_TRUOC_KHI_KHOA) {
    const het = lan.saiLuc + KHOA_BAO_LAU_MS;
    // Hết hạn khóa thì cho thử lại từ đầu, không giữ bộ đếm cũ. Giữ lại thì lần
    // thử thứ mười một bị khóa ngay lập tức, và hộ bị khóa vĩnh viễn sau một
    // buổi tối gõ nhầm — hình phạt không bao giờ nguôi là một lỗi thiết kế.
    return bayGio < het ? { choPhep: false, conLaiMs: het - bayGio, lyDo: "khoa" } : { choPhep: true };
  }

  if (lan.soLanSai >= SAI_TRUOC_KHI_CHO) {
    const cho = Math.min(CHO_TOI_DA_MS, CHO_DAU_MS * 2 ** (lan.soLanSai - SAI_TRUOC_KHI_CHO));
    const het = lan.saiLuc + cho;
    if (bayGio < het) return { choPhep: false, conLaiMs: het - bayGio, lyDo: "cho" };
  }

  return { choPhep: true };
}

/** Bộ đếm có nên xóa về 0 trước khi ghi lần sai mới không (đã qua hạn khóa). */
export function hetHanKhoa(lan: LanThuPin, bayGio: number): boolean {
  return (
    lan.soLanSai >= SAI_TRUOC_KHI_KHOA &&
    lan.saiLuc !== null &&
    bayGio >= lan.saiLuc + KHOA_BAO_LAU_MS
  );
}

/**
 * Câu nói với phụ huynh. Không nói "còn 3 lần nữa là khóa" — câu đó hữu ích cho
 * người dò mã hơn là cho người quên mã, vì nó cho biết chính xác khi nào nên
 * dừng rồi đổi địa chỉ.
 */
export function loiChoDoi(qd: Extract<QuyetDinhThuPin, { choPhep: false }>): string {
  const giay = Math.ceil(qd.conLaiMs / 1000);
  if (qd.lyDo === "khoa") {
    const phut = Math.ceil(giay / 60);
    return `Sai quá nhiều lần. Anh chị thử lại sau ${phut} phút nhé.`;
  }
  return `Sai mấy lần rồi. Anh chị chờ ${giay} giây rồi thử lại nhé.`;
}

/* ---------------------------------------------------------------- kho dữ liệu */

export function docLanThu(hoId: string): LanThuPin {
  const h = getDb()
    .prepare("SELECT pin_sai_lien_tiep AS so, pin_sai_luc AS luc FROM households WHERE id = ?")
    .get(hoId) as { so: number | null; luc: string | null } | undefined;
  if (!h) return { soLanSai: 0, saiLuc: null };
  return { soLanSai: h.so ?? 0, saiLuc: h.luc ? Date.parse(h.luc) : null };
}

export function ghiSai(hoId: string, bayGio: number, batDauLai: boolean): void {
  getDb()
    .prepare(
      batDauLai
        ? "UPDATE households SET pin_sai_lien_tiep = 1, pin_sai_luc = ? WHERE id = ?"
        : "UPDATE households SET pin_sai_lien_tiep = pin_sai_lien_tiep + 1, pin_sai_luc = ? WHERE id = ?",
    )
    .run(new Date(bayGio).toISOString(), hoId);
}

/** Vào được thì xóa sạch bộ đếm — người nhớ ra mã không phải chịu nợ cũ. */
export function xoaDem(hoId: string): void {
  getDb()
    .prepare("UPDATE households SET pin_sai_lien_tiep = 0, pin_sai_luc = NULL WHERE id = ?")
    .run(hoId);
}
