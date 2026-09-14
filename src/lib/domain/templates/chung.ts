import type { HintRung } from "../types";

/**
 * Phần dùng chung của mọi khuôn dạng bài.
 *
 * Khuôn dạng chỉ mô tả CẤU TRÚC toán học cùng tham số và ràng buộc; từ một
 * khuôn dạng sinh ra vô hạn bài cụ thể khác nhau.
 *
 * Mỗi khuôn dạng chỉ mô tả CẤU TRÚC toán học cùng tham số và ràng buộc; từ một
 * khuôn dạng sinh ra vô hạn bài cụ thể khác nhau. Đây là lý do kho nội dung
 * hữu hạn nhưng trẻ học bốn tuần liên tục không gặp lại bài cũ (điều kiện ra
 * mắt số 4).
 *
 * Ba quy tắc bất di bất dịch khi viết một khuôn dạng mới:
 *   1. Không bậc gợi ý nào được chứa đáp án của chính bài đang làm (BR-03).
 *      Bậc 3 làm mẫu bài TƯƠNG TỰ với con số khác hẳn.
 *   2. Mọi tên riêng lấy từ src/lib/domain/names.ts, không tự đặt (BR-07).
 *   3. Mỗi bẫy gài vào bài phải khai kèm con số mà trẻ viết ra khi mắc bẫy,
 *      để việc nhận diện là tra bảng chứ không phải suy đoán (BR-04).
 */

/**
 * Bài mẫu cho bậc gợi ý thứ ba.
 *
 * BR-03 nói bậc ba làm mẫu một bài TƯƠNG TỰ. "Tương tự" ở đây là một ràng buộc
 * đo được chứ không phải lời khuyên: không con số nào trong bài mẫu được trùng
 * với đáp án của bài trẻ đang làm. Một bài mẫu ra đúng con số trẻ đang phải tìm
 * chính là đưa đáp án, chỉ khác cách gói.
 *
 * Vì vậy mỗi khuôn dạng khai vài phương án bài mẫu kèm đầy đủ các số xuất hiện
 * trong đó, và hàm này chọn phương án đầu tiên không đụng đáp án. Các phương án
 * phải rời nhau về tập số; nếu không, hàm ném lỗi ngay tại chỗ thay vì lặng lẽ
 * trả về một bài mẫu có đáp án.
 */
export interface ViDu {
  so: number[];
  text: string;
  speech: string;
}

export function chonViDu(dapAn: number, viDu: ViDu[]): HintRung {
  const an = viDu.find((v) => !v.so.includes(dapAn));
  if (!an) {
    throw new Error(
      `Mọi phương án bài mẫu đều chứa đáp án ${dapAn}. Khuôn dạng cần thêm một phương án rời nhau.`,
    );
  }
  return { level: 3, text: `Xem bài tương tự: ${an.text}`, speech: an.speech };
}

