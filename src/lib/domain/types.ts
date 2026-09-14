/**
 * Kiểu dữ liệu lõi của Ô Ly.
 *
 * Ghi chú truy vết: tài liệu BRD Ô Ly v1.2 phân biệt rõ "khuôn dạng bài"
 * (cấu trúc toán học + tham số + ràng buộc) với "bài cụ thể" sinh ra từ khuôn
 * dạng đó. Toàn bộ mô hình dưới đây bám đúng sự phân biệt ấy: kho chỉ lưu
 * khuôn dạng; bài cụ thể luôn được sinh tại chỗ từ một hạt ngẫu nhiên.
 */

/** Mạch nội dung theo Chương trình giáo dục phổ thông môn Toán. */
export type Strand = "so-va-phep-tinh" | "do-luong" | "hinh-hoc" | "giai-toan";

/** Mã yêu cầu cần đạt — đơn vị phân loại của Chương trình (BR-16). */
export interface Yccd {
  code: string;
  grade: 1 | 2;
  term: 1 | 2;
  strand: Strand;
  statement: string;
}

/** Hồ sơ nguồn gốc của một khuôn dạng (BR-24, CR-08). */
export interface Provenance {
  /** Căn cứ nội dung: chương trình, hoặc hợp đồng biên soạn (BR-13). */
  source: "CTGDPT" | "bien-soan-dat-hang";
  reference: string;
  authoredBy: string;
  /** Máy có tham gia soạn thảo hay không — quyết định nghĩa vụ gắn nhãn (BR-25). */
  aiAssisted: boolean;
}

/** Bản ghi người thật duyệt. Thiếu bản ghi này thì khuôn dạng không được phát hành (BR-15). */
export interface ApprovalRecord {
  reviewedBy: string;
  reviewerRole: "giao-vien-tieu-hoc" | "co-van-su-pham";
  reviewedAt: string;
  templateVersion: number;
  note?: string;
}

/** Biểu diễn trực quan đi kèm bài (BR-02). */
export type VisualSpec =
  | { kind: "khong-co" }
  | { kind: "khoi-tram-chuc-donvi"; hundreds: number; tens: number; ones: number }
  | { kind: "tia-so"; from: number; to: number; step: number; mark?: number }
  | { kind: "doan-thang"; segments: { label: string; length: number }[] }
  | { kind: "cay-va-khoang"; trees: number }
  | { kind: "nhom-hinh"; rows: number; perRow: number; shape: "tron" | "vuong" | "tam-giac" }
  | { kind: "dong-ho"; hour: number; minute: number }
  | { kind: "thuoc-do"; totalCm: number; markCm: number };

/** Một bậc trong thang gợi ý. Không bậc nào được chứa đáp án (BR-03). */
export interface HintRung {
  /** 1 = đọc lại đề, 2 = nhìn hình, 3 = làm mẫu bài tương tự, 4 = chỉ bước đầu tiên. */
  level: 1 | 2 | 3 | 4;
  text: string;
  /** Câu đọc thành tiếng cho trẻ chưa đọc thạo (BR-01). */
  speech?: string;
  revealVisual?: boolean;
}

/** Bài cụ thể đã sinh, sẵn sàng đưa tới trẻ. */
export interface Item {
  id: string;
  templateId: string;
  templateVersion: number;
  yccd: string;
  seed: number;
  /** Đề bài dạng chữ — trẻ KHÔNG bắt buộc phải đọc được (BR-01). */
  prompt: string;
  /** Câu đọc thành tiếng, viết cho tai nghe chứ không cho mắt đọc. */
  speech: string;
  answer: number;
  /** Đơn vị của đáp án, dùng để bắt bẫy đổi đơn vị. */
  unit?: string;
  /** Trắc nghiệm chỉ dùng cho một số dạng; mặc định là nhập số. */
  choices?: number[];
  visual: VisualSpec;
  hints: HintRung[];
  /** Các bẫy gài trong bài, kèm đáp án sai đặc trưng mà bẫy đó tạo ra (BR-04). */
  traps: TrapHit[];
  /** Nhãn nội dung máy sinh (BR-25, CR-07). */
  aiLabel: AiLabel | null;
}

/** Nhãn hiển thị + dấu máy đọc được cho nội dung có máy tham gia tạo (BR-25, CR-07). */
export interface AiLabel {
  visible: string;
  machine: { generator: string; generatedAt: string; reviewedBy: string };
}

/**
 * Một bẫy đã gài vào bài cụ thể, kèm con số mà trẻ sẽ viết ra nếu mắc bẫy đó.
 * Nhờ có con số này, việc nhận diện bẫy là tra bảng chứ không phải đoán.
 */
export interface TrapHit {
  id: string;
  wrongAnswer: number;
}

/** Bẫy — chi tiết trong đề cố tình gây hiểu sai (mục 16.1 BRD). */
export interface Trap {
  id: string;
  name: string;
  /** Câu chữa cho trẻ, đọc được thành tiếng, nói vì sao sai chứ không nói đáp án. */
  childFix: string;
  /** Câu viết cho phụ huynh đọc trong bản tin tối (BR-08). */
  parentNote: string;
  /** Đúng một câu để phụ huynh hỏi con (BR-08). */
  parentQuestion: string;
}

/** Phần bài cụ thể do khuôn dạng dựng ra, chưa gắn định danh và nhãn. */
export type BuiltItem = Omit<
  Item,
  "id" | "templateId" | "templateVersion" | "yccd" | "seed" | "aiLabel"
>;

/** Khuôn dạng bài — đơn vị lưu trữ duy nhất của kho nội dung. */
export interface Template {
  id: string;
  version: number;
  title: string;
  yccd: string;
  grade: 1 | 2;
  term: 1 | 2;
  strand: Strand;
  provenance: Provenance;
  approval: ApprovalRecord | null;
  /**
   * Lý do khuôn dạng này có ít biến thể, nếu đó là chủ đích.
   *
   * Một vài mạch của chương trình vốn nhỏ: bảng nhân 2 và 5 chỉ có ngần ấy
   * phép tính, và gặp lại chúng nhiều lần chính là cách học thuộc bảng. Khi
   * đó tác giả ghi lý do vào đây, và bộ đo kho nội dung sẽ không báo động —
   * nhưng vẫn liệt kê ra, để không ai quên chúng tồn tại.
   */
  ghiChuKhongGian?: string;
  /** Sinh một bài cụ thể từ hạt ngẫu nhiên. Cùng hạt luôn cho cùng bài. */
  build(seed: number): BuiltItem;
}

/** Một lần trẻ trả lời. */
export interface Attempt {
  itemId: string;
  templateId: string;
  yccd: string;
  given: number;
  correct: boolean;
  /** Bẫy mà trẻ mắc phải, nếu nhận diện được (BR-04). */
  trapId: string | null;
  hintsUsed: number;
  /** Lần thử thứ mấy cho cùng bài này. */
  attemptNo: number;
  elapsedMs: number;
  at: string;
}
