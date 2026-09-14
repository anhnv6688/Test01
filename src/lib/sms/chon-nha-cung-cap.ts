import { NhaCungCapSmsGiaLap } from "./gia-lap";
import type { NhaCungCapSms } from "./provider";

/**
 * Chọn nhà cung cấp tin nhắn.
 *
 * Mặc định là bản giả lập. Muốn gửi tin nhắn thật thì phải cắm một bản cài đặt
 * thật vào đây — chưa có, vì việc đó cần hợp đồng với nhà mạng hoặc một cổng
 * tin nhắn, tức là việc ngoài mã nguồn.
 *
 * Cố ý KHÔNG viết sẵn một bản gọi thẳng vào một cổng cụ thể rồi để đó: một bản
 * cài đặt chưa ai chạy thật thì không biết nó có chạy hay không, mà sự có mặt
 * của nó lại làm người đọc tưởng phần này đã xong.
 */
let nhaCungCap: NhaCungCapSms | null = null;

export function layNhaCungCapSms(): NhaCungCapSms {
  if (!nhaCungCap) nhaCungCap = new NhaCungCapSmsGiaLap();
  return nhaCungCap;
}

/** Dùng khi kiểm thử, hoặc khi cắm nhà cung cấp thật (RR-08). */
export function datNhaCungCapSms(n: NhaCungCapSms): void {
  nhaCungCap = n;
}
