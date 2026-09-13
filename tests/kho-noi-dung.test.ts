import { describe, expect, it } from "vitest";
import { YCCD_BY_CODE } from "@/lib/domain/curriculum";
import {
  ChuaDuyetError, doclaiBai, khuonDangDaDuyet, kiemTraDuyet, sinhBai,
} from "@/lib/domain/generator";
import { TEMPLATES } from "@/lib/domain/templates";
import { TRAP_BY_ID } from "@/lib/domain/traps";
import type { Template } from "@/lib/domain/types";

const HAT = Array.from({ length: 120 }, (_, i) => i * 7919 + 13);

describe("kho khuôn dạng", () => {
  it("mọi khuôn dạng đều trỏ về một yêu cầu cần đạt có thật (BR-16)", () => {
    for (const t of TEMPLATES) {
      expect(YCCD_BY_CODE.has(t.yccd), `${t.id} trỏ tới ${t.yccd}`).toBe(true);
    }
  });

  it("mọi khuôn dạng phát hành đều có bản ghi người duyệt đúng phiên bản (BR-15, CR-08)", () => {
    for (const t of TEMPLATES) {
      expect(() => kiemTraDuyet(t)).not.toThrow();
      expect(t.approval?.templateVersion).toBe(t.version);
    }
  });

  it("khuôn dạng chưa duyệt thì không sinh được bài cho trẻ (BR-15)", () => {
    const chuaDuyet: Template = { ...TEMPLATES[0], id: "KD-THU", approval: null };
    expect(() => kiemTraDuyet(chuaDuyet)).toThrow(ChuaDuyetError);
    expect(khuonDangDaDuyet().some((t) => t.id === "KD-THU")).toBe(false);
  });

  it("mỗi khuôn dạng có nguồn gốc truy vết được (BR-13, BR-24)", () => {
    for (const t of TEMPLATES) {
      expect(t.provenance.source === "CTGDPT" || t.provenance.source === "bien-soan-dat-hang").toBe(true);
      expect(t.provenance.reference.length).toBeGreaterThan(10);
      expect(t.approval?.reviewedBy.length).toBeGreaterThan(0);
    }
  });

  it("cùng một hạt luôn cho ra cùng một bài, nên lịch sử dựng lại được (BR-09)", () => {
    for (const t of TEMPLATES) {
      for (const hat of HAT.slice(0, 20)) {
        const a = sinhBai(t.id, hat);
        const b = doclaiBai(a.id);
        expect(b.prompt).toBe(a.prompt);
        expect(b.answer).toBe(a.answer);
      }
    }
  });

  it("thang gợi ý đủ bậc và xếp đúng thứ tự (BR-03)", () => {
    for (const t of TEMPLATES) {
      for (const hat of HAT.slice(0, 30)) {
        const bai = sinhBai(t.id, hat);
        expect(bai.hints.length).toBeGreaterThanOrEqual(3);
        const bac = bai.hints.map((h) => h.level);
        expect(bac).toEqual([...bac].sort((x, y) => x - y));
      }
    }
  });

  it("mọi bẫy gài trong bài đều có trong ngân hàng bẫy và khác đáp án (BR-04)", () => {
    for (const t of TEMPLATES) {
      for (const hat of HAT) {
        const bai = sinhBai(t.id, hat);
        for (const b of bai.traps) {
          expect(TRAP_BY_ID.has(b.id), `${t.id} dùng bẫy lạ ${b.id}`).toBe(true);
          expect(b.wrongAnswer, `${t.id}@${hat}: đáp án sai của bẫy trùng đáp án đúng`)
            .not.toBe(bai.answer);
        }
      }
    }
  });

  it("chỉ dùng tên riêng Việt Nam trong kho tên (BR-07)", () => {
    const tayLa = /\b(Tom|Jerry|John|Anna|Alice|Bob|Peter|Mary|Lucy|Mike)\b/;
    for (const t of TEMPLATES) {
      for (const hat of HAT.slice(0, 40)) {
        expect(tayLa.test(sinhBai(t.id, hat).prompt)).toBe(false);
      }
    }
  });

  it("mỗi bài thuộc mạch số học đều có một biểu diễn trực quan (BR-02)", () => {
    for (const t of TEMPLATES.filter((x) => x.strand === "so-va-phep-tinh")) {
      for (const hat of HAT.slice(0, 20)) {
        expect(sinhBai(t.id, hat).visual.kind).not.toBe("khong-co");
      }
    }
  });
});
