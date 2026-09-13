import { describe, expect, it } from "vitest";
import { PHUT_CUNG, PHUT_MEM, laPhienQuaDai, nhipPhien, yccdDangYeu } from "@/lib/domain/session";
import { demTuSua, tinhPhanThuong, tyLeTuSuaSauGoiY } from "@/lib/domain/rewards";
import type { Attempt } from "@/lib/domain/types";

function lan(p: Partial<Attempt>): Attempt {
  return {
    itemId: "KD-001:1", templateId: "KD-001", yccd: "T2.SPT.02",
    given: 0, correct: false, trapId: null, hintsUsed: 0, attemptNo: 1,
    elapsedMs: 1000, at: "2026-09-13T12:00:00.000Z", ...p,
  };
}

describe("nhịp phiên học (BR-05)", () => {
  const batDau = new Date("2026-09-13T19:00:00Z").toISOString();
  const moc = (phut: number) => new Date("2026-09-13T19:00:00Z").getTime() + phut * 60_000;

  it("trong mười phút đầu thì phiên vẫn đang chạy", () => {
    expect(nhipPhien(batDau, moc(3)).pha).toBe("dang-hoc");
    expect(nhipPhien(batDau, moc(PHUT_MEM - 1)).pha).toBe("dang-hoc");
  });

  it("qua mốc mềm thì báo sắp hết giờ chứ chưa cắt ngang", () => {
    const n = nhipPhien(batDau, moc(PHUT_MEM + 1));
    expect(n.pha).toBe("sap-het-gio");
  });

  it("qua mốc cứng thì dừng hẳn", () => {
    expect(nhipPhien(batDau, moc(PHUT_CUNG)).pha).toBe("het-gio");
    expect(nhipPhien(batDau, moc(30)).pha).toBe("het-gio");
  });

  it("phiên vượt hai mươi lăm phút bị đánh dấu là tín hiệu xấu để theo dõi", () => {
    const ketThucSom = new Date(moc(11)).toISOString();
    const ketThucMuon = new Date(moc(26)).toISOString();
    expect(laPhienQuaDai(batDau, ketThucSom)).toBe(false);
    expect(laPhienQuaDai(batDau, ketThucMuon)).toBe(true);
  });
});

describe("phần thưởng gắn với nỗ lực, không gắn với tỷ lệ đúng (BR-06)", () => {
  it("hai trẻ cùng mức nỗ lực thì được thưởng như nhau, dù tỷ lệ đúng khác nhau", () => {
    const lamDungHet = [
      lan({ itemId: "a", correct: true }),
      lan({ itemId: "b", correct: true }),
      lan({ itemId: "c", correct: true }),
    ];
    const saiHet = [
      lan({ itemId: "a", correct: false }),
      lan({ itemId: "b", correct: false }),
      lan({ itemId: "c", correct: false }),
    ];
    expect(tinhPhanThuong(lamDungHet).hatGiong).toBe(tinhPhanThuong(saiHet).hatGiong);
  });

  it("trẻ sai rồi tự sửa được thưởng nhiều hơn trẻ đúng ngay từ đầu", () => {
    const dungNgay = [lan({ itemId: "a", correct: true })];
    const saiRoiSua = [
      lan({ itemId: "a", correct: false, attemptNo: 1 }),
      lan({ itemId: "a", correct: true, attemptNo: 2, hintsUsed: 2 }),
    ];
    expect(tinhPhanThuong(saiRoiSua).hatGiong).toBeGreaterThan(tinhPhanThuong(dungNgay).hatGiong);
  });

  it("dùng gợi ý rồi làm tiếp được cộng điểm, không bị trừ", () => {
    const khongGoiY = [lan({ itemId: "a", correct: true })];
    const coGoiY = [lan({ itemId: "a", correct: true, hintsUsed: 3 })];
    expect(tinhPhanThuong(coGoiY).hatGiong).toBeGreaterThan(tinhPhanThuong(khongGoiY).hatGiong);
  });

  it("đếm đúng số lần trẻ tự sửa", () => {
    const ds = [
      lan({ itemId: "a", correct: false, attemptNo: 1 }),
      lan({ itemId: "a", correct: true, attemptNo: 2 }),
      lan({ itemId: "b", correct: false, attemptNo: 1 }),
      lan({ itemId: "c", correct: true, attemptNo: 1 }),
    ];
    expect(demTuSua(ds)).toBe(1);
    expect(tyLeTuSuaSauGoiY(ds)).toBeCloseTo(0.5);
  });
});

describe("chọn bài theo chỗ trẻ đang yếu", () => {
  it("mã yêu cầu cần đạt sai nhiều được đánh dấu là đang yếu", () => {
    const ds = [
      lan({ yccd: "T2.DL.01", correct: false }),
      lan({ yccd: "T2.DL.01", correct: false }),
      lan({ yccd: "T2.DL.01", correct: true }),
      lan({ yccd: "T2.SPT.02", correct: true }),
      lan({ yccd: "T2.SPT.02", correct: true }),
    ];
    const yeu = yccdDangYeu(ds);
    expect(yeu).toContain("T2.DL.01");
    expect(yeu).not.toContain("T2.SPT.02");
  });

  it("một hai lần làm chưa đủ để kết luận trẻ yếu chỗ nào", () => {
    expect(yccdDangYeu([lan({ yccd: "T2.HH.01", correct: false })])).toEqual([]);
  });
});
