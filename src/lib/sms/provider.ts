/**
 * Giao diện nhà cung cấp tin nhắn.
 *
 * Tách ra vì hai lẽ, giống hệt lý do của nhà cung cấp xử lý ảnh (RR-08): không
 * phụ thuộc một nhà mạng duy nhất về giá và điều khoản, và bản giả lập phải
 * chạy trọn vẹn được mà không gọi ra mạng.
 *
 * Trường laGiaLap là phần quan trọng nhất của giao diện này, và nó không phải
 * chi tiết kỹ thuật — nó là một yêu cầu về tính trung thực. Xem ghi chú ở
 * src/lib/sms/gia-lap.ts.
 */
export interface KetQuaGuiSms {
  ok: boolean;
  /** Lý do để ghi nhật ký vận hành, không hiện cho người dùng. */
  loi?: string;
}

export interface NhaCungCapSms {
  ten: string;
  /**
   * Bản này có thật sự gửi tin nhắn ra ngoài hay không.
   *
   * Bản giả lập KHÔNG chứng minh được người bấm đang giữ số máy đó, vì mã hiện
   * ngay trên màn hình. Phần ghi nhận mức xác minh phải đọc trường này và ghi
   * đúng thứ đã thật sự xảy ra.
   */
  laGiaLap: boolean;
  gui(soDaChuan: string, noiDung: string): Promise<KetQuaGuiSms>;
}

/** Nội dung tin nhắn. Ngắn, và nói rõ đừng đọc mã cho ai. */
export function soanTinNhan(ma: string, hanPhut: number): string {
  return (
    `Ô Ly: ma xac minh cua anh chi la ${ma}, dung trong ${hanPhut} phut. ` +
    `O Ly khong bao gio goi dien hoi ma nay. Neu khong phai anh chi yeu cau, bo qua tin nhan.`
  );
}
