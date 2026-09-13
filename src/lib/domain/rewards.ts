import type { Attempt } from "./types";

/**
 * Cơ chế khích lệ.
 *
 * BR-06: phần thưởng gắn với NỖ LỰC, không gắn với tỷ lệ trả lời đúng. Thưởng
 * theo đáp án đúng dạy trẻ né bài khó và đoán bừa trắc nghiệm — đúng thứ sản
 * phẩm muốn chữa. Hàm dưới đây cố tình không nhận tỷ lệ đúng làm đầu vào; nếu
 * có ai đó muốn thêm, họ sẽ phải sửa chữ ký hàm và đụng vào bài kiểm thử.
 *
 * NT-02: không có bảng xếp hạng theo điểm tuyệt đối. Mốc so sánh duy nhất là
 * chính trẻ ở những phiên trước.
 */
export interface PhanThuong {
  hatGiong: number;
  lyDo: string[];
}

export function tinhPhanThuong(attempts: Attempt[]): PhanThuong {
  const lyDo: string[] = [];
  let hat = 0;

  const soBaiDaLam = new Set(attempts.map((a) => a.itemId)).size;
  if (soBaiDaLam > 0) {
    hat += soBaiDaLam;
    lyDo.push(`Con đã làm ${soBaiDaLam} bài`);
  }

  // Tự sửa được sau khi sai là hành vi đáng thưởng nhất trong toàn sản phẩm.
  const tuSua = demTuSua(attempts);
  if (tuSua > 0) {
    hat += tuSua * 3;
    lyDo.push(`Con tự sửa đúng ${tuSua} lần sau khi làm sai`);
  }

  // Dùng gợi ý rồi làm tiếp cũng là nỗ lực, không phải là gian lận.
  const dungGoiYRoiLamTiep = attempts.filter((a) => a.hintsUsed > 0).length;
  if (dungGoiYRoiLamTiep > 0) {
    hat += dungGoiYRoiLamTiep;
    lyDo.push(`Con chịu khó xem gợi ý rồi làm tiếp ${dungGoiYRoiLamTiep} bài`);
  }

  const thuLai = attempts.filter((a) => a.attemptNo > 1).length;
  if (thuLai > 0) {
    hat += thuLai;
    lyDo.push(`Con thử lại ${thuLai} lần thay vì bỏ cuộc`);
  }

  return { hatGiong: hat, lyDo };
}

/** Số bài mà trẻ sai ở lần đầu nhưng tự làm đúng ở lần sau. */
export function demTuSua(attempts: Attempt[]): number {
  const theoBai = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const ds = theoBai.get(a.itemId) ?? [];
    ds.push(a);
    theoBai.set(a.itemId, ds);
  }
  let n = 0;
  for (const ds of theoBai.values()) {
    const theoThuTu = ds.slice().sort((x, y) => x.attemptNo - y.attemptNo);
    if (theoThuTu.length > 1 && !theoThuTu[0].correct && theoThuTu.some((a) => a.correct)) n += 1;
  }
  return n;
}

/** Thước đo BO-01: tỷ lệ trẻ tự sửa đúng sau gợi ý. */
export function tyLeTuSuaSauGoiY(attempts: Attempt[]): number {
  const sai = attempts.filter((a) => a.attemptNo === 1 && !a.correct);
  if (sai.length === 0) return 0;
  return demTuSua(attempts) / sai.length;
}
