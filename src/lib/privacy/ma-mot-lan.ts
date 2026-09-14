import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Mã một lần gửi qua số điện thoại — phần thuần túy, không đụng cơ sở dữ liệu.
 *
 * Đây là một thông tin xác thực, nên nó được đối xử như mật khẩu chứ không như
 * một con số tiện tay:
 *
 *   Không lưu mã dưới dạng rõ. Chỉ lưu bản băm, để một lần lộ cơ sở dữ liệu
 *   hay một dòng nhật ký lỡ tay không biến thành lộ mã đang có hiệu lực.
 *
 *   Băm bằng scrypt chứ không phải SHA-256. Mã chỉ có sáu chữ số, tức một
 *   triệu khả năng — SHA-256 dò hết một triệu khả năng mất chưa tới một giây.
 *   scrypt cố ý chậm, nên cùng việc đó mất hàng giờ. Không cần thêm khóa bí mật
 *   nào ở biến môi trường, và đó là chủ đích: một khóa có thể quên đặt, còn
 *   scrypt thì không quên được.
 *
 *   So sánh bằng timingSafeEqual. So bằng === sẽ dừng ở byte đầu khác nhau, và
 *   thời gian trả lời rò rỉ dần từng ký tự của mã.
 *
 * Hạn dùng ngắn và số lần sai có trần là hai lớp còn lại: chúng khiến việc dò
 * trực tuyến vô dụng ngay cả khi scrypt không có ở đó.
 */

export const SO_CHU_SO = 6;
export const HAN_DUNG_PHUT = 5;
export const SO_LAN_SAI_TOI_DA = 5;
/** Phải chờ bấy nhiêu giây mới xin được mã mới. */
export const CHO_GIUA_HAI_LAN_GUI_GIAY = 60;
/** Trần số lần gửi trong một giờ, tính cho từng hộ và cho từng số máy. */
export const TRAN_GUI_MOI_GIO = 3;

/** Sinh mã sáu chữ số bằng nguồn ngẫu nhiên an toàn, kể cả mã bắt đầu bằng 0. */
export function sinhMa(): string {
  return String(randomInt(0, 10 ** SO_CHU_SO)).padStart(SO_CHU_SO, "0");
}

export interface MaDaBam {
  bam: string;
  muoi: string;
}

export function bamMa(ma: string, muoi = randomBytes(16).toString("hex")): MaDaBam {
  return { bam: scryptSync(ma, muoi, 32).toString("hex"), muoi };
}

export function khopMa(maNguoiGo: string, daBam: MaDaBam): boolean {
  const thu = Buffer.from(scryptSync(maNguoiGo, daBam.muoi, 32).toString("hex"));
  const that = Buffer.from(daBam.bam);
  if (thu.length !== that.length) return false;
  return timingSafeEqual(thu, that);
}

/* ------------------------------------------------------------------ */
/* Chính sách: khi nào được gửi, khi nào mã còn dùng được             */
/* ------------------------------------------------------------------ */

export type LyDoTuChoiGui =
  | "vua-gui-xong"
  | "gui-qua-nhieu-trong-gio"
  | "so-may-nhan-qua-nhieu";

export const NOI_GI_KHI_TU_CHOI_GUI: Record<LyDoTuChoiGui, string> = {
  "vua-gui-xong": `Ô Ly vừa gửi mã xong. Anh chị đợi ${CHO_GIUA_HAI_LAN_GUI_GIAY} giây rồi xin mã mới nhé, tin nhắn đôi khi tới chậm một chút.`,
  "gui-qua-nhieu-trong-gio": `Hộ mình đã xin mã ${TRAN_GUI_MOI_GIO} lần trong một giờ. Anh chị thử lại sau một giờ, hoặc kiểm tra lại xem đã gõ đúng số máy chưa.`,
  "so-may-nhan-qua-nhieu": `Số máy này đã nhận ${TRAN_GUI_MOI_GIO} tin nhắn trong một giờ rồi. Ô Ly dừng gửi để không làm phiền chủ máy.`,
};

export interface DauVaoXinGui {
  /** Mốc thời gian các lần đã gửi cho HỘ này trong một giờ gần đây. */
  lanGuiCuaHo: Date[];
  /** Mốc thời gian các lần đã gửi tới SỐ MÁY này trong một giờ gần đây. */
  lanGuiToiSoMay: Date[];
}

/**
 * Có được gửi mã lúc này không.
 *
 * Đếm theo cả hai chiều là có lý do. Đếm theo hộ chặn một tài khoản tự bấm
 * liên tục. Đếm theo số máy chặn việc dùng Ô Ly làm công cụ nhắn tin quấy rối
 * một người ngoài — kẻ muốn làm vậy chỉ cần lập nhiều tài khoản là qua được
 * giới hạn theo hộ, nhưng số máy nạn nhân thì vẫn chỉ có một.
 */
export function duocGuiKhong(dv: DauVaoXinGui, moc = new Date()): LyDoTuChoiGui | null {
  const motGioTruoc = moc.getTime() - 3600_000;
  const trongGio = (ds: Date[]) => ds.filter((d) => d.getTime() >= motGioTruoc);

  const cuaHo = trongGio(dv.lanGuiCuaHo);
  const moiNhat = [...cuaHo].sort((a, b) => b.getTime() - a.getTime())[0];
  if (moiNhat && moc.getTime() - moiNhat.getTime() < CHO_GIUA_HAI_LAN_GUI_GIAY * 1000) {
    return "vua-gui-xong";
  }
  if (cuaHo.length >= TRAN_GUI_MOI_GIO) return "gui-qua-nhieu-trong-gio";
  if (trongGio(dv.lanGuiToiSoMay).length >= TRAN_GUI_MOI_GIO) return "so-may-nhan-qua-nhieu";
  return null;
}

export type LyDoMaHong = "het-han" | "da-dung" | "sai-qua-nhieu-lan" | "sai-ma";

export const NOI_GI_KHI_MA_HONG: Record<LyDoMaHong, string> = {
  "het-han": `Mã đã quá hạn ${HAN_DUNG_PHUT} phút. Anh chị bấm xin mã mới nhé.`,
  "da-dung": "Mã này đã dùng rồi. Anh chị xin mã mới nếu cần xác minh lại.",
  "sai-qua-nhieu-lan": `Đã nhập sai ${SO_LAN_SAI_TOI_DA} lần nên mã này không dùng được nữa. Anh chị xin mã mới nhé.`,
  "sai-ma": "Mã chưa đúng. Anh chị kiểm tra lại tin nhắn giúp nhé.",
};

export interface BanGhiMa {
  daBam: MaDaBam;
  hetHanLuc: Date;
  soLanSai: number;
  daDung: boolean;
}

/**
 * Kiểm mã người dùng gõ.
 *
 * Thứ tự kiểm cố ý đặt các lý do KHÔNG phụ thuộc vào mã lên trước, và chỉ chạy
 * scrypt ở bước cuối. Nhờ vậy một mã đã hết hạn không tốn một lần băm chậm, và
 * việc dò mã không dùng được chính hàm này làm công cụ tiêu tài nguyên máy chủ.
 */
export function kiemMa(
  ban: BanGhiMa,
  maNguoiGo: string,
  moc = new Date(),
): { dung: true } | { dung: false; lyDo: LyDoMaHong } {
  if (ban.daDung) return { dung: false, lyDo: "da-dung" };
  if (ban.soLanSai >= SO_LAN_SAI_TOI_DA) return { dung: false, lyDo: "sai-qua-nhieu-lan" };
  if (moc >= ban.hetHanLuc) return { dung: false, lyDo: "het-han" };
  if (!khopMa(maNguoiGo, ban.daBam)) return { dung: false, lyDo: "sai-ma" };
  return { dung: true };
}
