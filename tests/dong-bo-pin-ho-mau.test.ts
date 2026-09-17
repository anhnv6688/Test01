import { beforeEach, describe, expect, it } from "vitest";

/*
 * Chạy ở chế độ PHÁT HÀNH, vì đó mới là hoàn cảnh có thật của lỗi này.
 *
 * Ở bản phát triển `pinHoMau()` trả cứng "1234" và không đọc OLY_PIN_MAU lấy
 * một lần — nên một bài kiểm thử chạy ở chế độ phát triển sẽ xanh mà không
 * chứng minh được gì về chuyện đang cần chứng minh.
 */
(process.env as Record<string, string>).NODE_ENV = "production";
process.env.OLY_DB = ":memory:";
process.env.OLY_DU_LIEU_MAU = "true";
process.env.OLY_PIN_MAU = "1111";

const { getDb } = await import("@/lib/server/db");
const { moiDuLieu } = await import("@/lib/server/seed");

const d = getDb();
const pinCuaHo = (id: string) =>
  (d.prepare("SELECT pin FROM households WHERE id = ?").get(id) as { pin: string }).pin;

beforeEach(() => {
  d.exec("DELETE FROM households");
  process.env.OLY_DU_LIEU_MAU = "true";
  process.env.OLY_PIN_MAU = "1111";
});

describe("mã PIN hộ mẫu đi theo khai báo, không chỉ lúc tạo", () => {
  it("đổi khai báo rồi khởi động lại thì hộ mẫu nhận mã mới", () => {
    /**
     * Đây là lỗi đã xảy ra thật trên máy chủ.
     *
     * moiDuLieu() thoát sớm khi đã có hộ, nên mã PIN chỉ có tác dụng ĐÚNG MỘT
     * LẦN — lúc dòng dữ liệu được tạo. Người vận hành đổi khai báo, triển khai
     * lại, thấy máy chủ báo "đã lấy theo khai báo" và nhật ký xanh sạch — mà mã
     * mới vẫn không mở được gì. Cấu hình đổi, cơ sở dữ liệu không.
     */
    const { householdId } = moiDuLieu();
    expect(householdId).not.toBeNull();
    expect(pinCuaHo(householdId!)).toBe("1111");

    process.env.OLY_PIN_MAU = "4321";
    moiDuLieu();
    expect(pinCuaHo(householdId!)).toBe("4321");
  });

  it("KHÔNG đụng vào hộ nào khi chưa bật dữ liệu mẫu", () => {
    // Bản phát hành phục vụ gia đình thật: mã PIN là của họ, và không dòng mã
    // nào ở đây được phép đổi nó.
    const { householdId } = moiDuLieu();
    delete (process.env as Record<string, string | undefined>).OLY_DU_LIEU_MAU;
    process.env.OLY_PIN_MAU = "4321";
    moiDuLieu();
    expect(pinCuaHo(householdId!)).toBe("1111");
  });

  it("có từ hai hộ trở lên mà chưa hộ nào được đánh dấu thì KHÔNG đoán", () => {
    /**
     * Nền cũ chưa có cờ `la_ho_mau`. Đánh dấu hộ duy nhất đang có thì chắc
     * chắn đúng — chừng nào còn đúng một hộ trên một máy đã bật dữ liệu mẫu thì
     * hộ ấy do seed dựng ra. Từ hai hộ trở lên thì không đoán nữa: đoán sai ở
     * đây là đổi mã PIN của một gia đình.
     */
    const { householdId } = moiDuLieu();
    d.exec("UPDATE households SET la_ho_mau = 0");
    d.prepare(
      "INSERT INTO households (id, ten, dia_ban, goi, het_han_at, pin, created_at) VALUES (?,?,?,?,?,?,?)",
    ).run("ho-hai", "Hộ khác", "do-thi", "vo-nhap", null, "9999", new Date().toISOString());

    process.env.OLY_PIN_MAU = "4321";
    moiDuLieu();
    expect(pinCuaHo(householdId!)).toBe("1111");
    expect(pinCuaHo("ho-hai")).toBe("9999");
  });

  it("đã đánh dấu rồi thì chỉ hộ mẫu đổi, hộ kia giữ nguyên", () => {
    const { householdId } = moiDuLieu();
    d.prepare(
      "INSERT INTO households (id, ten, dia_ban, goi, het_han_at, pin, created_at) VALUES (?,?,?,?,?,?,?)",
    ).run("ho-that", "Hộ thật", "do-thi", "vo-nhap", null, "9999", new Date().toISOString());

    process.env.OLY_PIN_MAU = "4321";
    moiDuLieu();
    expect(pinCuaHo(householdId!)).toBe("4321");
    expect(pinCuaHo("ho-that")).toBe("9999");
  });

  it("khai báo không hợp lệ thì giữ nguyên mã cũ, không xóa mất lối vào", () => {
    // Khai sai mà xóa mã đang dùng là khóa luôn người vận hành ra ngoài.
    const { householdId } = moiDuLieu();
    process.env.OLY_PIN_MAU = "khong-phai-so";
    moiDuLieu();
    expect(pinCuaHo(householdId!)).toBe("1111");
  });
});
