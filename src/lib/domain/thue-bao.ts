import type { MaGoi } from "./pricing";

/**
 * Vòng đời thuê bao (CR-12, CR-13).
 *
 * Phần dễ nhất của thanh toán là nhận tiền. Phần khó, và phần quyết định sản
 * phẩm này tử tế hay không, là những gì xảy ra SAU đó: lúc gia hạn, lúc hủy,
 * lúc hết hạn. Đó là chỗ phần lớn sản phẩm cài bẫy, và cũng là chỗ luật bảo vệ
 * người tiêu dùng nhìn vào.
 *
 * Bốn điều dưới đây là ràng buộc của chính sản phẩm, không phải tùy chọn. Mỗi
 * điều có bài kiểm thử canh; nếu có lúc nào chúng vướng một yêu cầu kinh doanh
 * mới thì đó là lúc phải bàn lại với chủ đầu tư, không phải lúc sửa hàm cho vừa.
 *
 *   1. HỦY PHẢI DỄ NHƯ MUA. Bấm được thì hủy được, ngay trong ứng dụng, không
 *      bắt gọi điện, không bắt gửi thư, không hỏi lý do như một cửa ải.
 *   2. GIA HẠN TỰ ĐỘNG PHẢI BÁO TRƯỚC, đủ sớm để người ta kịp hủy.
 *   3. HẾT HẠN KHÔNG KHÓA LỊCH SỬ HỌC CỦA CON. Dữ liệu học là của gia đình,
 *      không phải con tin để đòi gia hạn.
 *   4. KHÔNG TỰ TRỪ TIỀN SAU KHI DÙNG THỬ nếu chưa báo và chưa được đồng ý
 *      riêng cho việc trừ tiền định kỳ.
 */

export type TrangThaiThueBao =
  | "mien-phi"
  | "dung-thu"
  | "dang-chay"
  | "sap-het-han"
  | "het-han"
  | "da-huy-cho-het-chu-ky";

/** Báo trước bấy nhiêu ngày thì mới được tự động trừ tiền gia hạn. */
export const SO_NGAY_BAO_TRUOC_GIA_HAN = 7;

/** Sau khi hết hạn, dữ liệu học vẫn xem được vô thời hạn. Xem điều 3 ở trên. */
export const KHOA_LICH_SU_KHI_HET_HAN = false;

export interface ThueBao {
  goi: MaGoi;
  /** null với gói miễn phí. */
  hetHanAt: Date | null;
  /** Người dùng đã bật trừ tiền định kỳ chưa. Mặc định TẮT (điều 4). */
  tuDongGiaHan: boolean;
  /** Đã bấm hủy chưa. Hủy rồi thì vẫn dùng hết chu kỳ đã trả tiền. */
  daBamHuy: boolean;
  /** Đang trong kỳ dùng thử không mất tiền. */
  dangDungThu: boolean;
}

export function soNgayConLai(tb: ThueBao, moc = new Date()): number | null {
  if (!tb.hetHanAt) return null;
  return Math.ceil((tb.hetHanAt.getTime() - moc.getTime()) / 86_400_000);
}

export function trangThai(tb: ThueBao, moc = new Date()): TrangThaiThueBao {
  if (tb.goi === "vo-nhap") return "mien-phi";
  const conLai = soNgayConLai(tb, moc);
  if (conLai === null || conLai <= 0) return "het-han";
  if (tb.daBamHuy) return "da-huy-cho-het-chu-ky";
  if (tb.dangDungThu) return "dung-thu";
  if (conLai <= SO_NGAY_BAO_TRUOC_GIA_HAN) return "sap-het-han";
  return "dang-chay";
}

/* ------------------------------------------------------------------ */
/* Bốn ràng buộc, viết thành hàm để kiểm thử được                      */
/* ------------------------------------------------------------------ */

/**
 * Được phép trừ tiền gia hạn lúc này không.
 *
 * Trả về lý do TỪ CHỐI, hoặc null nghĩa là được phép. Viết theo hướng "nêu lý
 * do từ chối" chứ không phải trả về true/false, vì khi từ chối thì người vận
 * hành cần biết vì sao — và vì một hàm trả về true/false rất dễ bị đọc ngược.
 */
export type LyDoKhongDuocTruTien =
  | "chua-bat-tu-dong-gia-han"
  | "chua-bao-truoc-du-som"
  | "da-bam-huy"
  | "chua-toi-han";

export const GIAI_THICH_KHONG_TRU_TIEN: Record<LyDoKhongDuocTruTien, string> = {
  "chua-bat-tu-dong-gia-han":
    "Hộ này chưa bật trừ tiền định kỳ. Gia hạn phải do chính họ bấm.",
  "chua-bao-truoc-du-som": `Chưa gửi thông báo trước ${SO_NGAY_BAO_TRUOC_GIA_HAN} ngày, nên chưa được trừ tiền.`,
  "da-bam-huy": "Hộ này đã bấm hủy, nên không gia hạn nữa.",
  "chua-toi-han": "Chưa tới ngày hết hạn.",
};

export interface DauVaoGiaHan {
  thueBao: ThueBao;
  /** Lần gửi thông báo sắp gia hạn gần nhất. null nghĩa là chưa gửi lần nào. */
  daBaoTruocLuc: Date | null;
}

export function duocTruTienGiaHan(
  dv: DauVaoGiaHan,
  moc = new Date(),
): LyDoKhongDuocTruTien | null {
  const { thueBao: tb } = dv;
  if (tb.daBamHuy) return "da-bam-huy";
  if (!tb.tuDongGiaHan) return "chua-bat-tu-dong-gia-han";
  const conLai = soNgayConLai(tb, moc);
  if (conLai === null || conLai > 0) return "chua-toi-han";
  if (!dv.daBaoTruocLuc) return "chua-bao-truoc-du-som";

  /*
   * Thông báo phải gửi TRƯỚC ngày hết hạn ít nhất bảy ngày.
   *
   * Gửi thư báo "ngày mai trừ tiền" rồi trừ thật thì về mặt chữ nghĩa là đã
   * báo trước, nhưng nó không cho người ta cơ hội thật để hủy — mà cơ hội thật
   * mới là điều luật bảo vệ người tiêu dùng nhắm tới.
   */
  const hanBao = new Date(tb.hetHanAt!.getTime() - SO_NGAY_BAO_TRUOC_GIA_HAN * 86_400_000);
  return dv.daBaoTruocLuc <= hanBao ? null : "chua-bao-truoc-du-som";
}

/**
 * Hủy thuê bao.
 *
 * Hủy KHÔNG cắt dịch vụ ngay: hộ đã trả tiền cho tới hết chu kỳ thì dùng hết
 * chu kỳ. Cắt ngay lúc bấm hủy là lấy tiền rồi không giao hàng, và nó còn tạo
 * ra một áp lực ngầm khiến người ta ngại bấm hủy — đúng thứ điều 1 muốn tránh.
 */
export function huy(tb: ThueBao): ThueBao {
  return { ...tb, daBamHuy: true, tuDongGiaHan: false };
}

/** Bật lại sau khi đã hủy, khi chu kỳ chưa kết thúc. */
export function huyViecHuy(tb: ThueBao): ThueBao {
  return { ...tb, daBamHuy: false };
}

/**
 * Những gì hộ vẫn làm được sau khi thuê bao hết hạn.
 *
 * Danh sách này là điều 3 viết thành mã. Chỉ đúng một thứ dừng lại, và nó dừng
 * vì nó tốn tiền thật mỗi lần dùng — xem kiemTraQuyen trong domain/metering.ts.
 */
export interface ConDungDuocGi {
  luyenTapCuaCon: boolean;
  lichSuHocCuaCon: boolean;
  banTinToi: boolean;
  xuatDuLieu: boolean;
  xuLyTrangAnh: boolean;
}

export function conDungDuocGi(tt: TrangThaiThueBao): ConDungDuocGi {
  const conHan = tt !== "het-han";
  return {
    // Bốn thứ này KHÔNG BAO GIỜ bị khóa, kể cả khi hết hạn: chúng không tốn
    // thêm đồng nào mỗi lần dùng, và dữ liệu học là của gia đình.
    luyenTapCuaCon: true,
    lichSuHocCuaCon: true,
    banTinToi: true,
    xuatDuLieu: true,
    // Thứ duy nhất dừng lại khi hết hạn.
    xuLyTrangAnh: conHan,
  };
}
