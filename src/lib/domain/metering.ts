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
  daDung: number;
  tran: number | null;
  conLai: number | null;
  vuotTran: boolean;
}

export function tinhTran(goi: MaGoi, daDungThangNay: number): TinhTrangTran {
  const tran = GOI[goi].tranTrangThang;
  if (tran === null) {
    return { daDung: daDungThangNay, tran: null, conLai: null, vuotTran: false };
  }
  return {
    daDung: daDungThangNay,
    tran,
    conLai: Math.max(0, tran - daDungThangNay),
    vuotTran: daDungThangNay >= tran,
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
  ctx: { goi: MaGoi; hetHan: boolean; daDungThangNay: number },
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
  const tran = tinhTran(ctx.goi, ctx.daDungThangNay);
  if (tran.vuotTran) {
    return {
      duocPhep: false,
      lyDo: `Tháng này hộ mình đã dùng hết ${tran.tran} trang chụp. Phần luyện tập và toàn bộ lịch sử vẫn dùng bình thường.`,
    };
  }
  return { duocPhep: true };
}

/** Thước đo BR-22: chi phí trung bình mỗi hộ mỗi tháng. */
export function chiPhiTrungBinhMoiHo(luot: LuotDung[], soHo: number): number {
  if (soHo === 0) return 0;
  return luot.reduce((s, l) => s + l.chiPhiUocTinh, 0) / soHo;
}
