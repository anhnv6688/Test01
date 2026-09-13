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
  /**
   * Trần số trang ảnh xử lý được mỗi NGÀY. null nghĩa là không giới hạn theo ngày.
   * Lượt không dùng hết trong ngày KHÔNG cộng dồn sang ngày sau.
   */
  tranTrangNgay: number | null;
  /** Trần theo tháng, dùng cho gói trả phí. null nghĩa là không giới hạn theo tháng. */
  tranTrangThang: number | null;
  /** Luyện tập trên kho khuôn dạng: luôn không giới hạn ở mọi gói (BR-19). */
  luyenTapKhongGioiHan: true;
  giaiThich: string;
}

/**
 * Trần gói miễn phí: 2 trang MỖI NGÀY, không cộng dồn.
 *
 * VM-07 đã được chủ đầu tư chốt ngày 13/9/2026: gói miễn phí ĐƯỢC dùng luồng
 * chụp ảnh, mỗi ngày hai lượt, lượt không dùng hết không chuyển sang ngày sau.
 *
 * Chọn trần theo ngày thay vì theo tháng là một quyết định có lý về sản phẩm:
 * nó tạo nhịp dùng hằng ngày đúng với thói quen kèm con ba mươi phút mỗi tối,
 * và nó chặn được kiểu dồn cả tháng vào một buổi chụp hai ba chục trang.
 *
 * Nhưng nó có hệ quả tài chính phải nói rõ, xem TRAN_HOA_VON_TRANG_HO_MIEN_PHI
 * bên dưới: mức trần này cho phép một hộ miễn phí dùng tới khoảng 60 trang mỗi
 * tháng, trong khi mô hình chi phí ngày 13/9/2026 chỉ chịu được khoảng 4 trang.
 * Con số thật phụ thuộc vào tỷ lệ dùng hết trần, mà tỷ lệ đó chưa ai đo.
 */
export const TRAN_MIEN_PHI_TRANG_NGAY = 2;

/** Trần theo tháng của gói trả phí. */
export const TRAN_TRA_PHI_TRANG_THANG = 60;

/**
 * Số trang mỗi tháng mà một hộ MIỄN PHÍ được phép dùng trung bình thì biên đóng
 * góp mới còn dương, tính theo đúng các giả định của mô hình chi phí 13/9/2026:
 * doanh thu bình quân 61.000 đồng mỗi hộ trả phí, chi phí xử lý 800 đồng mỗi
 * trang, hộ trả phí dùng 30 trang mỗi tháng, tỷ lệ chuyển đổi 8% nên mỗi hộ trả
 * phí đang gánh 11,5 hộ miễn phí.
 *
 *   (61.000 − 30 × 800) / (11,5 × 800) ≈ 4,0 trang
 *
 * Đây là con số để theo dõi, không phải để chặn: trần chặn là trần theo ngày ở
 * trên. Trang Chi phí của phụ huynh và mục theo dõi nội bộ dùng con số này để
 * báo sớm khi mức dùng thật vượt ngưỡng, theo đúng tinh thần BR-22.
 */
export const TRAN_HOA_VON_TRANG_HO_MIEN_PHI = 4;

export const GOI: Record<MaGoi, Goi> = {
  "vo-nhap": {
    ma: "vo-nhap",
    ten: "Vở nháp",
    giaThang: 0,
    tranTrangNgay: TRAN_MIEN_PHI_TRANG_NGAY,
    tranTrangThang: null,
    luyenTapKhongGioiHan: true,
    giaiThich:
      "Luyện tập không giới hạn trên kho bài của Ô Ly, cộng hai lần chụp mỗi ngày. Hai lượt đó làm mới vào sáng hôm sau và không cộng dồn, vì mỗi trang ảnh là một khoản chi phí thật mà Ô Ly phải trả cho bên xử lý.",
  },
  "vo-o-ly-do-thi": {
    ma: "vo-o-ly-do-thi",
    ten: "Vở ô ly",
    giaThang: 59000,
    tranTrangNgay: null,
    tranTrangThang: TRAN_TRA_PHI_TRANG_THANG,
    luyenTapKhongGioiHan: true,
    giaiThich: "Dành cho Hà Nội, Thành phố Hồ Chí Minh và Đà Nẵng.",
  },
  "vo-o-ly-tinh": {
    ma: "vo-o-ly-tinh",
    ten: "Vở ô ly",
    giaThang: 39000,
    tranTrangNgay: null,
    tranTrangThang: TRAN_TRA_PHI_TRANG_THANG,
    luyenTapKhongGioiHan: true,
    giaiThich: "Dành cho các địa bàn còn lại.",
  },
  "kem-rieng": {
    ma: "kem-rieng",
    ten: "Kèm riêng",
    giaThang: 149000,
    tranTrangNgay: null,
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
