import { describe, expect, it } from "vitest";
import { chamCotDoc } from "@/lib/domain/column-marking";
import { sinhBai } from "@/lib/domain/generator";
import { cham } from "@/lib/domain/marking";
import { TEMPLATES } from "@/lib/domain/templates";

/**
 * BR-04, BR-28, BR-29 — chẩn đoán, không chỉ chấm đúng sai.
 *
 * "Báo đúng sai là việc mọi ứng dụng đều làm được. Giải thích nguyên nhân là
 * giá trị khác biệt duy nhất của sản phẩm này."
 */
describe("nhận diện bẫy khi trẻ làm bài", () => {
  it("viết đúng con số của bẫy thì nhận ra đúng bẫy đó", () => {
    let soLanKiem = 0;
    for (const t of TEMPLATES) {
      for (let hat = 1; hat <= 300; hat++) {
        const bai = sinhBai(t.id, hat * 31);
        for (const b of bai.traps) {
          const kq = cham(bai, b.wrongAnswer);
          expect(kq.correct).toBe(false);
          expect(kq.trap?.id, `${t.id}: không nhận ra bẫy ${b.id}`).toBe(b.id);
          soLanKiem += 1;
        }
      }
    }
    expect(soLanKiem).toBeGreaterThan(100);
  });

  it("sai một kiểu không nằm trong ngân hàng bẫy thì không chẩn đoán bừa", () => {
    const bai = sinhBai("KD-001", 99991);
    const laSo = bai.answer + 37;
    const kq = cham(bai, laSo);
    expect(kq.trap).toBeNull();
    expect(kq.phanHoi).toContain("đọc lại đề");
  });

  it("làm đúng thì nói rõ đúng ở chỗ nào, không khen suông (BR-29)", () => {
    for (const t of TEMPLATES) {
      const bai = sinhBai(t.id, 4242);
      const kq = cham(bai, bai.answer);
      expect(kq.correct).toBe(true);
      expect(kq.phanHoi.length).toBeGreaterThan(30);
      expect(kq.phanHoi).not.toBe("Đúng rồi!");
    }
  });
});

describe("chấm phép tính cột dọc, chỉ ra bước sai (BR-28)", () => {
  it("quên nhớ khi cộng thì chỉ đúng cột chục và gọi đúng tên lỗi", () => {
    // 47 + 28 = 75. Trẻ quên nhớ nên viết 65.
    const kq = chamCotDoc(47, 28, "+", [5, 6]);
    expect(kq.dung).toBe(false);
    expect(kq.buocSaiDauTien).toBe(1);
    expect(kq.buoc[0].dung).toBe(true);
    expect(kq.trapId).toBe("BAY-QUEN-NHO");
    expect(kq.choPhuHuynh).toContain("số nhớ");
  });

  it("ngại mượn nên lấy số lớn trừ số bé thì bắt đúng từ cột đơn vị", () => {
    // 52 − 27 = 25. Trẻ viết 35: cột đơn vị lấy 7 − 2 = 5, cột chục 5 − 2 = 3.
    const kq = chamCotDoc(52, 27, "-", [5, 3]);
    expect(kq.dung).toBe(false);
    expect(kq.buocSaiDauTien).toBe(1);
    expect(kq.trapId).toBe("BAY-QUEN-NHO");
    expect(kq.choPhuHuynh).toContain("mượn");
  });

  it("làm đúng thì khen đúng chỗ khó, không khen chung chung (BR-29)", () => {
    const kq = chamCotDoc(47, 28, "+", [5, 7]);
    expect(kq.dung).toBe(true);
    expect(kq.buocSaiDauTien).toBeNull();
    expect(kq.choPhuHuynh).toContain("nhớ");
  });

  it("ô bỏ trống được nêu rõ chứ không coi như viết số không", () => {
    const kq = chamCotDoc(47, 28, "+", [5, null]);
    expect(kq.dung).toBe(false);
    expect(kq.buoc[1].giaiThich).toContain("bỏ trống");
  });

  it("tính lại đúng kết quả cho mọi phép cộng trừ trong phạm vi 100", () => {
    for (let a = 10; a <= 99; a += 7) {
      for (let b = 1; b <= a; b += 5) {
        const cong = chamCotDoc(a, b, "+", String(a + b).split("").reverse().map(Number));
        expect(cong.ketQuaDung).toBe(a + b);
        expect(cong.dung).toBe(true);
        const tru = chamCotDoc(a, b, "-", String(a - b).split("").reverse().map(Number));
        expect(tru.ketQuaDung).toBe(a - b);
      }
    }
  });
});
