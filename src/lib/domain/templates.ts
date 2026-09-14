import { KHUON_DANG as DO_LUONG } from "./templates/do-luong";
import { KHUON_DANG as GIAI_TOAN } from "./templates/giai-toan";
import { KHUON_DANG as HINH_HOC } from "./templates/hinh-hoc";
import { KHUON_DANG as SO_HOC } from "./templates/so-hoc";
import type { Template } from "./types";

/**
 * Kho khuôn dạng bài — giai đoạn 1, lớp 2 học kỳ 2.
 *
 * Kho chỉ lưu CẤU TRÚC toán học cùng tham số và ràng buộc; từ một khuôn dạng
 * sinh ra vô hạn bài cụ thể khác nhau. Đây là lý do kho hữu hạn nhưng trẻ học
 * bốn tuần liên tục không gặp lại bài cũ (điều kiện ra mắt số 4).
 *
 * Khuôn dạng nằm trong thư mục ./templates, chia theo mạch nội dung của
 * Chương trình giáo dục phổ thông. Phần quy tắc viết khuôn dạng mới và các
 * hàm dùng chung nằm ở ./templates/chung.ts.
 */
export const TEMPLATES: Template[] = [...SO_HOC, ...DO_LUONG, ...HINH_HOC, ...GIAI_TOAN];

export const TEMPLATE_BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));
