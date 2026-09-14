import { chamBaiLam } from "@/lib/domain/cham-bai";
import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";

/**
 * So khớp phiên âm của mô hình với nhãn, và quan trọng hơn — so KẾT LUẬN.
 *
 * Đo độ chính xác phiên âm thôi là chưa đủ. Thứ làm hại một gia đình không phải
 * là máy đọc nhầm một chữ số, mà là máy nói với bố mẹ rằng con làm sai trong
 * khi con làm đúng. Hai chuyện đó không tỷ lệ với nhau: một chữ số đọc nhầm ở
 * cột đơn vị làm lật kết luận, còn đọc nhầm tên nhân vật thì không.
 *
 * Vì vậy bộ đo chạy CẢ BỘ CHẤM trên hai đầu vào — nhãn và phiên âm của mô hình —
 * rồi so hai kết luận. Nhờ thế mọi khác biệt về kết luận đều quy được về đúng
 * một nguyên nhân là lỗi đọc, chứ không lẫn với lỗi của bộ chấm.
 */

export type MucKhop = "khop-het" | "dung-dang-sai-so" | "sai-dang" | "thieu" | "thua";

export interface KhopMotBai {
  viTri: number;
  mucKhop: MucKhop;
  dangNhan: string | null;
  dangMay: string | null;
  /** Các trường lệch nhau, để biết mô hình hay nhầm chỗ nào. */
  truongLech: string[];
}

/** Kết luận của bộ chấm, rút gọn để so sánh. */
type KetLuan = boolean | null;

export type LechKetLuan =
  | "giong-nhau"
  | "bao-dong-gia"
  | "bo-sot"
  | "mat-ket-luan"
  | "them-ket-luan";

export interface KhopMotAnh {
  tep: string;
  /** Ô Ly có đọc được ảnh không, và người có đọc được không. */
  mayDocDuoc: boolean;
  nguoiDocDuoc: boolean;
  /** Máy từ chối một ảnh mà người đọc được — mất một lượt của phụ huynh. */
  tuChoiOan: boolean;
  /** Máy đọc bừa một ảnh mà người còn không đọc nổi — nguy hiểm hơn nhiều. */
  docBua: boolean;
  soBaiNhan: number;
  soBaiMay: number;
  bai: KhopMotBai[];
  lechKetLuan: LechKetLuan[];
}

/**
 * So hai danh sách bài theo THỨ TỰ trên trang.
 *
 * Không cố ghép cặp thông minh: nếu mô hình bỏ sót bài thứ hai thì mọi bài sau
 * đó lệch một nhịp, và bộ đo phải thấy đúng như vậy. Ghép cặp thông minh sẽ che
 * mất lỗi bỏ sót, mà bỏ sót một bài trên trang vở chính là lỗi phụ huynh phát
 * hiện ngay.
 */
export function soKhopCacBai(nhan: DangBaiLam[], may: DangBaiLam[]): KhopMotBai[] {
  const ra: KhopMotBai[] = [];
  const n = Math.max(nhan.length, may.length);
  for (let i = 0; i < n; i++) {
    const a = nhan[i];
    const b = may[i];
    if (!a) {
      ra.push({ viTri: i, mucKhop: "thua", dangNhan: null, dangMay: b.dang, truongLech: [] });
      continue;
    }
    if (!b) {
      ra.push({ viTri: i, mucKhop: "thieu", dangNhan: a.dang, dangMay: null, truongLech: [] });
      continue;
    }
    if (a.dang !== b.dang) {
      ra.push({ viTri: i, mucKhop: "sai-dang", dangNhan: a.dang, dangMay: b.dang, truongLech: [] });
      continue;
    }
    const lech = truongLechNhau(a, b);
    ra.push({
      viTri: i,
      mucKhop: lech.length === 0 ? "khop-het" : "dung-dang-sai-so",
      dangNhan: a.dang,
      dangMay: b.dang,
      truongLech: lech,
    });
  }
  return ra;
}

/** Các trường khác nhau giữa hai bài cùng dạng. */
function truongLechNhau(a: DangBaiLam, b: DangBaiLam): string[] {
  const lech: string[] = [];
  const ka = a as unknown as Record<string, unknown>;
  const kb = b as unknown as Record<string, unknown>;
  for (const k of new Set([...Object.keys(ka), ...Object.keys(kb)])) {
    if (k === "dang") continue;
    if (JSON.stringify(ka[k]) !== JSON.stringify(kb[k])) lech.push(k);
  }
  return lech;
}

/**
 * So kết luận của bộ chấm trên nhãn với kết luận trên phiên âm của mô hình.
 *
 * Bốn kiểu lệch, xếp theo mức độ tai hại giảm dần:
 *
 *   bao-dong-gia   Con làm ĐÚNG mà Ô Ly bảo sai. Tệ nhất: bố mẹ sẽ chữa một
 *                  bài vốn không cần chữa, và đứa trẻ bị mắng oan.
 *   bo-sot         Con làm SAI mà Ô Ly bảo đúng. Mất cơ hội chữa, nhưng không
 *                  gây hại trực tiếp.
 *   mat-ket-luan   Nhãn kết luận được, Ô Ly thì không dám. An toàn, chỉ phí.
 *   them-ket-luan  Nhãn không kết luận được mà Ô Ly lại dám. Đáng ngờ.
 */
export function soKhopKetLuan(nhan: DangBaiLam[], may: DangBaiLam[]): LechKetLuan[] {
  const ra: LechKetLuan[] = [];
  const n = Math.min(nhan.length, may.length);
  for (let i = 0; i < n; i++) {
    const klNhan: KetLuan = chamBaiLam(nhan[i]).dung;
    const klMay: KetLuan = chamBaiLam(may[i]).dung;
    if (klNhan === klMay) { ra.push("giong-nhau"); continue; }
    if (klNhan === true && klMay === false) { ra.push("bao-dong-gia"); continue; }
    if (klNhan === false && klMay === true) { ra.push("bo-sot"); continue; }
    if (klNhan !== null && klMay === null) { ra.push("mat-ket-luan"); continue; }
    ra.push("them-ket-luan");
  }
  return ra;
}

export function soKhopMotAnh(
  tep: string,
  nguoiDocDuoc: boolean,
  nhanBai: DangBaiLam[],
  ketQuaMay: { docDuoc: boolean; cacBai: DangBaiLam[] },
): KhopMotAnh {
  const bai = ketQuaMay.docDuoc ? soKhopCacBai(nhanBai, ketQuaMay.cacBai) : [];
  return {
    tep,
    mayDocDuoc: ketQuaMay.docDuoc,
    nguoiDocDuoc,
    tuChoiOan: nguoiDocDuoc && !ketQuaMay.docDuoc,
    docBua: !nguoiDocDuoc && ketQuaMay.docDuoc,
    soBaiNhan: nhanBai.length,
    soBaiMay: ketQuaMay.cacBai.length,
    bai,
    lechKetLuan: ketQuaMay.docDuoc ? soKhopKetLuan(nhanBai, ketQuaMay.cacBai) : [],
  };
}

/**
 * Mức khớp của một ảnh chụp ĐỀ BÀI.
 *
 * Tách "khop-so" ra khỏi "khop-het" vì với đề bài, cái quyết định lời giảng
 * đúng hay sai là các CON SỐ, không phải từng chữ. Máy đọc "Lan có 15 cái kẹo"
 * thành "Lan có 15 chiếc kẹo" thì lời giảng vẫn đúng; đọc thành "16 cái kẹo"
 * thì cả bài giảng sai từ dòng đầu. Gộp hai thứ này vào một tỷ lệ sẽ làm bộ đo
 * báo động vì những chuyện không đáng, rồi che mất chuyện đáng.
 */
export type MucKhopDe = "khop-het" | "khop-so" | "sai-so";

export interface KhopDeBai {
  muc: MucKhopDe;
  soNhan: number[];
  soMay: number[];
}

function chuanHoaDe(s: string): string {
  return s
    .toLowerCase()
    .replace(/[×x]/g, "*")
    .replace(/[÷:]/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/[.,;!?"'()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cacSoTrong(s: string): number[] {
  return (s.match(/\d+/g) ?? []).map(Number);
}

export function soKhopDeBai(nhan: string, may: string): KhopDeBai {
  const soNhan = cacSoTrong(nhan);
  const soMay = cacSoTrong(may);
  const soGiongNhau =
    soNhan.length === soMay.length && soNhan.every((x, i) => x === soMay[i]);
  if (!soGiongNhau) return { muc: "sai-so", soNhan, soMay };
  const muc = chuanHoaDe(nhan) === chuanHoaDe(may) ? "khop-het" : "khop-so";
  return { muc, soNhan, soMay };
}
