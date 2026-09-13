import { randomUUID } from "node:crypto";

/**
 * Lớp thứ hai: gói dữ liệu gửi ra bên xử lý không kèm mã truy ngược (BR-34).
 *
 * Nếu phần gửi đi đạt chuẩn khử nhận dạng thì nó không còn là dữ liệu cá nhân,
 * và toàn bộ chế độ chuyển dữ liệu xuyên biên giới không có đối tượng áp dụng.
 * Đây là đòn bẩy pháp lý lớn nhất của dự án (BR-34, CR-02), nên hàm dựng gói
 * dưới đây cố tình viết theo lối DANH SÁCH TRẮNG: chỉ những trường được liệt kê
 * mới đi ra ngoài. Thêm một trường mới là một hành động có chủ ý, không thể xảy
 * ra do vô tình truyền cả đối tượng vào.
 */
export interface GoiGuiDi {
  /** Mã ngẫu nhiên cho riêng lần gọi này, không lưu, không nối được với tài khoản. */
  maLanGoi: string;
  loaiViec: "doc-de-bai" | "cham-bai-lam";
  /** Gợi ý phạm vi chương trình, không phải thông tin về người. */
  lop: 1 | 2;
  hocKy: 1 | 2;
  anhBase64: string;
}

/** Các trường tuyệt đối không được xuất hiện trong gói gửi đi. */
export const TRUONG_CAM = [
  "householdId",
  "childId",
  "accountId",
  "email",
  "phone",
  "deviceId",
  "ip",
  "tenTre",
  "tenTruong",
  "tenLop",
  "fileName",
  "sessionId",
] as const;

export function dungGoiGuiDi(input: {
  loaiViec: GoiGuiDi["loaiViec"];
  lop: 1 | 2;
  hocKy: 1 | 2;
  anhBase64: string;
}): GoiGuiDi {
  // Danh sách trắng: chỉ bốn trường này, cộng một mã ngẫu nhiên dùng một lần.
  return {
    maLanGoi: randomUUID(),
    loaiViec: input.loaiViec,
    lop: input.lop,
    hocKy: input.hocKy,
    anhBase64: input.anhBase64,
  };
}

/** Dùng trong kiểm thử và trong nhật ký rà soát: gói có rò rỉ trường cấm không. */
export function timTruongCamTrongGoi(goi: object): string[] {
  const keys = new Set(Object.keys(goi));
  return TRUONG_CAM.filter((k) => keys.has(k));
}
