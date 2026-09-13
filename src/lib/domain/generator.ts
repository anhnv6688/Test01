import { requireYccd } from "./curriculum";
import { TEMPLATE_BY_ID, TEMPLATES } from "./templates";
import { Rng } from "./rng";
import type { AiLabel, BuiltItem, Item, Template, TrapHit } from "./types";

/**
 * Cổng phát hành nội dung.
 *
 * BR-15: không bài nào đến tay trẻ mà thiếu bản ghi người thật duyệt. Với mô
 * hình khuôn dạng, việc duyệt gắn ở mức khuôn dạng cộng với ràng buộc sinh
 * tham số; bài cụ thể thừa kế bản ghi đó qua cặp (mã khuôn dạng, phiên bản).
 * Hàm dưới đây là chỗ DUY NHẤT sinh ra bài cho trẻ, nên chặn ở đây là chặn hết.
 */
export class ChuaDuyetError extends Error {
  constructor(templateId: string) {
    super(`Khuôn dạng ${templateId} chưa có bản ghi người duyệt, không được phát hành.`);
    this.name = "ChuaDuyetError";
  }
}

export class SaiPhienBanDuyetError extends Error {
  constructor(templateId: string, approved: number, current: number) {
    super(
      `Khuôn dạng ${templateId} đã sửa lên phiên bản ${current} nhưng bản duyệt chỉ tới phiên bản ${approved}.`,
    );
    this.name = "SaiPhienBanDuyetError";
  }
}

/** Khuôn dạng đủ điều kiện phát hành hay chưa (BR-15, CR-08). */
export function kiemTraDuyet(t: Template): void {
  if (!t.approval) throw new ChuaDuyetError(t.id);
  if (t.approval.templateVersion !== t.version) {
    throw new SaiPhienBanDuyetError(t.id, t.approval.templateVersion, t.version);
  }
}

/** Chỉ những khuôn dạng đã duyệt mới được đưa vào vòng luyện tập. */
export function khuonDangDaDuyet(): Template[] {
  return TEMPLATES.filter((t) => {
    try {
      kiemTraDuyet(t);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Loại bỏ những bẫy mà ở bộ tham số này lại trùng đúng đáp án.
 *
 * Với một vài bộ tham số nhỏ, con số trẻ viết ra khi mắc bẫy tình cờ bằng đáp
 * án đúng — chẳng hạn 2 đĩa mỗi đĩa 2 quả thì cộng nhầm hay nhân đúng đều ra 4,
 * hoặc đồng hồ 3 giờ 15 phút thì đọc nhầm kim dài cũng ra 3. Khi đó không có
 * cách nào phân biệt trẻ hiểu bài hay trẻ mắc bẫy, nên tuyệt đối không được
 * kết luận là trẻ mắc bẫy: một chẩn đoán sai còn tệ hơn không chẩn đoán, vì nó
 * đi thẳng vào bản tin tối và bố mẹ sẽ chữa nhầm chỗ (BR-04, BR-08).
 *
 * Lọc ở đây chứ không lọc trong từng khuôn dạng, để khuôn dạng viết sau này
 * cũng được bảo vệ mà tác giả không phải nhớ.
 */
function bayDungDuoc(built: BuiltItem): TrapHit[] {
  return built.traps.filter((b) => b.wrongAnswer !== built.answer);
}

function nhan(t: Template): AiLabel | null {
  // Chỉ nội dung có máy tham gia tạo mới thuộc diện phải gắn nhãn (BR-25, CR-07).
  if (!t.provenance.aiAssisted) return null;
  return {
    visible: "Nội dung có sự hỗ trợ của trí tuệ nhân tạo, đã được giáo viên duyệt.",
    machine: {
      generator: `oly-template/${t.id}@${t.version}`,
      generatedAt: new Date().toISOString(),
      reviewedBy: t.approval?.reviewedBy ?? "",
    },
  };
}

/**
 * Sinh một bài cụ thể. Cùng (khuôn dạng, hạt) luôn cho ra cùng một bài, nên
 * lịch sử của trẻ dựng lại được mà không cần lưu đề (BR-09).
 */
export function sinhBai(templateId: string, seed: number): Item {
  const t = TEMPLATE_BY_ID.get(templateId);
  if (!t) throw new Error(`Không có khuôn dạng ${templateId}`);
  kiemTraDuyet(t);
  requireYccd(t.yccd);
  const built = t.build(seed);
  return {
    id: `${t.id}:${seed}`,
    templateId: t.id,
    templateVersion: t.version,
    yccd: t.yccd,
    seed,
    aiLabel: nhan(t),
    ...built,
    traps: bayDungDuoc(built),
  };
}

/** Đọc lại một bài từ mã đã lưu, ví dụ khi phụ huynh xem lại lịch sử. */
export function doclaiBai(itemId: string): Item {
  const [templateId, seed] = itemId.split(":");
  return sinhBai(templateId, Number(seed));
}

/**
 * Chọn khuôn dạng cho phiên học tiếp theo.
 *
 * Ưu tiên các mã yêu cầu cần đạt mà trẻ đang yếu, nhưng luôn chừa chỗ cho dạng
 * trẻ làm tốt — một phiên toàn bài khó là một phiên trẻ bỏ dở.
 */
export function chonKhuonDang(
  yccdYeu: string[],
  soBai: number,
  seed: number,
): { templateId: string; seed: number }[] {
  const r = new Rng(seed);
  const daDuyet = khuonDangDaDuyet();
  const uuTien = daDuyet.filter((t) => yccdYeu.includes(t.yccd));
  const conLai = daDuyet.filter((t) => !yccdYeu.includes(t.yccd));
  const ke: Template[] = [];
  // Khoảng hai phần ba số bài rơi vào chỗ trẻ đang yếu.
  const soUuTien = uuTien.length > 0 ? Math.ceil(soBai * 0.6) : 0;
  for (let i = 0; i < soUuTien; i++) ke.push(r.pick(uuTien));
  const nguon = conLai.length > 0 ? conLai : daDuyet;
  while (ke.length < soBai) ke.push(r.pick(nguon));
  return r.shuffle(ke).map((t) => ({ templateId: t.id, seed: r.int(1, 2_000_000_000) }));
}
