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
  /**
   * Câu hỏi dành cho chính đứa trẻ, khi trẻ từ đủ 7 tuổi (CR-05).
   *
   * Viết cho một bạn bảy tuổi tự đọc được, không phải bản rút gọn của câu dành
   * cho người lớn. Sự đồng ý phải là sự đồng ý CÓ HIỂU; bắt một đứa trẻ bảy
   * tuổi bấm vào một câu em không đọc nổi thì đó là lấy chữ ký, không phải lấy
   * sự đồng ý.
   */
  hoiCon: string;
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
    hoiCon:
      "Khi bố mẹ chụp ảnh đề bài trong sách, Ô Ly nhờ máy đọc giúp chữ trong ảnh. Con có đồng ý không?",
    macDinh: false,
  },
  {
    ma: "cham-bai-viet-tay",
    ten: "Chấm bài con viết tay",
    giaiThich:
      "Ô Ly gửi ảnh bài làm đã che thông tin cá nhân tới bên xử lý ảnh để đọc các bước con đã viết.",
    matGi: ["Chụp bài con làm trên giấy để chấm"],
    vanChay: ["Toàn bộ phần luyện tập của con", "Bản tin tối", "Lịch sử học", "Đọc ảnh đề bài nếu bật riêng"],
    hoiCon:
      "Khi bố mẹ chụp ảnh bài con làm, Ô Ly nhờ máy đọc giúp chữ con viết, để xem chỗ nào con làm chưa đúng. Ô Ly không chấm điểm con, và không bạn nào khác nhìn thấy bài của con. Con có đồng ý không?",
    macDinh: false,
  },
  {
    ma: "sinh-loi-giang",
    ten: "Soạn lời giảng cho phụ huynh",
    giaiThich: "Ô Ly dùng trí tuệ nhân tạo để viết phần hướng dẫn cách giảng lại cho con.",
    matGi: ["Phần gợi ý cách hỏi con trong lời giải"],
    vanChay: ["Các bước giải vẫn hiện đầy đủ", "Toàn bộ phần luyện tập", "Bản tin tối", "Lịch sử học"],
    hoiCon:
      "Ô Ly nhờ máy viết giúp phần chỉ cho bố mẹ cách giảng lại bài cho con. Con có đồng ý không?",
    macDinh: false,
  },
  {
    ma: "goi-y-ca-nhan-hoa",
    ten: "Chọn bài theo chỗ con đang yếu",
    giaiThich: "Ô Ly dùng lịch sử làm bài của con để ưu tiên những dạng con hay sai.",
    matGi: ["Việc ưu tiên dạng bài con hay sai; con sẽ nhận bài theo thứ tự chung"],
    vanChay: ["Toàn bộ phần luyện tập", "Bản tin tối", "Lịch sử học", "Chụp ảnh nếu bật riêng"],
    hoiCon:
      "Ô Ly nhớ những bài con hay làm sai, để lần sau cho con luyện thêm đúng chỗ đó. Con có đồng ý không?",
    macDinh: false,
  },
];

export const MUC_DICH_BY_MA = new Map(MUC_DICH.map((m) => [m.ma, m]));

/**
 * Ai là người đồng ý.
 *
 * Với trẻ từ đủ 7 tuổi, quy định đòi sự đồng ý của CẢ hai, và hai sự đồng ý đó
 * không thay thế được cho nhau — người giám hộ đồng ý thay con là không hợp lệ,
 * mà con đồng ý một mình cũng không hợp lệ. Vì thế chúng là hai bản ghi.
 */
export type NguoiDongY = "nguoi-giam-ho" | "tre-em";

export interface BanGhiDongY {
  householdId: string;
  mucDich: MucDich;
  dongY: boolean;
  at: string;
  /** Bằng chứng tối thiểu: phiên bản văn bản mà người dùng đã đọc khi bấm. */
  phienBanVanBan: string;
  nguoiDongY: NguoiDongY;
  /** Chỉ có với sự đồng ý của trẻ: đúng đứa trẻ nào đã đồng ý. */
  childId: string | null;
}

export const PHIEN_BAN_VAN_BAN_DONG_Y = "2026-09-13.v1";

function moiNhat(bangGhi: BanGhiDongY[], loc: (b: BanGhiDongY) => boolean): boolean {
  const b = bangGhi.filter(loc).sort((x, y) => y.at.localeCompare(x.at))[0];
  // Không có bản ghi nghĩa là chưa đồng ý. Mặc định luôn là tắt.
  return b?.dongY ?? false;
}

/**
 * Người giám hộ đã bật mục đích này chưa.
 *
 * Đây KHÔNG còn là câu trả lời đầy đủ cho câu hỏi "có được xử lý không". Với
 * trẻ từ đủ 7 tuổi còn cần cả sự đồng ý của chính trẻ. Chỗ quyết định là
 * kiemTraDuDieuKien trong src/lib/privacy/nguoi-giam-ho.ts; hàm này chỉ là một
 * trong các đầu vào của nó.
 */
export function dangBat(bangGhi: BanGhiDongY[], mucDich: MucDich): boolean {
  return moiNhat(bangGhi, (b) => b.mucDich === mucDich && b.nguoiDongY === "nguoi-giam-ho");
}

/** Chính đứa trẻ đã đồng ý mục đích này chưa (CR-05, trẻ từ đủ 7 tuổi). */
export function treDaDongY(
  bangGhi: BanGhiDongY[],
  mucDich: MucDich,
  childId: string,
): boolean {
  return moiNhat(
    bangGhi,
    (b) => b.mucDich === mucDich && b.nguoiDongY === "tre-em" && b.childId === childId,
  );
}
