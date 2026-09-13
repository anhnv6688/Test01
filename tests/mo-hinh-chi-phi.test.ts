import { describe, expect, it } from "vitest";
import {
  BAC_CAO, BAC_CHUAN, GIA_DINH_BRD, MODEL, THAM_SO_MAC_DINH,
  bienDongGop, chiPhiMotTrang, diemHoaVon, laiLoThang,
  soHoMienPhiMoiHoTraPhi, tokenAnh, tranTrangHoMienPhi, tranTrangHoTraPhiLo,
} from "@/lib/domain/mo-hinh-chi-phi";
import { TRAN_MIEN_PHI_TRANG_NGAY, TRAN_HOA_VON_TRANG_HO_MIEN_PHI } from "@/lib/domain/pricing";

describe("số token của một tấm ảnh", () => {
  it("khớp với ví dụ trong tài liệu của nhà cung cấp", () => {
    // Tài liệu nêu: ảnh 1000×1000 tốn 1296 token, ảnh 1092×1092 tốn 1521.
    expect(tokenAnh(1000, 1000, BAC_CAO)).toBe(1296);
    expect(tokenAnh(1092, 1092, BAC_CAO)).toBe(1521);
    expect(tokenAnh(200, 200, BAC_CAO)).toBe(64);
  });

  it("ảnh vượt giới hạn bị thu nhỏ, nên chi phí có trần", () => {
    expect(tokenAnh(8000, 8000, BAC_CAO)).toBe(BAC_CAO.tokenToiDa);
    expect(tokenAnh(8000, 8000, BAC_CHUAN)).toBe(BAC_CHUAN.tokenToiDa);
  });

  it("bậc phân giải cao tốn nhiều token hơn hẳn cho cùng một tấm ảnh", () => {
    const { anhRong, anhCao } = THAM_SO_MAC_DINH;
    expect(tokenAnh(anhRong, anhCao, BAC_CAO)).toBeGreaterThan(
      tokenAnh(anhRong, anhCao, BAC_CHUAN),
    );
  });
});

describe("chi phí một trang", () => {
  it("xếp hạng giá đúng thứ tự giữa ba mô hình", () => {
    const opus = chiPhiMotTrang("opus-5");
    const sonnet = chiPhiMotTrang("sonnet-5");
    const haiku = chiPhiMotTrang("haiku-4-5");
    expect(opus).toBeGreaterThan(sonnet);
    expect(sonnet).toBeGreaterThan(haiku);
  });

  it("token suy nghĩ là biến nhạy nhất, nên phải là tham số", () => {
    const it2 = chiPhiMotTrang("opus-5", { ...THAM_SO_MAC_DINH, tokenSuyNghi: 400 });
    const nhieu = chiPhiMotTrang("opus-5", { ...THAM_SO_MAC_DINH, tokenSuyNghi: 2500 });
    expect(nhieu).toBeGreaterThan(it2 * 1.8);
  });

  it("mô hình lạ thì ném lỗi, không im lặng trả về số không", () => {
    expect(() => chiPhiMotTrang("mo-hinh-khong-co")).toThrow();
  });
});

describe("biên đóng góp và điểm hòa vốn", () => {
  it("mỗi hộ trả phí gánh 11,5 hộ miễn phí ở tỷ lệ chuyển đổi 8%", () => {
    expect(soHoMienPhiMoiHoTraPhi()).toBeCloseTo(11.5);
  });

  it("dựng lại đúng con số của BRD: 800đ một trang, hòa vốn khoảng 500 hộ", () => {
    // Mục 9.1 BRD, dòng "phiên bản 1.0": 8 trang trả phí, 2 trang miễn phí,
    // biên 36.200đ, hòa vốn khoảng 500 hộ.
    const gd = { ...GIA_DINH_BRD, trangMoiHoTraPhi: 8 };
    expect(Math.round(bienDongGop(800, 2, gd))).toBe(36_200);
    expect(diemHoaVon(800, 2, gd)).toBeLessThan(510);
    expect(diemHoaVon(800, 2, gd)).toBeGreaterThan(490);
  });

  it("biên âm thì không quy mô nào hòa vốn, và hàm nói thẳng bằng null", () => {
    expect(bienDongGop(1664, 6)).toBeLessThan(0);
    expect(diemHoaVon(1664, 6)).toBeNull();
    expect(laiLoThang(1664, 6, 100_000).soThangHoanVonNoiDung).toBeNull();
  });

  it("chi phí càng cao thì điểm hòa vốn càng lùi xa", () => {
    const re = diemHoaVon(309, 2);
    const dat = diemHoaVon(1664, 2);
    expect(re).not.toBeNull();
    // Ở 1.664đ một trang, ngay cả 2 trang miễn phí cũng đã làm biên âm.
    expect(dat).toBeNull();
  });
});

describe("hai ngưỡng gãy cần theo dõi (BR-22)", () => {
  it("ở giá Opus, hộ TRẢ PHÍ dùng hết trần 60 trang là đã lỗ", () => {
    const tran = tranTrangHoTraPhiLo(chiPhiMotTrang("opus-5"));
    expect(tran).toBeLessThan(60);
  });

  it("ở giá Sonnet và Haiku, hộ trả phí dùng hết trần 60 trang vẫn có lãi", () => {
    expect(tranTrangHoTraPhiLo(chiPhiMotTrang("sonnet-5"))).toBeGreaterThan(60);
    expect(tranTrangHoTraPhiLo(chiPhiMotTrang("haiku-4-5"))).toBeGreaterThan(60);
  });

  it("hằng số cảnh báo trong pricing.ts khớp với mô hình ở giả định 800đ", () => {
    expect(Math.round(tranTrangHoMienPhi(800))).toBe(TRAN_HOA_VON_TRANG_HO_MIEN_PHI);
  });

  it("trần 2 lượt mỗi ngày cho phép dùng gấp nhiều lần ngưỡng an toàn", () => {
    const toiDaThang = TRAN_MIEN_PHI_TRANG_NGAY * 30;
    for (const ma of Object.keys(MODEL)) {
      expect(toiDaThang, ma).toBeGreaterThan(tranTrangHoMienPhi(chiPhiMotTrang(ma)));
    }
  });
});
