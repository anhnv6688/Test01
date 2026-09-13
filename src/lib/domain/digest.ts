import { YCCD_BY_CODE } from "./curriculum";
import { demTuSua } from "./rewards";
import { TRAP_BY_ID } from "./traps";
import type { Attempt } from "./types";

/**
 * Bản tin tối.
 *
 * BR-08: mỗi tối phụ huynh phải biết con học gì, sai ở đâu, và được gợi ý ĐÚNG
 * MỘT câu để hỏi con. Một câu, không phải ba câu: đây là thứ biến vài phút trò
 * chuyện thành phần học hiệu quả nhất trong ngày, và ba câu thì thành bài kiểm
 * tra miệng.
 *
 * NT-07: tuyệt đối không có nhận định mang tính chẩn đoán tâm lý hoặc y tế.
 * Bản tin chỉ mô tả việc đã xảy ra trong phiên học, không suy diễn về đứa trẻ.
 */
export interface BanTinToi {
  ngay: string;
  childId: string;
  hocGi: string[];
  saiODau: string[];
  /** Đúng một câu. Cố ý để kiểu string chứ không phải string[]. */
  cauHoiChoBo: string;
  noLuc: string;
  soBai: number;
}

export function lapBanTinToi(childId: string, attempts: Attempt[], ngay = new Date()): BanTinToi | null {
  if (attempts.length === 0) return null;

  const hocGi = [...new Set(attempts.map((a) => a.yccd))]
    .map((code) => YCCD_BY_CODE.get(code)?.statement ?? code)
    .map(rutGon);

  // Bẫy mắc nhiều nhất chính là chỗ đáng nói nhất trong ngày.
  const demBay = new Map<string, number>();
  for (const a of attempts) {
    if (a.trapId) demBay.set(a.trapId, (demBay.get(a.trapId) ?? 0) + 1);
  }
  const bayNang = [...demBay.entries()].sort((x, y) => y[1] - x[1])[0];

  const saiODau: string[] = [];
  let cauHoi = "Hôm nay con thấy bài nào khó nhất, con kể cho mẹ nghe nhé?";
  if (bayNang) {
    const trap = TRAP_BY_ID.get(bayNang[0]);
    if (trap) {
      saiODau.push(`${trap.parentNote} (${bayNang[1]} lần trong phiên hôm nay)`);
      cauHoi = trap.parentQuestion;
    }
  }
  const saiKhac = attempts.filter((a) => !a.correct && !a.trapId).length;
  if (saiKhac > 0) {
    saiODau.push(`Ngoài ra có ${saiKhac} câu sai chưa xếp được vào lỗi nào quen thuộc.`);
  }
  if (saiODau.length === 0) {
    saiODau.push("Hôm nay con không mắc lỗi nào thuộc nhóm lỗi quen thuộc.");
  }

  const tuSua = demTuSua(attempts);
  const soBai = new Set(attempts.map((a) => a.itemId)).size;
  const noLuc =
    tuSua > 0
      ? `Con làm ${soBai} bài và tự sửa đúng ${tuSua} lần sau khi sai.`
      : `Con làm ${soBai} bài trong phiên hôm nay.`;

  return {
    ngay: ngay.toISOString().slice(0, 10),
    childId,
    hocGi,
    saiODau,
    cauHoiChoBo: cauHoi,
    noLuc,
    soBai,
  };
}

function rutGon(s: string): string {
  const cat = s.split(";")[0];
  return cat.length > 90 ? `${cat.slice(0, 87)}…` : cat;
}

/**
 * Danh sách từ ngữ bị cấm trong mọi nội dung gửi phụ huynh (NT-07).
 *
 * Nhận định kiểu "con có dấu hiệu tăng động" tạo ra dữ liệu sức khỏe, kéo theo
 * nghĩa vụ bảo vệ ở mức cao nhất. Rẻ hơn nhiều là không bao giờ viết ra câu đó.
 */
export const TU_NGU_CAM = [
  "tăng động",
  "giảm chú ý",
  "rối loạn",
  "khuyết tật",
  "chậm phát triển",
  "tự kỷ",
  "trầm cảm",
  "chẩn đoán",
  "bệnh",
  "khó khăn học tập đặc thù",
];

export function viPhamNT07(text: string): string[] {
  const t = text.toLowerCase();
  return TU_NGU_CAM.filter((tu) => t.includes(tu));
}
