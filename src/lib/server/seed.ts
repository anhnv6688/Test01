import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { choPhepDuLieuMau, pinHoMau } from "./moi-truong";

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
/**
 * Giữ mã PIN của hộ MẪU khớp với khai báo, ở mỗi lần khởi động.
 *
 * Vì sao cần: `moiDuLieu()` thoát sớm khi đã có hộ, nên trước đây mã PIN chỉ có
 * tác dụng ĐÚNG MỘT LẦN — lúc dòng dữ liệu được tạo ra. Người vận hành đổi
 * OLY_PIN_MAU rồi triển khai lại sẽ thấy máy chủ báo "đã lấy theo khai báo",
 * nhật ký xanh sạch, mà mã mới vẫn không mở được gì: cấu hình đổi, cơ sở dữ
 * liệu không. Đã xảy ra thật, và nó tốn của người vận hành một buổi chiều.
 *
 * Chỉ chạm vào hộ có cờ `la_ho_mau`, và chỉ khi `choPhepDuLieuMau()` bật. Hộ
 * mẫu là CẤU HÌNH chứ không phải dữ liệu của người dùng: nó do máy dựng ra để
 * bấm thử, nên mã của nó phải theo khai báo. Hộ của một gia đình thật thì
 * ngược lại — mã PIN là của họ, và không dòng mã nào ở đây được phép đổi nó.
 *
 * Nền cũ chưa có cờ thì đánh dấu hộ duy nhất đang có. "Duy nhất" là điều kiện
 * chặt có chủ ý: chừng nào còn đúng một hộ trên một máy đã bật dữ liệu mẫu thì
 * hộ ấy chắc chắn do seed dựng ra. Có từ hai hộ trở lên thì không đoán nữa —
 * đoán sai ở đây là đổi mã PIN của một gia đình.
 */
function dongBoPinHoMau(d: ReturnType<typeof getDb>): void {
  if (!choPhepDuLieuMau()) return;
  const pin = pinHoMau();
  if (!pin) return;

  const daDanh = d.prepare("SELECT COUNT(*) AS n FROM households WHERE la_ho_mau = 1").get() as { n: number };
  if (daDanh.n === 0) {
    const tong = d.prepare("SELECT COUNT(*) AS n FROM households").get() as { n: number };
    if (tong.n !== 1) return;
    d.prepare("UPDATE households SET la_ho_mau = 1").run();
  }

  const doi = d.prepare("UPDATE households SET pin = ? WHERE la_ho_mau = 1 AND pin <> ?").run(pin, pin);
  // Nói ra là ĐÃ ĐỔI, không in mã. Người vận hành cần biết việc này xảy ra;
  // nhật ký Actions thì ai đọc được kho là đọc được.
  if (doi.changes > 0) console.warn("[Ô Ly] Đã cập nhật mã PIN hộ mẫu theo OLY_PIN_MAU.");
}

export function moiDuLieu(): { householdId: string | null } {
  const d = getDb();
  const co = d.prepare("SELECT COUNT(*) AS n FROM households").get() as { n: number };
  if (co.n > 0) {
    dongBoPinHoMau(d);
    const r = d.prepare("SELECT id FROM households LIMIT 1").get() as { id: string };
    return { householdId: r.id };
  }

  /*
   * Ở bản phát hành, KHÔNG tự dựng hộ mẫu trừ khi được khai báo rõ.
   *
   * Hộ mẫu có mã PIN biết trước, nên trên một địa chỉ công khai nó là một tài
   * khoản không chủ mà ai cũng mở được. Bản trình diễn muốn có nó thì bật
   * OLY_DU_LIEU_MAU và tự đặt OLY_PIN_MAU — hai việc có chủ ý, không phải mặc
   * định lặng lẽ. Xem src/lib/server/moi-truong.ts.
   */
  if (!choPhepDuLieuMau()) return { householdId: null };
  const pin = pinHoMau();
  if (!pin) {
    console.warn(
      "[Ô Ly] Đã bật OLY_DU_LIEU_MAU nhưng chưa đặt OLY_PIN_MAU hợp lệ, nên không dựng hộ mẫu.",
    );
    return { householdId: null };
  }

  const hoId = randomUUID();
  const now = new Date().toISOString();
  d.prepare(
    "INSERT INTO households (id, ten, dia_ban, goi, het_han_at, pin, created_at) VALUES (?,?,?,?,?,?,?)",
  ).run(hoId, "Hộ nhà mình", "do-thi", "vo-nhap", null, pin, now);
  d.prepare("UPDATE households SET la_ho_mau = 1 WHERE id = ?").run(hoId);

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
