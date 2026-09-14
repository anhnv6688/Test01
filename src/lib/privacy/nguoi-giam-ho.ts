import { cheDoDongY, ngayChuyenCheDo, type CheDoDongY, type ThangNamSinh } from "./tuoi";

/**
 * Người đại diện theo pháp luật của trẻ, và việc xác minh (CR-05).
 *
 * Ô Ly đã có cơ chế đồng ý tách theo từng mục đích (BR-37, CR-04). Nhưng cơ chế
 * đó trả lời câu "đồng ý cho làm gì", không trả lời câu "AI đồng ý". Trước tệp
 * này, người bấm nút đồng ý chỉ là người đang cầm điện thoại — có thể là mẹ,
 * có thể là bác hàng xóm, có thể là chính đứa trẻ. Toàn bộ kiến trúc ba lớp bảo
 * vệ dữ liệu đứng trên một sự đồng ý chưa có chủ thể hợp lệ.
 *
 * Tệp này không biến việc đó thành một cái ô đánh dấu. Một ô đánh dấu "tôi là
 * cha mẹ của cháu" không xác minh gì cả, và gọi nó là xác minh thì còn tệ hơn
 * không có, vì nó tạo ra hồ sơ trông như đã tuân thủ. Vì vậy phương thức xác
 * minh được ghi rõ ràng kèm ĐỘ MẠNH và kèm câu nó KHÔNG chứng minh được gì.
 */

export type QuanHe = "cha" | "me" | "nguoi-giam-ho";

export const TEN_QUAN_HE: Record<QuanHe, string> = {
  cha: "Cha của con",
  me: "Mẹ của con",
  "nguoi-giam-ho": "Người giám hộ của con",
};

export type PhuongThucXacMinh =
  | "tu-khai"
  | "otp-dien-thoai"
  | "the-thanh-toan"
  | "giay-to-truc-tiep";

export interface MoTaPhuongThuc {
  ma: PhuongThucXacMinh;
  ten: string;
  /** 1 là yếu nhất. Dùng để xếp hạng, không phải để kết luận pháp lý. */
  doManh: 1 | 2 | 3 | 4;
  chungMinhDuoc: string;
  /** Câu quan trọng hơn câu trên. */
  khongChungMinhDuoc: string;
}

export const PHUONG_THUC: MoTaPhuongThuc[] = [
  {
    ma: "tu-khai",
    ten: "Tự khai",
    doManh: 1,
    chungMinhDuoc: "Có một người đã đọc văn bản và bấm xác nhận.",
    khongChungMinhDuoc:
      "Không chứng minh người bấm là người thành niên, cũng không chứng minh họ là cha, mẹ hay người giám hộ của cháu. Một đứa trẻ tám tuổi bấm được nút này.",
  },
  {
    ma: "otp-dien-thoai",
    ten: "Mã một lần gửi qua số điện thoại",
    doManh: 2,
    chungMinhDuoc:
      "Người xác nhận đang giữ một số thuê bao có đăng ký chính chủ theo quy định về thuê bao di động.",
    khongChungMinhDuoc:
      "Không chứng minh quan hệ với cháu. Trẻ mượn điện thoại của mẹ vẫn nhận được mã.",
  },
  {
    ma: "the-thanh-toan",
    ten: "Xác nhận qua giao dịch thanh toán",
    doManh: 3,
    chungMinhDuoc:
      "Người xác nhận có tài khoản hoặc thẻ đứng tên người thành niên tại một tổ chức đã định danh khách hàng.",
    khongChungMinhDuoc: "Không chứng minh quan hệ với cháu.",
  },
  {
    ma: "giay-to-truc-tiep",
    ten: "Đối chiếu giấy tờ trực tiếp",
    doManh: 4,
    chungMinhDuoc:
      "Chứng minh được cả độ tuổi của người xác nhận lẫn quan hệ với cháu, nếu đối chiếu giấy khai sinh.",
    khongChungMinhDuoc:
      "Tốn công và thu thêm dữ liệu nhạy cảm, nên chỉ nên dùng khi thật sự cần chứ không dùng đại trà.",
  },
];

export const PHUONG_THUC_BY_MA = new Map(PHUONG_THUC.map((p) => [p.ma, p]));

/** Phương thức yếu nhất mà bản dựng hiện tại chấp nhận trước khi mở bán. */
export const PHUONG_THUC_TOI_THIEU_DE_MO_BAN: PhuongThucXacMinh = "otp-dien-thoai";

export interface NguoiGiamHo {
  householdId: string;
  quanHe: QuanHe;
  /** Tên người xác nhận. Cần để gắn trách nhiệm vào bản ghi đồng ý. */
  hoTen: string;
  phuongThuc: PhuongThucXacMinh;
  xacMinhLuc: string;
  /** Bằng chứng: phiên bản văn bản họ đã đọc khi xác nhận. */
  phienBanVanBan: string;
  /** Họ tự xác nhận là người thành niên và là người đại diện theo pháp luật. */
  tuXacNhanDaiDien: boolean;
}

/**
 * Cảnh báo về mức xác minh, để hiển thị ở trang tuân thủ.
 *
 * Cố ý KHÔNG chặn: chặn ở đây sẽ làm bản dựng phát triển không chạy được, và
 * quan trọng hơn, quyết định phương thức nào là đủ là một câu hỏi pháp lý chứ
 * không phải một hằng số trong mã nguồn. Việc của mã nguồn là không để câu hỏi
 * đó trôi mất.
 */
export function canhBaoXacMinh(ng: NguoiGiamHo | null): string | null {
  if (!ng) return "Hộ này chưa có bản ghi người đại diện theo pháp luật.";
  const p = PHUONG_THUC_BY_MA.get(ng.phuongThuc);
  const toiThieu = PHUONG_THUC_BY_MA.get(PHUONG_THUC_TOI_THIEU_DE_MO_BAN);
  if (!p || !toiThieu) return "Phương thức xác minh không nằm trong danh mục.";
  if (p.doManh < toiThieu.doManh) {
    return `Mức xác minh hiện tại là "${p.ten}". ${p.khongChungMinhDuoc} Cần luật sư xác nhận phương thức nào là đủ trước khi mở bán.`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Cổng đủ điều kiện xử lý                                             */
/* ------------------------------------------------------------------ */

export type ThieuGi =
  | "chua-khai-thang-nam-sinh"
  | "chua-co-nguoi-giam-ho"
  | "chua-co-dong-y-nguoi-giam-ho"
  | "chua-co-dong-y-cua-tre";

export const NOI_GI_KHI_THIEU: Record<ThieuGi, string> = {
  "chua-khai-thang-nam-sinh":
    "Ô Ly cần biết tháng năm sinh của con để làm đúng quy định về dữ liệu của trẻ em. Ô Ly không hỏi ngày sinh, chỉ hỏi tháng và năm.",
  "chua-co-nguoi-giam-ho":
    "Phần này cần cha, mẹ hoặc người giám hộ của con xác nhận trước. Anh chị vào mục Người đại diện của con để làm giúp nhé.",
  "chua-co-dong-y-nguoi-giam-ho":
    "Cha, mẹ hoặc người giám hộ của con chưa đồng ý cho mục đích này. Anh chị bật riêng trong mục Quyền riêng tư nhé.",
  "chua-co-dong-y-cua-tre":
    "Con đã từ 7 tuổi, nên theo quy định, chính con cũng cần được hỏi và đồng ý — bên cạnh sự đồng ý của anh chị. Anh chị ngồi cùng con và đọc phần hỏi con giúp Ô Ly nhé.",
};

export interface DauVaoKiemTra {
  nguoiGiamHo: NguoiGiamHo | null;
  thangNamSinh: ThangNamSinh | null;
  /** Người giám hộ đã bật mục đích này chưa (kết quả của dangBat). */
  dongYNguoiGiamHo: boolean;
  /** Chính đứa trẻ đã đồng ý chưa. Chỉ xét khi trẻ từ đủ 7 tuổi. */
  dongYCuaTre: boolean;
}

export interface KetQuaDuDieuKien {
  duDieuKien: boolean;
  thieu: ThieuGi[];
  /** null khi chưa khai tháng năm sinh nên chưa xác định được chế độ. */
  cheDo: CheDoDongY | null;
  /** Câu nói cho phụ huynh, lấy theo thứ thiếu đầu tiên. */
  noiGiVoiPhuHuynh: string | null;
  /** Sắp tới ngày trẻ chuyển sang chế độ cần cả sự đồng ý của chính mình. */
  ngayChuyenCheDo: Date | null;
}

/**
 * Trẻ có đủ điều kiện để Ô Ly xử lý dữ liệu cho mục đích này không.
 *
 * Luôn truyền `moc` là thời điểm hiện tại và luôn gọi lại mỗi lần xử lý. Đây
 * không phải một trạng thái lưu được: đứa trẻ sang tuổi bảy thì một hộ vốn đủ
 * điều kiện trở thành thiếu, mà không có sự kiện nào xảy ra để đánh dấu.
 */
export function kiemTraDuDieuKien(dv: DauVaoKiemTra, moc = new Date()): KetQuaDuDieuKien {
  const thieu: ThieuGi[] = [];

  if (!dv.thangNamSinh) thieu.push("chua-khai-thang-nam-sinh");
  if (!dv.nguoiGiamHo) thieu.push("chua-co-nguoi-giam-ho");
  if (!dv.dongYNguoiGiamHo) thieu.push("chua-co-dong-y-nguoi-giam-ho");

  const cheDo = dv.thangNamSinh ? cheDoDongY(dv.thangNamSinh, moc) : null;
  if (cheDo === "ca-hai" && !dv.dongYCuaTre) thieu.push("chua-co-dong-y-cua-tre");

  return {
    duDieuKien: thieu.length === 0,
    thieu,
    cheDo,
    noiGiVoiPhuHuynh: thieu.length > 0 ? NOI_GI_KHI_THIEU[thieu[0]] : null,
    ngayChuyenCheDo: dv.thangNamSinh ? ngayChuyenCheDo(dv.thangNamSinh, moc) : null,
  };
}
