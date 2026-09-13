/**
 * Kho tên riêng và bối cảnh.
 *
 * BR-07: nhân vật, tên riêng và bối cảnh phải là của Việt Nam và nhất quán.
 * Mỗi cái tên lạ tốn một nhịp chú ý của trẻ, mà phần chú ý ở lứa 6–8 tuổi vốn
 * đã rất ít. Danh sách này là nguồn duy nhất; khuôn dạng không được tự đặt tên.
 */
export const TEN_BAN = [
  "Bống", "Cu Tí", "Mai", "Nam", "Bi", "Na", "Hùng", "Thảo", "Minh", "Chi",
  "Đức", "Linh", "Khoa", "Hà", "Sơn", "Trang",
] as const;

export const NGUOI_LON = ["bà", "mẹ", "bố", "cô giáo", "chú hàng xóm"] as const;

export const BOI_CANH = [
  "ở sân trường",
  "trong vườn nhà bà",
  "ở chợ quê",
  "trong lớp 2A",
  "ngoài bờ ao",
  "ở sân bóng khu tập thể",
] as const;

export const DO_VAT = [
  { ten: "quả cam", dv: "quả" },
  { ten: "cái bút chì", dv: "cái" },
  { ten: "quyển vở ô ly", dv: "quyển" },
  { ten: "viên bi", dv: "viên" },
  { ten: "con vịt", dv: "con" },
  { ten: "chiếc kẹo", dv: "chiếc" },
  { ten: "bông hoa", dv: "bông" },
] as const;

export const CAY = ["cây bàng", "cây phượng", "cây cau", "cột đèn"] as const;
