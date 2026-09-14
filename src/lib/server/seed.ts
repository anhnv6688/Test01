import { randomUUID } from "node:crypto";
import { getDb } from "./db";

/**
 * Dữ liệu mồi cho môi trường phát triển.
 *
 * BR-14: sản phẩm phải dùng được ngay ở lần mở đầu tiên, không phụ thuộc vào
 * việc người dùng đóng góp nội dung. Nghiên cứu thị trường không xác nhận được
 * giả thuyết phụ huynh chủ động tìm và tải đề lên, nên hộ mới mở ứng dụng ra là
 * đã có bài đúng lớp, đúng chương để làm ngay.
 *
 * Lưu ý: mã PIN ở đây để nguyên dạng chữ chỉ vì đây là bản dựng trình diễn cục
 * bộ. Trước khi mở cho người dùng thật, phần này phải thay bằng băm có muối.
 */
export function moiDuLieu(): { householdId: string } {
  const d = getDb();
  const co = d.prepare("SELECT COUNT(*) AS n FROM households").get() as { n: number };
  if (co.n > 0) {
    const r = d.prepare("SELECT id FROM households LIMIT 1").get() as { id: string };
    return { householdId: r.id };
  }

  const hoId = randomUUID();
  const now = new Date().toISOString();
  d.prepare(
    "INSERT INTO households (id, ten, dia_ban, goi, het_han_at, pin, created_at) VALUES (?,?,?,?,?,?,?)",
  ).run(hoId, "Hộ nhà mình", "do-thi", "vo-nhap", null, "1234", now);

  /*
   * Hai bạn cố ý nằm hai bên mốc 7 tuổi (CR-05).
   *
   * Bống tám tuổi nên cần CẢ sự đồng ý của chính em lẫn của người giám hộ; Cu
   * Tí sáu tuổi thì chỉ cần người giám hộ. Đặt tuổi theo thời điểm chạy chứ
   * không gắn năm cứng, để bản trình diễn còn thể hiện được hai chế độ đó về
   * sau, thay vì cả hai bạn cùng già đi rồi rơi vào một chế độ.
   *
   * Bản ghi người giám hộ thì CỐ Ý để trống: hộ mới thì chưa ai xác minh, và
   * luồng chụp ảnh phải bị chặn cho tới khi có người xác nhận thật.
   */
  const namNay = new Date().getUTCFullYear();
  const thangNay = new Date().getUTCMonth() + 1;
  const themCon = d.prepare(
    "INSERT INTO children (id, household_id, ten_goi, lop, nam_sinh, thang_sinh, created_at) VALUES (?,?,?,?,?,?,?)",
  );
  themCon.run(randomUUID(), hoId, "Bống", 2, namNay - 8, thangNay, now);
  themCon.run(randomUUID(), hoId, "Cu Tí", 1, namNay - 6, thangNay, now);

  return { householdId: hoId };
}
