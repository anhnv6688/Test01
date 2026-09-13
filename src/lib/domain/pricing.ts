/**
 * Gói cước và trần định lượng.
 *
 * Nguyên tắc định giá của BRD mục 9: bán công đoạn xử lý và kết quả theo dõi,
 * KHÔNG bán nội dung. Chỗ phát sinh chi phí thật thì tính tiền và có trần; chỗ
 * không phát sinh chi phí thì miễn phí không giới hạn (BR-19).
 *
 * Vì vậy trong toàn bộ mã nguồn chỉ có đúng một hành vi bị đếm lượt: xử lý một
 * trang ảnh mới. Luyện tập trên kho khuôn dạng không bao giờ bị đếm.
 */
export type MaGoi = "vo-nhap" | "vo-o-ly-do-thi" | "vo-o-ly-tinh" | "kem-rieng";
export type DiaBan = "do-thi" | "tinh";

export interface Goi {
  ma: MaGoi;
  ten: string;
  giaThang: number;
  /** Trần số trang ảnh xử lý được mỗi tháng. null nghĩa là không giới hạn. */
  tranTrangThang: number | null;
  /** Luyện tập trên kho khuôn dạng: luôn không giới hạn ở mọi gói (BR-19). */
  luyenTapKhongGioiHan: true;
  giaiThich: string;
}

/**
 * Trần gói miễn phí đang để ở 2 trang mỗi tháng.
 *
 * Đây là con số của kịch bản "nhóm F, trần gói miễn phí 2 trang" tại mục 9.1,
 * ứng với điểm hòa vốn khoảng 970 hộ trả phí. VM-07 chưa được chủ đầu tư chốt,
 * nên con số nằm ở đúng một chỗ này để đổi được trong một dòng khi có quyết
 * định, và mục Chi phí trong phần dành cho phụ huynh sẽ tự tính lại theo.
 */
export const TRAN_MIEN_PHI_TRANG_THANG = 2;

export const GOI: Record<MaGoi, Goi> = {
  "vo-nhap": {
    ma: "vo-nhap",
    ten: "Vở nháp",
    giaThang: 0,
    tranTrangThang: TRAN_MIEN_PHI_TRANG_THANG,
    luyenTapKhongGioiHan: true,
    giaiThich:
      "Luyện tập không giới hạn trên kho bài của Ô Ly. Phần chụp ảnh có trần vì mỗi trang ảnh là một khoản chi phí thật mà Ô Ly phải trả cho bên xử lý.",
  },
  "vo-o-ly-do-thi": {
    ma: "vo-o-ly-do-thi",
    ten: "Vở ô ly",
    giaThang: 59000,
    tranTrangThang: 60,
    luyenTapKhongGioiHan: true,
    giaiThich: "Dành cho Hà Nội, Thành phố Hồ Chí Minh và Đà Nẵng.",
  },
  "vo-o-ly-tinh": {
    ma: "vo-o-ly-tinh",
    ten: "Vở ô ly",
    giaThang: 39000,
    tranTrangThang: 60,
    luyenTapKhongGioiHan: true,
    giaiThich: "Dành cho các địa bàn còn lại.",
  },
  "kem-rieng": {
    ma: "kem-rieng",
    ten: "Kèm riêng",
    giaThang: 149000,
    tranTrangThang: 200,
    luyenTapKhongGioiHan: true,
    giaiThich: "Dành cho hộ có nhu cầu cao.",
  },
};

export function goiTraPhiTheoDiaBan(diaBan: DiaBan): Goi {
  return diaBan === "do-thi" ? GOI["vo-o-ly-do-thi"] : GOI["vo-o-ly-tinh"];
}

/**
 * BR-11: một thuê bao phục vụ cả hộ gia đình, không tính tiền theo số con.
 * Hằng số này tồn tại để nói rõ ý định, và để bài kiểm thử chặn việc ai đó
 * lặng lẽ thêm giới hạn theo đầu con về sau.
 */
export const GIOI_HAN_SO_CON_MOI_HO = null;

export function dinhDangTien(d: number): string {
  return `${d.toLocaleString("vi-VN")} đồng`;
}
