import { randomUUID } from "node:crypto";
import type { KetQuaThanhToan, NhaCungCapThanhToan, YeuCauThanhToan } from "./provider";

/**
 * Bản giả lập: không có đồng nào đổi chủ.
 *
 * Nó tồn tại để chạy hết luồng mua, gia hạn và hủy mà không cần tài khoản người
 * bán. Nhưng mọi bản ghi sinh ra từ đây phải mang dấu laGiaLap, và trang gói
 * cước phải nói thẳng ra — vì một hóa đơn trông như thật cho một khoản tiền
 * chưa từng chuyển là chứng từ sai, chứ không phải chi tiết kỹ thuật.
 */
export class NhaCungCapThanhToanGiaLap implements NhaCungCapThanhToan {
  ten = "giả lập (không có tiền thật)";
  laGiaLap = true;

  daThu: YeuCauThanhToan[] = [];
  daDung: string[] = [];

  async thu(yc: YeuCauThanhToan): Promise<KetQuaThanhToan> {
    this.daThu.push(yc);
    console.warn(
      `[Ô Ly] Bản giả lập thanh toán — KHÔNG có tiền thật. Hộ ${yc.householdId}, ` +
        `gói ${yc.goi}, ${yc.soTien.toLocaleString("vi-VN")} đ.`,
    );
    return { ok: true, maGiaoDich: `gia-lap-${randomUUID()}`, soTien: yc.soTien, laGiaLap: true };
  }

  async dungTruTienDinhKy(householdId: string): Promise<{ ok: boolean }> {
    this.daDung.push(householdId);
    return { ok: true };
  }
}
