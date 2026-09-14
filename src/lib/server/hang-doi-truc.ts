import { tinhTrangHan, thongKeTuanThu, xepTheoMucKhan, type TinhTrangHan } from "@/lib/domain/han-xu-ly";
import {
  moiYeuCauDuLieu, nhatKyGoBo, nhatKyCuaYeuCau,
  type YeuCauDuLieu, type YeuCauGoBo,
} from "./requests";

/**
 * Hai hàng đợi của người trực, đã xếp theo mức khẩn.
 *
 * Gộp chung vào một mô-đun vì chúng phải được nhìn CÙNG NHAU: hai loại yêu cầu
 * có hạn khác nhau rất xa, và người trực cần biết cái nào phải làm trước, chứ
 * không phải hai danh sách riêng mà tự đối chiếu trong đầu.
 */
export interface MucHangDoi {
  id: string;
  loai: "du-lieu" | "go-bo";
  tomTat: string;
  chiTiet: string | null;
  nhanLuc: string;
  hanChot: string;
  /** Hạn phản hồi đã tiếp nhận, chỉ có ở yêu cầu dữ liệu (BR-39). */
  hanTiepNhan: string | null;
  trangThai: string;
  daXong: boolean;
  tinhTrang: TinhTrangHan;
  soDongNhatKy: number;
  /**
   * Đã xử lý đúng hạn hay chưa, ĐỌC TỪ NHẬT KÝ chứ không suy ra từ thời điểm
   * hiện tại. Nhật ký chốt con số này ngay lúc người trực bấm nút; suy ra về
   * sau chỉ là phỏng đoán từ dữ liệu còn lại, không phải bằng chứng.
   */
  dungHanTheoNhatKy: boolean | null;
}

const TEN_LOAI_DU_LIEU: Record<string, string> = {
  xem: "Xem dữ liệu đang giữ",
  "chinh-sua": "Sửa thông tin chưa đúng",
  "xuat-du-lieu": "Xuất dữ liệu ra tệp",
  "rut-dong-y": "Rút lại sự đồng ý",
  xoa: "Xóa dữ liệu",
};

/** Kết luận đúng hạn của lần xử lý cuối cùng, theo nhật ký. */
function dungHanCuoiCung(maYeuCau: string): { so: number; dungHan: boolean | null } {
  const nk = nhatKyCuaYeuCau(maYeuCau);
  return { so: nk.length, dungHan: nk.length === 0 ? null : nk[nk.length - 1].dungHan };
}

function tuYeuCauDuLieu(y: YeuCauDuLieu, bayGio: number): MucHangDoi {
  const daXong = y.trangThai === "hoan-thanh";
  const nk = dungHanCuoiCung(y.id);
  return {
    id: y.id,
    loai: "du-lieu",
    tomTat: TEN_LOAI_DU_LIEU[y.loai] ?? y.loai,
    chiTiet: y.noiDung,
    nhanLuc: y.nhanLuc,
    hanChot: y.hanHoanThanh,
    hanTiepNhan: y.hanTiepNhan,
    trangThai: y.trangThai,
    daXong,
    tinhTrang: tinhTrangHan(y.nhanLuc, y.hanHoanThanh, daXong, bayGio),
    soDongNhatKy: nk.so,
    dungHanTheoNhatKy: daXong ? nk.dungHan : null,
  };
}

function tuYeuCauGoBo(y: YeuCauGoBo, bayGio: number): MucHangDoi {
  const daXong = y.trangThai === "da-go" || y.trangThai === "tu-choi";
  const nk = dungHanCuoiCung(y.id);
  return {
    id: y.id,
    loai: "go-bo",
    tomTat: `Gỡ bỏ: ${y.doiTuong}`,
    chiTiet: `${y.lyDo}\n\nNgười gửi: ${y.nguoiGui} — ${y.lienHe}`,
    nhanLuc: y.nhanLuc,
    hanChot: y.hanXuLy,
    hanTiepNhan: null,
    trangThai: y.trangThai,
    daXong,
    tinhTrang: tinhTrangHan(y.nhanLuc, y.hanXuLy, daXong, bayGio),
    soDongNhatKy: nk.so,
    dungHanTheoNhatKy: daXong ? nk.dungHan : null,
  };
}

export function hangDoiTruc(bayGio = Date.now()): MucHangDoi[] {
  const ds = [
    ...moiYeuCauDuLieu().map((y) => tuYeuCauDuLieu(y, bayGio)),
    ...nhatKyGoBo(500).map((y) => tuYeuCauGoBo(y, bayGio)),
  ];
  return xepTheoMucKhan(ds, (x) => x.tinhTrang);
}

export function thongKeTruc(ds: MucHangDoi[]) {
  return thongKeTuanThu(
    ds.map((x) => ({
      daXong: x.daXong,
      // Một mục đã xong mà không có dòng nhật ký nào thì KHÔNG được tính là
      // đúng hạn — không chứng minh được thì coi như không đạt. Đây là chỗ dễ
      // nới tay nhất, và nới ra thì bảng thống kê mất hết giá trị làm bằng
      // chứng khi bị kiểm tra (BO-05).
      dungHan: x.daXong ? x.dungHanTheoNhatKy === true : null,
      tinhTrang: x.tinhTrang,
    })),
  );
}
