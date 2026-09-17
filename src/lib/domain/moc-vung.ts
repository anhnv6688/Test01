import { YCCD } from "./curriculum";
import type { Attempt } from "./types";

/**
 * Mốc "đã vững" của từng yêu cầu cần đạt.
 *
 * Vì sao cần: trước mốc này, sản phẩm không có đích nào để cán. Vòng chọn bài
 * dồn 60% số bài vào chỗ trẻ đang yếu và cứ thế chạy mãi — đúng về mặt luyện
 * tập, nhưng phụ huynh không bao giờ biết con đang tiến tới đâu, và không bao
 * giờ có một buổi tối nào để mừng. Một sản phẩm chỉ nói "con vẫn còn yếu chỗ
 * này" là một sản phẩm người ta bỏ.
 *
 * NT-02: đây KHÔNG phải điểm số và không phải bảng xếp hạng. Mốc so sánh duy
 * nhất là chính trẻ ở những phiên trước, và con số không bao giờ hiện trên màn
 * hình của trẻ — có bài kiểm thử canh điều đó. Bề mặt của trẻ cố ý không có ô
 * "đúng mấy trên mấy" (BR-06), và mốc vững cũng là một dạng đếm điểm nếu để trẻ
 * nhìn thấy.
 *
 * NT-07: mọi câu chữ ở đây mô tả VIỆC ĐÃ XẢY RA trong các phiên học, không suy
 * diễn gì về đứa trẻ. "Mười lần gần nhất đúng ngay tám lần" là một quan sát;
 * "con đã nắm vững kiến thức này" là một kết luận, và ta không đưa ra kết luận.
 */

/** Cửa sổ xét: mười lần làm bài gần nhất của cùng một yêu cầu cần đạt. */
export const CUA_SO = 10;

/** Đạt mốc khi đúng ngay lần đầu từ mức này trở lên trong cửa sổ. */
export const NGUONG_VUNG = 0.8;

/**
 * Tuột mốc khi rơi xuống dưới mức này — KHÔNG phải cứ dưới 0,8 là mất.
 *
 * Nếu lên và xuống dùng chung một ngưỡng thì một đứa trẻ dao động quanh 80% sẽ
 * thấy mốc bật tắt mỗi ngày: 8/10 hôm nay là "đã vững", 7/10 ngày mai là mất,
 * hôm kia lại có. Phụ huynh đọc cái đó không ra thông tin gì, chỉ ra cảm giác
 * con mình trồi sụt thất thường — và đó là cảm giác sai, vì thứ trồi sụt là
 * phép đo chứ không phải đứa trẻ.
 *
 * Hai ngưỡng cách nhau tạo ra một vùng đệm: vào từ 80% trở lên, chỉ ra khi rơi
 * xuống dưới 60%, còn ở giữa thì giữ nguyên trạng thái cũ. 60% là đúng con số
 * `yccdDangYeu()` dùng để gọi một yêu cầu là "yếu", nên mốc chỉ mất đúng vào
 * lúc bộ chọn bài bắt đầu ưu tiên luyện lại chỗ đó — hai bộ phận nói cùng một
 * câu chuyện.
 */
export const NGUONG_TUOT = 0.6;

export type TrangThaiVung =
  /** Chưa đủ mười lần làm bài để nói được gì. */
  | "chua-du"
  /** Đã đủ dữ liệu, đang luyện, chưa tới mốc. */
  | "dang-luyen"
  /** Đã đạt mốc và chưa tuột. */
  | "vung";

export interface MocVung {
  yccd: string;
  phatBieu: string;
  trangThai: TrangThaiVung;
  /** Số lần làm bài LẦN ĐẦU đã ghi nhận cho yêu cầu này. */
  soLan: number;
  /** Tỷ lệ đúng ngay lần đầu trên cửa sổ gần nhất; null khi chưa đủ. */
  tyLe: number | null;
  /** Thời điểm lần làm bài đưa yêu cầu này lên mốc; null nếu chưa/đã tuột. */
  datLuc: string | null;
}

/**
 * Chỉ tính LẦN THỬ ĐẦU của mỗi bài, khác với `yccdDangYeu()` ở session.ts —
 * hàm kia đếm cả những lần làm lại vào mẫu số.
 *
 * Khác nhau có chủ ý, và đây là chỗ ghi lại lý do để người sau đừng "dọn dẹp"
 * cho hai bên giống nhau:
 *
 *   "Yếu" là tín hiệu ĐIỀU HƯỚNG — nó quyết định buổi sau trẻ luyện gì. Nhận
 *   nhầm một yêu cầu là yếu thì hậu quả là trẻ luyện thêm vài bài, không mất gì.
 *   Nên nó nên dễ kích hoạt, và đếm cả lần làm lại vào mẫu số làm đúng việc đó.
 *
 *   "Vững" là một LỜI NÓI VỚI PHỤ HUYNH. Nói con đã vững trong khi con chưa
 *   vững là làm hỏng chính thứ khiến người ta tin sản phẩm. Nên nó phải khó đạt
 *   và phải đo đúng điều nó tuyên bố: con tự làm được ngay, không cần thử lại.
 *
 * Hai bên lệch nhau về cùng một hướng an toàn, theo hai chiều ngược nhau. Sửa
 * cho giống nhau là phá mất một trong hai.
 */
function lanDau(attempts: Attempt[]): Attempt[] {
  return attempts.filter((a) => a.attemptNo === 1);
}

/**
 * Tính trạng thái của MỘT yêu cầu cần đạt bằng cách đi dọc lịch sử từ đầu.
 *
 * Đi dọc chứ không chỉ nhìn mười lần cuối, vì trạng thái có nhớ: đã đạt mốc thì
 * giữ cho tới khi rơi hẳn xuống dưới ngưỡng tuột. Nhìn mỗi cửa sổ cuối thì
 * không biết được trước đó đã từng đạt hay chưa, và vùng đệm mất tác dụng.
 *
 * Không lưu gì xuống cơ sở dữ liệu: trạng thái suy ra được hoàn toàn từ lịch sử
 * đã có. Thêm một bảng nữa nghĩa là thêm một chỗ có thể lệch với sự thật, và
 * thêm một thứ phải xóa khi hộ yêu cầu xóa dữ liệu.
 */
function tinhMotYccd(theoThuTu: Attempt[]): Pick<MocVung, "trangThai" | "soLan" | "tyLe" | "datLuc"> {
  const cua: boolean[] = [];
  let trangThai: TrangThaiVung = "chua-du";
  let datLuc: string | null = null;

  for (const a of theoThuTu) {
    cua.push(a.correct);
    if (cua.length > CUA_SO) cua.shift();
    if (cua.length < CUA_SO) continue;

    const ty = cua.filter(Boolean).length / CUA_SO;
    if (trangThai !== "vung") {
      trangThai = ty >= NGUONG_VUNG ? "vung" : "dang-luyen";
      datLuc = trangThai === "vung" ? a.at : null;
    } else if (ty < NGUONG_TUOT) {
      trangThai = "dang-luyen";
      datLuc = null;
    }
  }

  return {
    trangThai,
    soLan: theoThuTu.length,
    tyLe: cua.length === CUA_SO ? cua.filter(Boolean).length / CUA_SO : null,
    datLuc,
  };
}

/**
 * Trạng thái của TẤT CẢ yêu cầu cần đạt, kể cả những yêu cầu trẻ chưa gặp bao
 * giờ — phụ huynh cần thấy cả phần chưa đụng tới, nếu không bảng này chỉ là một
 * danh sách thành tích và giấu mất phần còn lại của học kỳ.
 *
 * `attempts` phải theo thứ tự thời gian TĂNG DẦN. `lichSuCuaCon()` trả về đúng
 * thứ tự đó.
 */
export function tinhMocVung(attempts: Attempt[]): MocVung[] {
  const theoYccd = new Map<string, Attempt[]>();
  for (const a of lanDau(attempts)) {
    theoYccd.set(a.yccd, [...(theoYccd.get(a.yccd) ?? []), a]);
  }
  return YCCD.map((y) => ({
    yccd: y.code,
    phatBieu: y.statement,
    ...tinhMotYccd(theoYccd.get(y.code) ?? []),
  }));
}

export function demVung(moc: MocVung[]): { vung: number; tong: number } {
  return { vung: moc.filter((m) => m.trangThai === "vung").length, tong: moc.length };
}

/**
 * Những yêu cầu VỪA đạt mốc trong ngày — thứ đáng báo cho phụ huynh tối nay.
 *
 * Tính bằng cách so trạng thái trước và sau các lần làm bài của ngày đó, chứ
 * không chỉ đọc `datLuc` rồi so ngày: một yêu cầu có thể đạt mốc, tuột, rồi đạt
 * lại trong cùng một ngày dài, và lúc ấy `datLuc` chỉ giữ lần cuối.
 */
export function mocDatTrongNgay(attempts: Attempt[], ngay: string): MocVung[] {
  const truoc = new Map(
    tinhMocVung(attempts.filter((a) => a.at.slice(0, 10) < ngay)).map((m) => [m.yccd, m.trangThai]),
  );
  return tinhMocVung(attempts.filter((a) => a.at.slice(0, 10) <= ngay)).filter(
    (m) => m.trangThai === "vung" && truoc.get(m.yccd) !== "vung",
  );
}

/**
 * Câu mô tả trạng thái, viết cho phụ huynh đọc.
 *
 * Mô tả việc đã xảy ra, không kết luận về đứa trẻ (NT-07). Và không bao giờ
 * dùng chữ "chưa đạt" hay "kém" cho nhóm đang luyện: một yêu cầu đang luyện là
 * chuyện bình thường của việc học, không phải một thất bại cần gọi tên.
 */
export function moTaMoc(m: MocVung): string {
  switch (m.trangThai) {
    case "chua-du":
      return m.soLan === 0
        ? "Chưa gặp bài nào thuộc phần này."
        : `Mới làm ${m.soLan} bài — cần ${CUA_SO} bài mới nói được gì.`;
    case "dang-luyen":
      return `Đang luyện: ${CUA_SO} bài gần nhất đúng ngay ${Math.round((m.tyLe ?? 0) * CUA_SO)} bài.`;
    case "vung":
      return `${CUA_SO} bài gần nhất đúng ngay ${Math.round((m.tyLe ?? 0) * CUA_SO)} bài.`;
  }
}
