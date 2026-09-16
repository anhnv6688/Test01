import type { MaGoi } from "@/lib/domain/pricing";

/**
 * Giao diện cổng thanh toán.
 *
 * Tách ra vì cùng ba lý do với phần ảnh và phần tin nhắn (RR-08): không phụ
 * thuộc một nhà cung cấp về giá và điều khoản, bản giả lập phải chạy trọn vẹn
 * mà không gọi ra mạng, và phần nghiệp vụ không được biết tên nhà cung cấp nào.
 *
 * Trường laGiaLap ở đây quan trọng hơn hẳn so với hai phần kia. Một lần "thanh
 * toán" giả lập KHÔNG có đồng tiền nào đổi chủ; ghi nó vào hồ sơ như một giao
 * dịch thật là dựng một hóa đơn không có thật. Với thanh toán thì đó không chỉ
 * là ghi sai — đó là chứng từ sai.
 */
export type KetQuaThanhToan =
  | { ok: true; maGiaoDich: string; soTien: number; laGiaLap: boolean }
  | { ok: false; lyDo: string; laGiaLap: boolean };

export interface YeuCauThanhToan {
  householdId: string;
  goi: MaGoi;
  soTien: number;
  /** Người trả có đồng ý cho trừ tiền định kỳ những kỳ sau không (CR-13). */
  chapNhanTuDongGiaHan: boolean;
}

export interface NhaCungCapThanhToan {
  ten: string;
  /** Có thật sự chuyển tiền hay không. Xem ghi chú ở đầu tệp. */
  laGiaLap: boolean;
  /** Tạo một lần thu tiền. */
  thu(yc: YeuCauThanhToan): Promise<KetQuaThanhToan>;
  /**
   * Dừng việc trừ tiền định kỳ ở phía cổng thanh toán.
   *
   * Tách khỏi việc hủy thuê bao trong cơ sở dữ liệu của Ô Ly, vì hai việc đó có
   * thể lệch nhau: hủy ở Ô Ly mà quên dừng ở cổng thì hộ vẫn bị trừ tiền, và đó
   * là kiểu lỗi người dùng chỉ phát hiện khi đã mất tiền.
   */
  dungTruTienDinhKy(householdId: string): Promise<{ ok: boolean; lyDo?: string }>;
}
