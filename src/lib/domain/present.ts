import type { HintRung, Item, VisualSpec } from "./types";

/**
 * Bộ lọc quyết định thứ gì được rời máy chủ để tới bề mặt của trẻ.
 *
 * BR-03 và NT-10: không tồn tại đường dẫn nào từ bề mặt của trẻ tới lời giải
 * đầy đủ. Một đường dẫn như vậy không nhất thiết phải là một cái nút — gói JSON
 * có kèm trường đáp án cũng là một đường dẫn, và là đường dẫn mà một đứa trẻ
 * lớp 2 biết mở công cụ nhà phát triển sẽ tìm thấy trước người lớn.
 *
 * Vì vậy: đáp án không bao giờ đi ra khỏi máy chủ trên bề mặt trẻ. Việc chấm
 * diễn ra ở máy chủ; máy khách chỉ nhận lại đúng sai kèm câu chữa. Thang gợi ý
 * cũng chỉ trả về tới đúng bậc trẻ đã mở.
 */
export interface BaiChoTre {
  id: string;
  prompt: string;
  speech: string;
  unit?: string;
  choices?: number[];
  visual: VisualSpec;
  /** Chỉ các bậc gợi ý đã mở. Bậc chưa mở không được gửi kèm. */
  goiYDaMo: HintRung[];
  tongSoBacGoiY: number;
  nhanMay: string | null;
}

export function guiChoTre(item: Item, soBacDaMo: number): BaiChoTre {
  return {
    id: item.id,
    prompt: item.prompt,
    speech: item.speech,
    unit: item.unit,
    choices: item.choices,
    visual: item.visual,
    goiYDaMo: item.hints.slice(0, Math.max(0, soBacDaMo)),
    tongSoBacGoiY: item.hints.length,
    nhanMay: item.aiLabel?.visible ?? null,
  };
}

/**
 * Dùng trong kiểm thử: gói gửi cho trẻ có rò rỉ đáp án không.
 * Kiểm cả trường lẫn nội dung chữ, vì đáp án lọt vào một câu gợi ý cũng là lọt.
 */
export function timRoRiDapAn(goi: BaiChoTre, dapAn: number): string[] {
  const roRi: string[] = [];
  const keys = Object.keys(goi);
  if (keys.includes("answer") || keys.includes("dapAn")) roRi.push("có trường đáp án");
  const bien = new RegExp(`(^|[^0-9])${dapAn}([^0-9]|$)`);
  for (const h of goi.goiYDaMo) {
    if (bien.test(h.text)) roRi.push(`bậc gợi ý ${h.level} chứa đáp án`);
  }
  return roRi;
}
