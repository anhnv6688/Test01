import { describe, expect, it } from "vitest";
import { TU_NGU_CAM, lapBanTinToi, viPhamNT07 } from "@/lib/domain/digest";
import { TRAPS } from "@/lib/domain/traps";
import { soanLoiGiang } from "@/lib/domain/teaching";
import { sinhBai } from "@/lib/domain/generator";
import { TEMPLATES } from "@/lib/domain/templates";
import type { Attempt } from "@/lib/domain/types";

function lan(p: Partial<Attempt>): Attempt {
  return {
    itemId: "KD-006:1", templateId: "KD-006", yccd: "T2.DL.01",
    given: 0, correct: false, trapId: null, hintsUsed: 0, attemptNo: 1,
    elapsedMs: 1000, at: "2026-09-13T12:00:00.000Z", ...p,
  };
}

describe("bản tin tối (BR-08)", () => {
  it("không có phiên nào thì không gửi bản tin, thay vì gửi bản tin rỗng", () => {
    expect(lapBanTinToi("con-1", [])).toBeNull();
  });

  it("gợi ý đúng MỘT câu để hỏi con, không phải một danh sách", () => {
    const bt = lapBanTinToi("con-1", [lan({ trapId: "BAY-DON-VI" })]);
    expect(typeof bt?.cauHoiChoBo).toBe("string");
    expect(bt?.cauHoiChoBo.split("?").filter((x) => x.trim()).length).toBe(1);
  });

  it("câu hỏi bám đúng cái bẫy con mắc nhiều nhất trong phiên", () => {
    const ds = [
      lan({ itemId: "x1", trapId: "BAY-DON-VI" }),
      lan({ itemId: "x2", trapId: "BAY-DON-VI" }),
      lan({ itemId: "x3", trapId: "BAY-KHOANG-CACH" }),
    ];
    const bt = lapBanTinToi("con-1", ds);
    const bayDonVi = TRAPS.find((t) => t.id === "BAY-DON-VI");
    expect(bt?.cauHoiChoBo).toBe(bayDonVi?.parentQuestion);
  });

  it("không có bẫy nào thì vẫn có một câu mở chuyện, không bỏ trống", () => {
    const bt = lapBanTinToi("con-1", [lan({ correct: true })]);
    expect(bt?.cauHoiChoBo.length).toBeGreaterThan(10);
  });

  it("nói được cả phần nỗ lực chứ không chỉ phần sai", () => {
    const ds = [
      lan({ itemId: "y", correct: false, attemptNo: 1 }),
      lan({ itemId: "y", correct: true, attemptNo: 2 }),
    ];
    expect(lapBanTinToi("con-1", ds)?.noLuc).toContain("tự sửa");
  });
});

describe("không có nhận định chẩn đoán tâm lý hoặc y tế (NT-07)", () => {
  it("bộ dò từ ngữ cấm hoạt động đúng", () => {
    expect(viPhamNT07("Con có dấu hiệu tăng động")).toContain("tăng động");
    expect(viPhamNT07("Con hôm nay làm 8 bài")).toEqual([]);
  });

  it("mọi câu chữ của ngân hàng bẫy đều sạch", () => {
    for (const t of TRAPS) {
      expect(viPhamNT07(t.parentNote), t.id).toEqual([]);
      expect(viPhamNT07(t.parentQuestion), t.id).toEqual([]);
      expect(viPhamNT07(t.childFix), t.id).toEqual([]);
    }
  });

  it("mọi bản tin tối sinh ra từ mọi bẫy đều sạch", () => {
    for (const t of TRAPS) {
      const bt = lapBanTinToi("con-1", [lan({ trapId: t.id })]);
      const toanBo = [bt?.cauHoiChoBo, bt?.noLuc, ...(bt?.saiODau ?? []), ...(bt?.hocGi ?? [])].join(" ");
      expect(viPhamNT07(toanBo), t.id).toEqual([]);
    }
  });

  it("mọi lời giảng cho phụ huynh đều sạch", () => {
    for (const tpl of TEMPLATES) {
      for (const muc of ["nhac-lai", "giang-tu-dau"] as const) {
        const lg = soanLoiGiang(sinhBai(tpl.id, 777), muc);
        const toanBo = [
          lg.neuVanChuaHieu, ...lg.choHaySai,
          ...lg.buoc.flatMap((b) => [b.tieuDe, b.lamGi, b.hoiCon]),
        ].join(" ");
        expect(viPhamNT07(toanBo), `${tpl.id}/${muc}`).toEqual([]);
      }
    }
  });

  it("danh sách từ ngữ cấm không bị bỏ trống", () => {
    expect(TU_NGU_CAM.length).toBeGreaterThan(5);
  });
});

describe("lời giảng cho phụ huynh (BR-26, BR-27, BR-33)", () => {
  it("có đủ hai mức chi tiết, và mức đầy đủ dài hơn mức rút gọn", () => {
    const bai = sinhBai("KD-008", 5150);
    const ngan = soanLoiGiang(bai, "nhac-lai");
    const day = soanLoiGiang(bai, "giang-tu-dau");
    expect(day.buoc.length).toBeGreaterThan(ngan.buoc.length);
  });

  it("mức đầy đủ luôn kèm câu để hỏi con, không chỉ liệt kê các bước tính", () => {
    for (const tpl of TEMPLATES) {
      const lg = soanLoiGiang(sinhBai(tpl.id, 31337), "giang-tu-dau");
      for (const b of lg.buoc) {
        expect(b.hoiCon.length, `${tpl.id}: bước "${b.tieuDe}" thiếu câu hỏi con`).toBeGreaterThan(10);
      }
    }
  });

  it("luôn nêu chỗ trẻ hay hiểu sai ở dạng bài đó", () => {
    for (const tpl of TEMPLATES) {
      const lg = soanLoiGiang(sinhBai(tpl.id, 2468), "giang-tu-dau");
      expect(lg.choHaySai.length, tpl.id).toBeGreaterThan(0);
    }
  });

  it("gắn bài về đúng yêu cầu cần đạt của chương trình", () => {
    const lg = soanLoiGiang(sinhBai("KD-006", 13), "giang-tu-dau");
    expect(lg.yeuCauCanDat).toContain("đơn vị đo độ dài");
  });
});
