import { beforeEach, describe, expect, it, vi } from "vitest";
process.env.OLY_DB = ":memory:";

const kho = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (t: string) => (kho.has(t) ? { value: kho.get(t)! } : undefined),
    set: (t: string, v: string) => void kho.set(t, v),
    delete: (t: string) => void kho.delete(t),
  }),
}));

const { moCong } = await import("@/lib/server/cong-phu-huynh");
const { hoDauTien } = await import("@/lib/server/repo");
const { xoaDem } = await import("@/lib/server/gioi-han-pin");
const { moiDuLieu } = await import("@/lib/server/seed");

// Bản phát triển có sẵn hộ mẫu với PIN 1234; dựng ra một lần cho cả tệp.
moiDuLieu();

describe("cổng phụ huynh thật, đi qua bộ giới hạn", () => {
  beforeEach(() => { kho.clear(); xoaDem(hoDauTien()!.id); });

  it("sai ba lần thì lần thứ tư bị chặn, và MÃ ĐÚNG cũng không vào được", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await moCong("0000")).loi).toMatch(/chưa đúng/);
    }
    const chan = await moCong("0000");
    expect(chan.loi).toMatch(/chờ/);

    // Đây mới là điều đáng giá: đang trong lúc chờ thì mã ĐÚNG cũng bị chặn.
    // Nếu mã đúng vẫn lọt qua thì bộ giới hạn chỉ làm phiền người gõ nhầm chứ
    // không làm chậm người dò mã lấy một giây.
    const pin = hoDauTien()!.pin;
    const dung = await moCong(pin);
    expect(dung.ok).toBe(false);
    expect(dung.loi).toMatch(/chờ/);
  });

  it("chờ xong thì mã đúng mở được, và bộ đếm xóa sạch", async () => {
    for (let i = 0; i < 3; i++) await moCong("0000");
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 3000);
    const pin = hoDauTien()!.pin;
    expect((await moCong(pin)).ok).toBe(true);
    vi.useRealTimers();
    // Vào được rồi thì không còn nợ cũ: sai một lần nữa vẫn được thử tiếp ngay.
    expect((await moCong("0000")).loi).toMatch(/chưa đúng/);
    expect((await moCong("0000")).loi).toMatch(/chưa đúng/);
  });
});
