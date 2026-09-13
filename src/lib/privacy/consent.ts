/**
 * Sự đồng ý, tách riêng theo từng mục đích.
 *
 * BR-37 và CR-04: mỗi mục đích xử lý bằng trí tuệ nhân tạo phải tắt được riêng,
 * không đánh dấu sẵn, có lưu bằng chứng. Và quan trọng hơn phần hình thức: tắt
 * một mục đích KHÔNG được làm hỏng các tính năng còn lại — nếu tắt một mục đích
 * mà mất hết tính năng thì đó không phải là lựa chọn thật.
 *
 * Kiểm chứng điều đó bằng trường `matGi` dưới đây: mỗi mục đích khai rõ tắt nó
 * thì mất đúng cái gì, và bài kiểm thử đối chiếu để không có mục đích nào kéo
 * theo sập cả sản phẩm.
 */
export type MucDich =
  | "doc-anh-de-bai"
  | "cham-bai-viet-tay"
  | "sinh-loi-giang"
  | "goi-y-ca-nhan-hoa";

export interface MoTaMucDich {
  ma: MucDich;
  ten: string;
  giaiThich: string;
  /** Tắt mục đích này thì mất đúng những chức năng nào. */
  matGi: string[];
  /** Những chức năng vẫn chạy bình thường khi tắt. */
  vanChay: string[];
  /** Bắt buộc phải để mặc định TẮT — không đánh dấu sẵn (CR-04). */
  macDinh: false;
}

export const MUC_DICH: MoTaMucDich[] = [
  {
    ma: "doc-anh-de-bai",
    ten: "Đọc ảnh đề bài",
    giaiThich:
      "Ô Ly gửi ảnh đề bài đã che thông tin cá nhân tới bên xử lý ảnh để đọc ra nội dung đề.",
    matGi: ["Chụp đề bài để nhận lời giải từng bước"],
    vanChay: ["Toàn bộ phần luyện tập của con", "Bản tin tối", "Lịch sử học", "Chấm bài viết tay nếu bật riêng"],
    macDinh: false,
  },
  {
    ma: "cham-bai-viet-tay",
    ten: "Chấm bài con viết tay",
    giaiThich:
      "Ô Ly gửi ảnh bài làm đã che thông tin cá nhân tới bên xử lý ảnh để đọc các bước con đã viết.",
    matGi: ["Chụp bài con làm trên giấy để chấm"],
    vanChay: ["Toàn bộ phần luyện tập của con", "Bản tin tối", "Lịch sử học", "Đọc ảnh đề bài nếu bật riêng"],
    macDinh: false,
  },
  {
    ma: "sinh-loi-giang",
    ten: "Soạn lời giảng cho phụ huynh",
    giaiThich: "Ô Ly dùng trí tuệ nhân tạo để viết phần hướng dẫn cách giảng lại cho con.",
    matGi: ["Phần gợi ý cách hỏi con trong lời giải"],
    vanChay: ["Các bước giải vẫn hiện đầy đủ", "Toàn bộ phần luyện tập", "Bản tin tối", "Lịch sử học"],
    macDinh: false,
  },
  {
    ma: "goi-y-ca-nhan-hoa",
    ten: "Chọn bài theo chỗ con đang yếu",
    giaiThich: "Ô Ly dùng lịch sử làm bài của con để ưu tiên những dạng con hay sai.",
    matGi: ["Việc ưu tiên dạng bài con hay sai; con sẽ nhận bài theo thứ tự chung"],
    vanChay: ["Toàn bộ phần luyện tập", "Bản tin tối", "Lịch sử học", "Chụp ảnh nếu bật riêng"],
    macDinh: false,
  },
];

export const MUC_DICH_BY_MA = new Map(MUC_DICH.map((m) => [m.ma, m]));

export interface BanGhiDongY {
  householdId: string;
  mucDich: MucDich;
  dongY: boolean;
  at: string;
  /** Bằng chứng tối thiểu: phiên bản văn bản mà người dùng đã đọc khi bấm. */
  phienBanVanBan: string;
}

export const PHIEN_BAN_VAN_BAN_DONG_Y = "2026-09-13.v1";

export function dangBat(bangGhi: BanGhiDongY[], mucDich: MucDich): boolean {
  const moiNhat = bangGhi
    .filter((b) => b.mucDich === mucDich)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  // Không có bản ghi nghĩa là chưa đồng ý. Mặc định luôn là tắt.
  return moiNhat?.dongY ?? false;
}
