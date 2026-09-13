import type { Yccd } from "./types";

/**
 * Danh mục yêu cầu cần đạt dùng trong giai đoạn 1 — lớp 2, học kỳ 2.
 *
 * Mã ở đây là mã nội bộ của Ô Ly, gắn với phát biểu tương ứng trong Chương
 * trình giáo dục phổ thông môn Toán. Mỗi khuôn dạng bắt buộc phải trỏ về một
 * mã trong danh mục này; đó là cơ chế để rà soát lại kho khi chương trình được
 * sửa đổi (BR-16, RR-05).
 */
export const YCCD: Yccd[] = [
  {
    code: "T2.SPT.01",
    grade: 2,
    term: 2,
    strand: "so-va-phep-tinh",
    statement: "Đọc, viết, so sánh các số trong phạm vi 1000; nhận biết cấu tạo trăm — chục — đơn vị.",
  },
  {
    code: "T2.SPT.02",
    grade: 2,
    term: 2,
    strand: "so-va-phep-tinh",
    statement: "Thực hiện phép cộng, phép trừ trong phạm vi 100 có nhớ.",
  },
  {
    code: "T2.SPT.03",
    grade: 2,
    term: 2,
    strand: "so-va-phep-tinh",
    statement: "Thực hiện phép nhân, phép chia trong bảng 2, 5.",
  },
  {
    code: "T2.DL.01",
    grade: 2,
    term: 2,
    strand: "do-luong",
    statement: "Nhận biết và chuyển đổi các đơn vị đo độ dài: xăng-ti-mét, đề-xi-mét, mét.",
  },
  {
    code: "T2.DL.02",
    grade: 2,
    term: 2,
    strand: "do-luong",
    statement: "Xem giờ đúng và giờ hơn trên đồng hồ kim; tính khoảng thời gian đơn giản.",
  },
  {
    code: "T2.HH.01",
    grade: 2,
    term: 2,
    strand: "hinh-hoc",
    statement: "Nhận dạng, đếm số hình trong một hình vẽ ghép; tính độ dài đường gấp khúc.",
  },
  {
    code: "T2.GT.01",
    grade: 2,
    term: 2,
    strand: "giai-toan",
    statement: "Giải bài toán có lời văn bằng một phép tính, dạng nhiều hơn — ít hơn.",
  },
  {
    code: "T2.GT.02",
    grade: 2,
    term: 2,
    strand: "giai-toan",
    statement: "Giải bài toán có lời văn bằng hai phép tính liên tiếp.",
  },
];

export const YCCD_BY_CODE = new Map(YCCD.map((y) => [y.code, y]));

export function requireYccd(code: string): Yccd {
  const y = YCCD_BY_CODE.get(code);
  if (!y) throw new Error(`Khuôn dạng trỏ tới mã yêu cầu cần đạt không tồn tại: ${code}`);
  return y;
}
