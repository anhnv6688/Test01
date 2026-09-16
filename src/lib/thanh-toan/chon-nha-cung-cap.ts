import { NhaCungCapThanhToanGiaLap } from "./gia-lap";
import type { NhaCungCapThanhToan } from "./provider";

/**
 * Chọn cổng thanh toán.
 *
 * Chưa có bản cài đặt thật. Các cổng phổ biến ở Việt Nam — VNPay, MoMo,
 * ZaloPay — đều cần hợp đồng và tài khoản người bán, tức là việc ngoài mã
 * nguồn; và chúng còn cần pháp nhân đã đăng ký, thứ mà CR-01 xếp là việc tổ
 * chức chứ không phải hạng mục phần mềm.
 *
 * Cố ý KHÔNG viết sẵn một bản gọi thẳng vào một cổng cụ thể rồi để đó, vì cùng
 * lý do đã ghi ở phần tin nhắn: bản cài đặt chưa ai chạy thật thì không ai biết
 * nó có chạy hay không, mà sự có mặt của nó lại làm người đọc tưởng phần này đã
 * xong. Với thanh toán thì hiểu nhầm đó tốn tiền của người khác.
 */
let nhaCungCap: NhaCungCapThanhToan | null = null;

export function layNhaCungCapThanhToan(): NhaCungCapThanhToan {
  if (!nhaCungCap) nhaCungCap = new NhaCungCapThanhToanGiaLap();
  return nhaCungCap;
}

/** Dùng khi kiểm thử, hoặc khi cắm cổng thật (RR-08). */
export function datNhaCungCapThanhToan(n: NhaCungCapThanhToan): void {
  nhaCungCap = n;
}
