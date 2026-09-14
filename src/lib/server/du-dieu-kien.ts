import { dangBat, treDaDongY, type MucDich } from "@/lib/privacy/consent";
import { kiemTraDuDieuKien, type KetQuaDuDieuKien } from "@/lib/privacy/nguoi-giam-ho";
import { lichSuDongY, nguoiGiamHoHienTai, type Con } from "./repo";

/**
 * Một chỗ duy nhất trả lời: Ô Ly có được xử lý dữ liệu của bạn này, cho mục
 * đích này, VÀO LÚC NÀY hay không.
 *
 * Có hai nơi cần câu trả lời — trang chụp (để báo trước cho phụ huynh) và
 * chính tuyến xử lý ảnh (để chặn thật). Nếu hai nơi tự tính lấy thì sớm muộn
 * chúng lệch nhau, và cái lệch nguy hiểm là lệch theo hướng giao diện nói được
 * phép trong khi thực ra không. Vì vậy cả hai đi qua đúng hàm này.
 *
 * Tham số moc để kiểm thử được cảnh sinh nhật: một hộ đang đủ điều kiện hôm nay
 * có thể thiếu điều kiện vào hôm con tròn bảy tuổi.
 */
export function dieuKienXuLy(
  householdId: string,
  con: Con,
  mucDich: MucDich,
  moc = new Date(),
): KetQuaDuDieuKien {
  const dongY = lichSuDongY(householdId);
  return kiemTraDuDieuKien(
    {
      nguoiGiamHo: nguoiGiamHoHienTai(householdId),
      thangNamSinh: con.thangNamSinh,
      dongYNguoiGiamHo: dangBat(dongY, mucDich),
      dongYCuaTre: treDaDongY(dongY, mucDich, con.id),
    },
    moc,
  );
}
