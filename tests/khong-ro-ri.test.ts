import { describe, expect, it } from "vitest";
import { soat } from "../scripts/khong-ro-ri";

/**
 * Canh bộ canh.
 *
 * Một bộ canh luôn báo "sạch" thì không phân biệt được với một bộ canh hỏng,
 * nên phải chứng minh nó bắt được thứ nó sinh ra để bắt.
 */
describe("chặn tệp không được nằm trong kho mã", () => {
  const chan = (p: string) => soat([p]).length > 0;

  it("chặn ảnh trang vở ở bất kỳ đâu ngoài thư mục tài nguyên", () => {
    expect(chan("bo-anh-do/01-cot-doc.png")).toBe(true);
    expect(chan("anh/bai-cua-bong.JPG")).toBe(true);
    expect(chan("docs/tam-thoi/trang-vo.heic")).toBe(true);
    expect(chan("src/app/anh.jpeg")).toBe(true);
  });

  it("vẫn cho ảnh giao diện của chính sản phẩm đi qua", () => {
    expect(chan("public/bieu-tuong.svg")).toBe(false);
    expect(chan("public/man-hinh.png")).toBe(false);
    expect(chan("docs/hinh/so-do.png")).toBe(false);
  });

  it("chặn cơ sở dữ liệu cục bộ, kể cả tệp đi kèm", () => {
    expect(chan(".data/oly.sqlite")).toBe(true);
    expect(chan("oly.sqlite-wal")).toBe(true);
    expect(chan("ban-sao.sqlite-shm")).toBe(true);
  });

  it("chặn tệp môi trường thật, nhưng cho tệp mẫu đi qua", () => {
    expect(chan(".env")).toBe(true);
    expect(chan(".env.local")).toBe(true);
    expect(chan(".env.example")).toBe(false);
  });

  it("chặn cả tệp nhãn và báo cáo thô của bộ đo", () => {
    expect(chan("bo-anh-do/nhan.json")).toBe(true);
    expect(chan("ket-qua.bao-cao.json")).toBe(true);
  });

  it("chặn tệp nhãn ở bất kỳ đâu, không chỉ trong thư mục ảnh", () => {
    // Trang gắn nhãn ghi ra thư mục do OLY_THU_MUC_ANH chỉ định. Trỏ nhầm vào
    // ngay gốc kho mã là chuyện xảy ra được, và luật theo thư mục không bắt.
    expect(chan("nhan.json")).toBe(true);
    expect(chan("lo-thang-9/nhan.json")).toBe(true);
    expect(chan("nhan.json.truoc")).toBe(true);
    expect(chan("bo-anh-do/nhan.json.dang-ghi")).toBe(true);
  });

  it("không đụng tới mã nguồn bình thường", () => {
    for (const p of [
      "src/lib/domain/templates.ts",
      "docs/bo-do-anh.md",
      "docs/nhan-mau.json",
      "package.json",
      "README.md",
    ]) {
      expect(chan(p), p).toBe(false);
    }
  });

  it("mỗi luật phải nói được vì sao nó tồn tại", () => {
    for (const l of soat(["bo-anh-do/x.png", ".data/oly.sqlite", ".env"])) {
      expect(l.luat.viSao.length, l.luat.ten).toBeGreaterThan(40);
    }
  });
});
