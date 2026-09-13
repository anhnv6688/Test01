import { GOI, type MaGoi } from "./pricing";

/**
 * Đo lượt dùng và chi phí.
 *
 * BR-19: chi phí biến đổi phải được giới hạn tại đúng chỗ phát sinh hóa đơn, và
 * CHỈ ở chỗ đó. BR-22: chi phí thật phải theo dõi được ở mức từng hộ, hằng tuần,
 * chứ không phải phát hiện vào cuối quý.
 *
 * BR-31: một lần xử lý thất bại KHÔNG được trừ lượt. Vì vậy lượt chỉ được ghi
 * sau khi đã có kết quả trả về cho phụ huynh, không ghi lúc nhận ảnh.
 */

/** Giả định GD-02 của BRD: chi phí xử lý một trang khoảng 800 đồng, chưa đo thật. */
export const CHI_PHI_MOI_TRANG_GIA_DINH = 800;

export type HanhViCoPhi = "xu-ly-trang-anh";

export interface LuotDung {
  householdId: string;
  hanhVi: HanhViCoPhi;
  at: string;
  /** Chi phí ước tính, đồng. Thay bằng số thật khi có hóa đơn của nhà cung cấp. */
  chiPhiUocTinh: number;
}

export interface TinhTrangTran {
  /** Số trang đã xử lý trong NGÀY hôm nay. */
  daDungHomNay: number;
  /** Số trang đã xử lý trong THÁNG này. */
  daDungThangNay: number;
  tranNgay: number | null;
  tranThang: number | null;
  /** Còn lại trong ngày. null nghĩa là không có trần ngày. */
  conLaiHomNay: number | null;
  /** Còn lại trong tháng. null nghĩa là không có trần tháng. */
  conLaiThangNay: number | null;
  vuotTran: boolean;
  /** Trần nào đang chặn, để nói cho phụ huynh biết bao giờ dùng lại được. */
  tranDangChan: "ngay" | "thang" | null;
}

export interface MucDaDung {
  homNay: number;
  thangNay: number;
}

/**
 * Tính trần theo cả ngày lẫn tháng.
 *
 * Lượt không dùng hết KHÔNG cộng dồn: điều đó không cần một dòng mã nào để thực
 * hiện, vì phép tính chỉ nhìn vào số trang đã dùng trong ĐÚNG ngày hôm nay.
 * Không có kho lượt tích lũy nào tồn tại để mà cộng dồn.
 */
export function tinhTran(goi: MaGoi, daDung: MucDaDung): TinhTrangTran {
  const tranNgay = GOI[goi].tranTrangNgay;
  const tranThang = GOI[goi].tranTrangThang;

  const conLaiHomNay = tranNgay === null ? null : Math.max(0, tranNgay - daDung.homNay);
  const conLaiThangNay = tranThang === null ? null : Math.max(0, tranThang - daDung.thangNay);

  const hetNgay = tranNgay !== null && daDung.homNay >= tranNgay;
  const hetThang = tranThang !== null && daDung.thangNay >= tranThang;

  return {
    daDungHomNay: daDung.homNay,
    daDungThangNay: daDung.thangNay,
    tranNgay,
    tranThang,
    conLaiHomNay,
    conLaiThangNay,
    vuotTran: hetNgay || hetThang,
    tranDangChan: hetNgay ? "ngay" : hetThang ? "thang" : null,
  };
}

/**
 * Quyền dùng một chức năng.
 *
 * Chỉ đúng một chức năng bị chặn khi hết lượt hoặc hết hạn thuê bao: xử lý
 * trang ảnh mới. Mọi thứ còn lại — luyện tập, xem lịch sử, đọc bản tin cũ —
 * không bao giờ bị chặn (BR-09, BR-19).
 */
export type ChucNang =
  | "xu-ly-trang-anh"
  | "luyen-tap"
  | "xem-lich-su"
  | "xem-ban-tin"
  | "xuat-du-lieu";

export interface KetQuaQuyen {
  duocPhep: boolean;
  lyDo?: string;
}

export function kiemTraQuyen(
  chucNang: ChucNang,
  ctx: { goi: MaGoi; hetHan: boolean; daDung: MucDaDung },
): KetQuaQuyen {
  if (chucNang !== "xu-ly-trang-anh") {
    // BR-09: nhốt dữ liệu của con là cách nhanh nhất bị gỡ sản phẩm.
    return { duocPhep: true };
  }
  if (ctx.hetHan && ctx.goi !== "vo-nhap") {
    return {
      duocPhep: false,
      lyDo: "Thuê bao đã hết hạn nên tính năng chụp tạm dừng. Toàn bộ lịch sử học của con vẫn xem được bình thường.",
    };
  }
  const tran = tinhTran(ctx.goi, ctx.daDung);
  if (tran.tranDangChan === "ngay") {
    return {
      duocPhep: false,
      lyDo: `Hôm nay hộ mình đã dùng hết ${tran.tranNgay} lượt chụp. Sáng mai có lại ${tran.tranNgay} lượt mới. Phần luyện tập của con và toàn bộ lịch sử vẫn dùng bình thường.`,
    };
  }
  if (tran.tranDangChan === "thang") {
    return {
      duocPhep: false,
      lyDo: `Tháng này hộ mình đã dùng hết ${tran.tranThang} trang chụp. Phần luyện tập và toàn bộ lịch sử vẫn dùng bình thường.`,
    };
  }
  return { duocPhep: true };
}

/** Thước đo BR-22: chi phí trung bình mỗi hộ mỗi tháng. */
export function chiPhiTrungBinhMoiHo(luot: LuotDung[], soHo: number): number {
  if (soHo === 0) return 0;
  return luot.reduce((s, l) => s + l.chiPhiUocTinh, 0) / soHo;
}
