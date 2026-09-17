import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
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

describe("dải báo bản thử đã gỡ hẳn", () => {
  /**
   * Chủ đầu tư chốt bỏ hẳn ngày 17/9/2026 — xem VM-09 ở
   * docs/truy-vet-yeu-cau.md, nơi ghi cả hệ quả.
   *
   * Bài kiểm này canh việc gỡ cho SẠCH, không canh việc gỡ cho đúng: một thành
   * phần còn sót lại trong kho mã mà không trang nào gắn là mã chết, và mã chết
   * thì lần sau có người tưởng nó đang chạy.
   *
   * Nó KHÔNG thay được thứ vừa mất. Lời dặn "đừng chụp bài thật của con" nay chỉ
   * còn là một bước dặn người, chép ở docs/vps-contabo.md — không bài kiểm thử
   * nào canh được một câu nhắn trong nhóm chat.
   */
  it("không còn thành phần dải báo trong kho mã", () => {
    expect(existsSync("src/components/DaiBaoBanThu.tsx")).toBe(false);
  });

  it("không trang nào còn gắn nó", () => {
    for (const t of ["src/app/layout.tsx", "src/app/page.tsx", "src/app/phu-huynh/layout.tsx"]) {
      expect(doc(t), t).not.toMatch(/DaiBaoBanThu/);
    }
  });

  it("bộ soi môi trường không còn đòi dải báo", () => {
    // Bỏ thành phần mà quên bỏ phần canh thì mọi lần triển khai bản thử đỏ ở một
    // điều không còn tồn tại.
    expect(doc("scripts/kiem-moi-truong.mts")).not.toMatch(/kiemDaiBaoBanThu|BẢN THỬ/);
  });
});
