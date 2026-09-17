import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  CHO_KHEN_TOI_DA_MS, CHO_KHEN_TOI_THIEU_MS, choKhenMs,
} from "@/app/be/hoc/cho-khen";

const doc = (t: string) => readFileSync(t, "utf8");

describe("giữ lời khen trước khi sang bài mới", () => {
  it("câu khen dài thì chờ lâu hơn câu ngắn", () => {
    const ngan = choKhenMs("Đúng rồi!");
    const dai = choKhenMs("Đúng rồi! Con đã đổi 1 chục thành 10 đơn vị trước khi trừ.");
    expect(dai).toBeGreaterThan(ngan);
  });

  it("có sàn, để câu hai chữ vẫn kịp nhìn thấy", () => {
    expect(choKhenMs("Giỏi!")).toBe(CHO_KHEN_TOI_THIEU_MS);
    expect(choKhenMs("")).toBe(CHO_KHEN_TOI_THIEU_MS);
  });

  it("có trần, vì im lặng quá lâu thì trẻ tưởng máy treo", () => {
    expect(choKhenMs("x".repeat(5000))).toBe(CHO_KHEN_TOI_DA_MS);
  });

  it("câu khen thật trong ảnh chụp lỗi được chờ hơn hai giây rưỡi", () => {
    // Đúng câu đã đứng nhầm dưới đề bài mới trên điện thoại.
    expect(choKhenMs("Đúng rồi! Con đã nhìn đúng kim ngắn.")).toBeGreaterThan(2_500);
  });
});

describe("màn hình và giọng đọc phải đổi bài cùng lúc", () => {
  /**
   * Bài kiểm thử này quét mã nguồn, không dựng React. Lý do: thứ hỏng không
   * phải một giá trị trả về mà là THỨ TỰ hai lệnh — setBai() chạy ngay trong
   * khi giọng đọc thì chờ. Không có giá trị nào sai để mà bắt; hơn ba trăm bài
   * kiểm thử trong Node đều xanh suốt thời gian lỗi này sống trên máy chủ.
   *
   * `npm run kiem-giao-dien` dựng trình duyệt thật nhưng nó đo bề rộng hình và
   * lối vào màn hình, không ngồi làm hết một bài rồi nhìn xem lời khen có đứng
   * lại dưới đề bài sau hay không.
   *
   * Nên ở đây canh đúng hình dạng của lỗi: setBai() cho bài TIẾP THEO không
   * được nằm ngoài hẹn giờ, và setPhanHoi(null) phải đi cùng nó.
   */
  const ma = doc("src/app/be/hoc/PhienHoc.tsx");

  it("đổi bài và xóa lời khen nằm chung trong một hẹn giờ", () => {
    const i = ma.indexOf("henKhenRef.current = window.setTimeout(");
    expect(i, "phải có hẹn giờ giữ lời khen").toBeGreaterThan(-1);
    const than = ma.slice(i, ma.indexOf("}, choKhenMs(", i));
    expect(than).toMatch(/setPhanHoi\(null\)/);
    expect(than).toMatch(/setBai\(d\.bai\)/);
    expect(than).toMatch(/docBai\(d\.bai\)/);
  });

  it("không còn chỗ nào đổi sang bài mới ngay khi trả lời đúng", () => {
    // Đây là chính dòng đã gây ra lỗi: setBai(d.bai) đứng trần trong nhánh
    // d.correct, ngoài mọi hẹn giờ.
    const i = ma.indexOf("if (d.correct) {");
    const j = ma.indexOf("henKhenRef.current = window.setTimeout(", i);
    expect(ma.slice(i, j)).not.toMatch(/setBai\(d\.bai\)/);
  });

  it("khóa mọi nút trong lúc đang khen", () => {
    // Trẻ bấm tiếp vào đáp án của bài cũ trong lúc chờ thì câu trả lời ấy được
    // chấm cho bài mới — bài mà em chưa nhìn thấy.
    expect(ma).toMatch(/disabled=\{dangGui \|\| dangKhen\}/);
    expect(ma).toMatch(/dangGui=\{dangGui \|\| dangKhen\}/);
    expect(ma).toMatch(/disabled=\{hetThang \|\| dangKhen\}/);
  });

  it("hủy hẹn giờ khi rời màn hình", () => {
    // Trẻ bấm "Dừng ở đây" đúng lúc đang khen thì hẹn giờ vẫn nổ và gọi
    // setState trên một thành phần đã gỡ.
    expect(ma).toMatch(/window\.clearTimeout\(henKhenRef\.current\)/);
  });
});

describe("dải báo bản thử không nằm trên màn hình của trẻ", () => {
  /**
   * Dải báo nói với NGƯỜI LỚN: đừng nhập tên thật, đừng chụp bài thật của con,
   * dữ liệu có thể bị xóa. Không câu nào trong đó dành cho một đứa bảy tuổi
   * đang làm bài — mà trên điện thoại nó chiếm gần một phần ba màn hình và đẩy
   * cả bài học xuống dưới.
   *
   * Nên nó ở trang đầu và trong bề mặt phụ huynh, là chỗ người lớn thật sự đọc,
   * và KHÔNG ở bố cục gốc.
   */
  it("bố cục gốc không gắn dải báo", () => {
    expect(doc("src/app/layout.tsx")).not.toMatch(/DaiBaoBanThu/);
  });

  it("trang đầu và bề mặt phụ huynh vẫn có", () => {
    // Trang đầu là chỗ npm run kiem-moi-truong soi, và là chỗ người test mở ra
    // đầu tiên. Bỏ nốt hai chỗ này là bản thử im lặng đúng như bản thật.
    expect(doc("src/app/page.tsx")).toMatch(/DaiBaoBanThu/);
    expect(doc("src/app/phu-huynh/layout.tsx")).toMatch(/DaiBaoBanThu/);
  });
});
