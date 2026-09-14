/**
 * Chuẩn hóa và kiểm số điện thoại di động Việt Nam.
 *
 * Vì sao phải chuẩn hóa TRƯỚC khi băm và trước khi đếm: cùng một thuê bao viết
 * được ít nhất bốn kiểu — 0912345678, +84912345678, 84912345678, và bản có dấu
 * cách hay dấu chấm. Nếu băm thẳng chuỗi người dùng gõ thì mỗi kiểu ra một vân
 * tay khác nhau, và toàn bộ phần chặn gửi dồn bị vô hiệu chỉ bằng cách gõ lại
 * số theo kiểu khác. Chuẩn hóa là điều kiện để việc đếm có ý nghĩa.
 */

/** Đầu số di động đang dùng tại Việt Nam sau lần chuyển đổi năm 2018. */
const DAU_SO = /^0[35789]\d{8}$/;

export class SoDienThoaiKhongHopLeError extends Error {
  constructor(chiTiet: string) {
    super(`Số điện thoại không hợp lệ: ${chiTiet}`);
    this.name = "SoDienThoaiKhongHopLeError";
  }
}

/**
 * Đưa về dạng chuẩn 10 số bắt đầu bằng 0.
 *
 * Chọn dạng nội địa chứ không phải dạng +84 vì đó là dạng người Việt đọc và
 * nhớ; khi hiện lại hai số cuối cho phụ huynh nhận ra số của mình thì dạng này
 * quen mắt hơn.
 */
export function chuanHoaSo(tho: string): string {
  const chiSo = tho.replace(/[\s.\-()]/g, "");
  let s = chiSo;
  if (s.startsWith("+84")) s = `0${s.slice(3)}`;
  else if (s.startsWith("84") && s.length === 11) s = `0${s.slice(2)}`;

  if (!/^\d+$/.test(s)) throw new SoDienThoaiKhongHopLeError("có ký tự không phải chữ số");
  if (!DAU_SO.test(s)) {
    throw new SoDienThoaiKhongHopLeError(
      "phải là số di động Việt Nam gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09",
    );
  }
  return s;
}

/** Hai số cuối, để phụ huynh nhận ra số của mình mà Ô Ly không giữ cả số. */
export function haiSoCuoi(soDaChuan: string): string {
  return soDaChuan.slice(-2);
}

/** Dạng che để hiện lên màn hình: 09•• ••• •78. */
export function cheSo(haiCuoi: string): string {
  return `0••• ••• •${haiCuoi}`;
}
