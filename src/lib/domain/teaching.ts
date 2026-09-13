import { TRAP_BY_ID } from "./traps";
import { YCCD_BY_CODE } from "./curriculum";
import type { Item } from "./types";

/**
 * Lời giảng dành cho phụ huynh.
 *
 * BR-26: phụ huynh chụp một đề bài và nhận lại lời giải từng bước, đủ để tự
 * giảng lại cho con.
 * BR-27: viết bằng NGÔN NGỮ GIẢNG BÀI, không phải ngôn ngữ trình bày toán học.
 * Phụ huynh cần biết nói với con thế nào, không cần một bài giải chuẩn mực.
 * Bắt buộc có phần đặt câu hỏi dẫn dắt và chỗ trẻ hay hiểu sai.
 * BR-33: tối thiểu hai mức chi tiết.
 *
 * NT-10: mọi thứ ở tệp này chỉ được hiển thị trên bề mặt phụ huynh. Đây là nơi
 * duy nhất trong sản phẩm có lời giải đầy đủ.
 */
export type MucChiTiet = "nhac-lai" | "giang-tu-dau";

export interface BuocGiang {
  tieuDe: string;
  /** Việc cần làm, viết cho người lớn đọc. */
  lamGi: string;
  /** Câu để hỏi con, không phải câu để giảng cho con. */
  hoiCon: string;
}

export interface LoiGiang {
  mucChiTiet: MucChiTiet;
  deBai: string;
  yeuCauCanDat: string;
  buoc: BuocGiang[];
  dapAn: number;
  donVi?: string;
  /** Chỗ trẻ hay hiểu sai ở dạng bài này (BR-27). */
  choHaySai: string[];
  /** Nếu con vẫn chưa hiểu thì làm gì tiếp. */
  neuVanChuaHieu: string;
  nhanMay: string | null;
}

export function soanLoiGiang(item: Item, muc: MucChiTiet): LoiGiang {
  const yccd = YCCD_BY_CODE.get(item.yccd);
  const choHaySai = item.traps
    .map((t) => TRAP_BY_ID.get(t.id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => t.parentNote);

  const buoc = muc === "nhac-lai" ? buocNgan(item) : buocDay(item);

  return {
    mucChiTiet: muc,
    deBai: item.prompt,
    yeuCauCanDat: yccd?.statement ?? item.yccd,
    buoc,
    dapAn: item.answer,
    donVi: item.unit,
    choHaySai:
      choHaySai.length > 0
        ? choHaySai
        : ["Dạng này chưa ghi nhận lỗi phổ biến nào; anh chị để ý xem con vướng ở bước nào."],
    neuVanChuaHieu:
      "Nếu con vẫn chưa hiểu, anh chị đừng giảng lại lần hai bằng cùng một cách. Hãy lấy đúng dạng bài này nhưng đổi thành con số nhỏ hơn, cho con làm được một lần đã, rồi mới quay lại bài gốc.",
    nhanMay: item.aiLabel?.visible ?? null,
  };
}

/** Mức rút gọn: phụ huynh chỉ cần nhắc lại cách làm. */
function buocNgan(item: Item): BuocGiang[] {
  const chot = item.hints.find((h) => h.level === 4) ?? item.hints[0];
  return [
    {
      tieuDe: "Cách làm, gọn trong một câu",
      lamGi: chot.text.replace(/^Bước đầu tiên:\s*/i, ""),
      hoiCon: item.hints[0]?.text ?? "Con đọc lại đề cho mẹ nghe nào.",
    },
  ];
}

/**
 * Mức đầy đủ: bám đúng thang gợi ý mà trẻ đang được dẫn trên bề mặt của trẻ,
 * để bố mẹ và cô giáo không dạy hai kiểu ngược nhau (BR-12).
 */
function buocDay(item: Item): BuocGiang[] {
  const buoc: BuocGiang[] = [
    {
      tieuDe: "Bước 1 — Cho con đọc lại đề và nói xem đề hỏi gì",
      lamGi:
        "Đừng giảng vội. Cho con đọc to đề một lần, rồi hỏi con đề đang hỏi cái gì. Rất nhiều câu sai chết ở đây chứ không chết ở phép tính.",
      hoiCon: "Đề này hỏi con cái gì nhỉ, con nói lại cho mẹ nghe bằng lời của con?",
    },
  ];
  const hinh = item.hints.find((h) => h.revealVisual);
  if (hinh) {
    buoc.push({
      tieuDe: "Bước 2 — Cho con nhìn hình trước khi viết phép tính",
      lamGi: `${hinh.text} Sách giáo khoa hiện hành dạy theo thứ tự này: nhìn hình trước, viết số sau.`,
      hoiCon: "Con chỉ cho mẹ trên hình xem chỗ nào là cái mà đề đang hỏi?",
    });
  }
  const mau = item.hints.find((h) => h.level === 3);
  if (mau) {
    buoc.push({
      tieuDe: `Bước ${buoc.length + 1} — Làm mẫu một bài dễ hơn, không làm mẫu chính bài này`,
      lamGi: `${mau.text} Làm mẫu bằng số khác để con vẫn còn việc để tự làm.`,
      hoiCon: "Bài mẫu vừa rồi mình làm thế nào, con thử làm y như vậy với bài của con xem?",
    });
  }
  const dau = item.hints.find((h) => h.level === 4);
  if (dau) {
    buoc.push({
      tieuDe: `Bước ${buoc.length + 1} — Chốt bước đầu tiên rồi để con tự đi tiếp`,
      lamGi: dau.text.replace(/^Bước đầu tiên:\s*/i, "Chỉ nói với con bước đầu: "),
      hoiCon: "Làm xong bước này rồi thì việc tiếp theo là gì hả con?",
    });
  }
  buoc.push({
    tieuDe: `Bước ${buoc.length + 1} — Cho con kiểm tra lại đáp số`,
    lamGi:
      "Đừng tự tay chữa. Hỏi con xem đáp số vừa ra có hợp lý không, và có đúng đơn vị mà đề hỏi không.",
    hoiCon: "Con đọc lại đáp số của con, xem đã đúng cái mà đề hỏi chưa?",
  });
  return buoc;
}
