/**
 * Hạn xử lý yêu cầu của người dùng.
 *
 * BR-39 nói thẳng: đây là RÀNG BUỘC VẬN HÀNH CỨNG, không phải cam kết dịch vụ
 * tự đặt ra. BR-23 và CR-06 đòi nhật ký xử lý đầy đủ và đáp ứng đúng các mốc
 * thời hạn luật định. BO-05 đòi "chứng minh được sự tuân thủ khi bị kiểm tra".
 *
 * Ba câu đó cộng lại có nghĩa là: chỉ nhận yêu cầu thôi thì chưa đủ. Phải có
 * người trực nhìn thấy cái gì sắp quá hạn, phải có nút để họ xử lý, và phải có
 * dấu vết để về sau chứng minh là đã xử lý đúng hạn.
 *
 * Mô-đun này là phần tính toán thuần của việc đó — không chạm cơ sở dữ liệu,
 * không chạm giao diện, nên kiểm thử được bằng đồng hồ giả.
 */

export type MucKhan = "qua-han" | "sap-het-han" | "con-han" | "da-xong";

export interface TinhTrangHan {
  mucKhan: MucKhan;
  /** Mili giây còn lại. Âm nghĩa là đã quá hạn bấy nhiêu. */
  conLaiMs: number;
  /** Câu ngắn cho người trực đọc lướt, ví dụ "còn 3 giờ" hay "QUÁ HẠN 2 giờ". */
  moTa: string;
}

/**
 * Ngưỡng báo động sớm: còn dưới một phần tư thời gian thì coi là sắp hết hạn.
 *
 * Dùng tỷ lệ chứ không dùng số giờ cố định vì các loại yêu cầu có hạn rất khác
 * nhau — yêu cầu gỡ bỏ có 24 giờ, yêu cầu xem dữ liệu có 10 ngày. Một ngưỡng
 * cố định sẽ hoặc báo động suốt với loại này, hoặc báo quá muộn với loại kia.
 */
export const TY_LE_BAO_SOM = 0.25;

export function tinhTrangHan(
  nhanLuc: string,
  hanChot: string,
  daXong: boolean,
  bayGio = Date.now(),
): TinhTrangHan {
  const han = new Date(hanChot).getTime();
  const nhan = new Date(nhanLuc).getTime();
  const conLaiMs = han - bayGio;

  if (daXong) return { mucKhan: "da-xong", conLaiMs, moTa: "đã xong" };
  if (conLaiMs < 0) return { mucKhan: "qua-han", conLaiMs, moTa: `QUÁ HẠN ${doDai(-conLaiMs)}` };

  const tongThoiGian = Math.max(han - nhan, 1);
  const mucKhan: MucKhan = conLaiMs / tongThoiGian <= TY_LE_BAO_SOM ? "sap-het-han" : "con-han";
  return { mucKhan, conLaiMs, moTa: `còn ${doDai(conLaiMs)}` };
}

function doDai(ms: number): string {
  const phut = Math.floor(ms / 60_000);
  if (phut < 60) return `${Math.max(phut, 1)} phút`;
  const gio = Math.floor(phut / 60);
  if (gio < 48) return `${gio} giờ`;
  return `${Math.floor(gio / 24)} ngày`;
}

/**
 * Thứ tự người trực nên xử lý.
 *
 * Quá hạn lên trước, rồi tới sắp hết hạn, rồi còn hạn. Trong cùng một mức thì
 * cái nào hạn sớm hơn lên trước. Việc đã xong xuống cuối.
 *
 * Cố ý KHÔNG xếp theo thời điểm nhận: một yêu cầu gỡ bỏ nhận sau nhưng chỉ có
 * 24 giờ phải được xử lý trước một yêu cầu xem dữ liệu nhận trước nhưng có 10
 * ngày. Xếp theo thứ tự nhận là cách vi phạm hạn mà vẫn thấy mình công bằng.
 */
const THU_TU: Record<MucKhan, number> = {
  "qua-han": 0,
  "sap-het-han": 1,
  "con-han": 2,
  "da-xong": 3,
};

export function xepTheoMucKhan<T>(
  ds: T[],
  lay: (x: T) => TinhTrangHan,
): T[] {
  return ds.slice().sort((a, b) => {
    const ta = lay(a);
    const tb = lay(b);
    const d = THU_TU[ta.mucKhan] - THU_TU[tb.mucKhan];
    return d !== 0 ? d : ta.conLaiMs - tb.conLaiMs;
  });
}

/**
 * Thống kê tuân thủ — thứ đưa ra khi bị kiểm tra (BO-05).
 *
 * Đếm cả phần đã xử lý quá hạn, không giấu đi. Một bảng chỉ khoe phần đúng hạn
 * thì không phải bằng chứng tuân thủ, mà là tài liệu quảng cáo.
 */
export interface ThongKeTuanThu {
  tongSo: number;
  dangCho: number;
  quaHanDangCho: number;
  daXuLy: number;
  daXuLyDungHan: number;
  daXuLyQuaHan: number;
  /** Tỷ lệ xử lý đúng hạn trong số đã xử lý. null khi chưa xử lý cái nào. */
  tyLeDungHan: number | null;
}

export interface MucXuLy {
  daXong: boolean;
  /** Có đúng hạn không, chốt tại thời điểm xử lý. null khi chưa xử lý. */
  dungHan: boolean | null;
  tinhTrang: TinhTrangHan;
}

export function thongKeTuanThu(ds: MucXuLy[]): ThongKeTuanThu {
  const daXuLy = ds.filter((x) => x.daXong);
  const dungHan = daXuLy.filter((x) => x.dungHan === true).length;
  const quaHan = daXuLy.filter((x) => x.dungHan === false).length;
  const dangCho = ds.filter((x) => !x.daXong);
  return {
    tongSo: ds.length,
    dangCho: dangCho.length,
    quaHanDangCho: dangCho.filter((x) => x.tinhTrang.mucKhan === "qua-han").length,
    daXuLy: daXuLy.length,
    daXuLyDungHan: dungHan,
    daXuLyQuaHan: quaHan,
    tyLeDungHan: daXuLy.length === 0 ? null : dungHan / daXuLy.length,
  };
}
