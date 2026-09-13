import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sinhBai } from "@/lib/domain/generator";
import { cham } from "@/lib/domain/marking";
import { guiChoTre, timRoRiDapAn } from "@/lib/domain/present";
import { TEMPLATES } from "@/lib/domain/templates";

/**
 * BR-03 và NT-10 — không có đường dẫn nào từ bề mặt của trẻ tới lời giải đầy đủ.
 *
 * Đây là bài kiểm thử được viết kỹ nhất trong cả kho mã, vì BR-03 là yêu cầu dễ
 * bị phá vỡ nhất mà không ai nhận ra: chỉ cần một câu gợi ý viết vội, một trường
 * thừa trong gói JSON, hoặc một dòng nhập khẩu mới trong thư mục của trẻ.
 */
const HAT = Array.from({ length: 400 }, (_, i) => i * 104729 + 17);

function cacSoTrongCau(s: string): number[] {
  return (s.match(/\d+/g) ?? []).map(Number);
}

describe("bề mặt của trẻ không bao giờ lộ đáp án", () => {
  it("không bậc gợi ý nào chứa đáp án của chính bài đang làm", () => {
    for (const t of TEMPLATES) {
      for (const hat of HAT) {
        const bai = sinhBai(t.id, hat);
        for (const h of bai.hints) {
          expect(
            cacSoTrongCau(h.text),
            `${t.id}@${hat} bậc ${h.level}: "${h.text}" chứa đáp án ${bai.answer}`,
          ).not.toContain(bai.answer);
          if (h.speech) {
            expect(cacSoTrongCau(h.speech)).not.toContain(bai.answer);
          }
        }
      }
    }
  });

  it("gói gửi cho trẻ không có trường đáp án, kể cả khi đã mở hết thang gợi ý", () => {
    for (const t of TEMPLATES) {
      for (const hat of HAT.slice(0, 80)) {
        const bai = sinhBai(t.id, hat);
        const goi = guiChoTre(bai, bai.hints.length);
        expect(timRoRiDapAn(goi, bai.answer)).toEqual([]);
        expect(JSON.stringify(goi)).not.toContain('"answer"');
        expect(JSON.stringify(goi)).not.toContain('"traps"');
      }
    }
  });

  it("chỉ trả về đúng số bậc gợi ý đã mở, không gửi kèm bậc chưa mở", () => {
    const bai = sinhBai(TEMPLATES[0].id, 12345);
    expect(guiChoTre(bai, 0).goiYDaMo).toHaveLength(0);
    expect(guiChoTre(bai, 2).goiYDaMo).toHaveLength(2);
    expect(guiChoTre(bai, 99).goiYDaMo).toHaveLength(bai.hints.length);
  });

  it("câu chữa khi trẻ sai không nói ra đáp án, dù trẻ sai bao nhiêu lần", () => {
    for (const t of TEMPLATES) {
      for (const hat of HAT.slice(0, 120)) {
        const bai = sinhBai(t.id, hat);
        for (const sai of [bai.answer + 1, bai.answer - 1, 0, 999, ...bai.traps.map((x) => x.wrongAnswer)]) {
          if (sai === bai.answer) continue;
          const kq = cham(bai, sai);
          expect(kq.correct).toBe(false);
          expect(
            cacSoTrongCau(kq.phanHoi),
            `${t.id}@${hat}: câu chữa lộ đáp án ${bai.answer}`,
          ).not.toContain(bai.answer);
        }
      }
    }
  });
});

/**
 * Canh ranh giới ở mức tệp nguồn. Bài kiểm thử trên canh dữ liệu chạy qua; bài
 * dưới đây canh việc ai đó nhập khẩu nhầm mô-đun vào thư mục của trẻ — thứ mà
 * kiểm thử dữ liệu không thấy được cho tới khi đã lên bản dựng.
 */
function tatCaTep(thuMuc: string): string[] {
  const ra: string[] = [];
  for (const ten of readdirSync(thuMuc)) {
    const d = join(thuMuc, ten);
    if (statSync(d).isDirectory()) ra.push(...tatCaTep(d));
    else if (/\.tsx?$/.test(ten)) ra.push(d);
  }
  return ra;
}

describe("tách bạch hai bề mặt ở mức mã nguồn (NT-10)", () => {
  const tepCuaTre = tatCaTep("src/app/be");

  it("thư mục của trẻ có tệp để kiểm", () => {
    expect(tepCuaTre.length).toBeGreaterThan(0);
  });

  it("không tệp nào trong bề mặt trẻ nhập khẩu mô-đun lời giảng", () => {
    for (const tep of tepCuaTre) {
      const noiDung = readFileSync(tep, "utf-8");
      expect(noiDung, `${tep} nhập khẩu teaching`).not.toMatch(/from\s+["'][^"']*domain\/teaching/);
      expect(noiDung, `${tep} nhập khẩu column-marking`).not.toMatch(/from\s+["'][^"']*column-marking/);
    }
  });

  it("bề mặt trẻ không nhập khẩu kho khuôn dạng, để đáp án không lọt vào gói tải về", () => {
    for (const tep of tepCuaTre) {
      const noiDung = readFileSync(tep, "utf-8");
      expect(noiDung, `${tep} nhập khẩu templates`).not.toMatch(/from\s+["'][^"']*domain\/templates/);
      expect(noiDung, `${tep} nhập khẩu generator`).not.toMatch(/from\s+["'][^"']*domain\/generator/);
      expect(noiDung, `${tep} nhập khẩu marking`).not.toMatch(/from\s+["'][^"']*domain\/marking/);
    }
  });

  it("bề mặt trẻ không liên kết thẳng tới trang chụp hay trang lịch sử của phụ huynh", () => {
    for (const tep of tepCuaTre) {
      const noiDung = readFileSync(tep, "utf-8");
      expect(noiDung, `${tep} dẫn thẳng vào trang con của phụ huynh`)
        .not.toMatch(/["']\/phu-huynh\/[a-z-]+/);
    }
  });
});
