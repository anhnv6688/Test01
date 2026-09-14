import { sinhBai, khuonDangDaDuyet } from "./generator";
import { lapKeHoach, SO_BAI_MOI_PHIEN } from "./session";
import type { Template } from "./types";

/**
 * Đo kho nội dung.
 *
 * Điều kiện ra mắt số 4: "Kho khuôn dạng đủ để một trẻ lớp 2 học liên tục tối
 * thiểu bốn tuần mà không lặp bài."
 *
 * Câu đó có hai cách hiểu, và cả hai đều phải đo:
 *
 *   Không lặp ĐỀ — hai buổi không gặp lại đúng một đề giống hệt. Với mô hình
 *   khuôn dạng thì điều này gần như hiển nhiên đạt, vì mỗi khuôn dạng sinh ra
 *   rất nhiều biến thể. Đo nó chỉ để bắt khuôn dạng nào có không gian tham số
 *   quá bé mà tác giả không nhận ra.
 *
 *   Không lặp DẠNG quá dày — đây mới là cái trẻ cảm nhận được. Một đứa trẻ gặp
 *   đúng kiểu bài lần thứ mười lăm sẽ chán, kể cả khi con số mỗi lần một khác.
 *   Đây là con số quyết định kho cần bao nhiêu khuôn dạng.
 */

/** Bốn tuần, năm buổi mỗi tuần. */
export const SO_BUOI_BON_TUAN = 20;
export const SO_BAI_BON_TUAN = SO_BUOI_BON_TUAN * SO_BAI_MOI_PHIEN;

/**
 * Số đề PHÂN BIỆT ĐƯỢC mà một khuôn dạng sinh ra.
 *
 * Đếm bằng cách lấy mẫu chứ không tính giải tích: ràng buộc tham số của mỗi
 * khuôn dạng viết bằng mã, nên cách duy nhất biết chắc là sinh thử rồi đếm.
 * Trả về số đề khác nhau tìm được trong `soMau` lần thử — nếu con số này bằng
 * đúng số mẫu thì không gian còn lớn hơn nữa và phép đo chỉ cho biết cận dưới.
 */
export function demBienThe(t: Template, soMau = 3000): { khacNhau: number; daBaoHoa: boolean } {
  const thay = new Set<string>();
  for (let i = 0; i < soMau; i++) thay.add(vanTay(t.id, i * 7919 + 13));
  return { khacNhau: thay.size, daBaoHoa: thay.size < soMau };
}

/**
 * Vân tay của một bài cụ thể.
 *
 * Phải gồm cả HÌNH VẼ và ĐÁP ÁN chứ không chỉ chữ đề. Có những khuôn dạng mà
 * câu đề gần như không đổi còn cái thay đổi nằm hết trong hình — bài xem giờ
 * hỏi đúng một câu "Đồng hồ bên chỉ mấy giờ?" nhưng hai kim mỗi lần một khác.
 * Vân tay chỉ theo chữ đề sẽ báo những khuôn dạng đó là hỏng, trong khi chúng
 * hoàn toàn bình thường.
 */
function vanTay(templateId: string, seed: number): string {
  const bai = sinhBai(templateId, seed);
  return JSON.stringify([bai.prompt, bai.visual, bai.answer, bai.choices ?? null]);
}

export interface DoKhoNoiDung {
  soKhuonDang: number;
  /** Khuôn dạng có không gian tham số nhỏ hơn ngưỡng an toàn và CHƯA được giải thích. */
  khuonDangQuaBe: { id: string; title: string; bienThe: number }[];
  /** Khuôn dạng nhỏ nhưng tác giả đã ghi rõ lý do ngay trong khuôn dạng. */
  khuonDangNhoCoLyDo: { id: string; title: string; bienThe: number; lyDo: string }[];
  /** Số đề khác nhau trong bốn tuần học liên tục. */
  deKhacNhauBonTuan: number;
  soDeTrungBonTuan: number;
  /** Số lần một dạng bài lặp lại trong bốn tuần, trung bình. */
  lanLapMoiDang: number;
  /** Số YCCD có ít nhất một khuôn dạng. */
  soYccdDuocPhu: number;
}

/**
 * Ngưỡng an toàn cho không gian tham số của một khuôn dạng.
 *
 * Một trẻ gặp cùng một khuôn dạng khoảng năm tới bảy lần trong bốn tuần. Nếu
 * khuôn dạng chỉ sinh ra được dưới ba mươi đề khác nhau thì xác suất gặp lại
 * đúng đề cũ đã đáng kể. Ba mươi là mức tối thiểu, không phải mức tốt.
 */
export const NGUONG_BIEN_THE_TOI_THIEU = 30;

export function doKhoNoiDung(soMau = 1500): DoKhoNoiDung {
  const daDuyet = khuonDangDaDuyet();

  const nho = daDuyet
    .map((t) => ({ t, d: demBienThe(t, soMau) }))
    .filter(({ d }) => d.khacNhau < NGUONG_BIEN_THE_TOI_THIEU);

  // Có khuôn dạng nhỏ là do bản thân chương trình nhỏ — bảng nhân 2 và 5 chỉ
  // có đúng ngần ấy phép tính, và việc gặp lại chúng nhiều lần chính là cách
  // học thuộc bảng. Những trường hợp như vậy tác giả phải ghi rõ lý do ngay
  // trong khuôn dạng; bộ đo tách chúng ra khỏi danh sách cần sửa, nhưng vẫn
  // hiện lên để không ai quên chúng tồn tại.
  const quaBe = nho
    .filter(({ t }) => !t.ghiChuKhongGian)
    .map(({ t, d }) => ({ id: t.id, title: t.title, bienThe: d.khacNhau }));
  const coLyDo = nho
    .filter(({ t }) => t.ghiChuKhongGian)
    .map(({ t, d }) => ({
      id: t.id, title: t.title, bienThe: d.khacNhau, lyDo: t.ghiChuKhongGian as string,
    }));

  // Dựng đúng bốn tuần học bằng chính bộ lập kế hoạch mà trẻ sẽ dùng, chứ
  // không bằng một vòng lặp giả — nếu bộ lập kế hoạch thiên vị vài khuôn dạng
  // thì phép đo này phải thấy được.
  const de = new Set<string>();
  const demDang = new Map<string, number>();
  let tongBai = 0;
  for (let buoi = 0; buoi < SO_BUOI_BON_TUAN; buoi++) {
    const ke = lapKeHoach("do-luong", [], buoi * 104729 + 7).ke;
    for (const b of ke) {
      de.add(vanTay(b.templateId, b.seed));
      demDang.set(b.templateId, (demDang.get(b.templateId) ?? 0) + 1);
      tongBai += 1;
    }
  }

  return {
    soKhuonDang: daDuyet.length,
    khuonDangQuaBe: quaBe,
    khuonDangNhoCoLyDo: coLyDo,
    deKhacNhauBonTuan: de.size,
    soDeTrungBonTuan: tongBai - de.size,
    lanLapMoiDang: tongBai / Math.max(demDang.size, 1),
    soYccdDuocPhu: new Set(daDuyet.map((t) => t.yccd)).size,
  };
}
