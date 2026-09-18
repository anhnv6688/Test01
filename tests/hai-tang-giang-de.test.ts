import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  giaiDeTatDinh, soanLoiGiangTatDinh, type DeDaDoc,
} from "@/lib/domain/giang-de-doc-duoc";
import { viPhamNT07 } from "@/lib/domain/digest";
import { CHI_PHI_TANG_1, CHI_PHI_TANG_2, chiPhiTheoTang, tyLeTang2 } from "@/lib/domain/metering";
import { chiPhiMotTrang, chiPhiTrungBinhMoiTrang } from "@/lib/domain/mo-hinh-chi-phi";

/**
 * Hai tầng soạn lời giảng, và cái lỗi mà thiết kế này sửa.
 */
describe("tầng 1 — mã nguồn giải được, không gọi mô hình nào", () => {
  it("giải đúng phép tính, điền số, so sánh và đổi đơn vị", () => {
    expect(giaiDeTatDinh({ dang: "phep-tinh", bieuThuc: "45 + 27" })?.dapAn).toBe(72);
    expect(giaiDeTatDinh({ dang: "dien-so", bieuThuc: "5 + ? = 8" })?.dapAn).toBe(3);
    expect(giaiDeTatDinh({ dang: "so-sanh", veTrai: "45", vePhai: "54" })?.dapAn).toBe(-1);
    expect(giaiDeTatDinh({
      dang: "doi-don-vi", soNguon: 320, donViNguon: "cm", donViDich: "m",
    })).toBeNull(); // 3,2 m không tròn nên không dám chốt
    expect(giaiDeTatDinh({
      dang: "doi-don-vi", soNguon: 300, donViNguon: "cm", donViDich: "m",
    })?.dapAn).toBe(3);
  });

  it("bài toán có lời văn KHÔNG thuộc tầng 1", () => {
    expect(giaiDeTatDinh({ dang: "loi-van", noiDung: "Bống có 5 quả cam…" })).toBeNull();
    expect(giaiDeTatDinh({ dang: "khac", noiDung: "một sơ đồ lạ" })).toBeNull();
  });

  it("đọc không rõ biểu thức thì trả null, không đoán bừa", () => {
    expect(giaiDeTatDinh({ dang: "phep-tinh", bieuThuc: "4? + 2" })).toBeNull();
    expect(giaiDeTatDinh({ dang: "dien-so", bieuThuc: "5 + ? = ?" })).toBeNull();
  });

  it("nhận ra phép tính có nhớ để nhắc đúng cái bẫy", () => {
    expect(giaiDeTatDinh({ dang: "phep-tinh", bieuThuc: "45 + 27" })?.trapId).toBe("BAY-QUEN-NHO");
    expect(giaiDeTatDinh({ dang: "phep-tinh", bieuThuc: "42 + 23" })?.trapId).toBeNull();
    expect(giaiDeTatDinh({
      dang: "doi-don-vi", soNguon: 300, donViNguon: "cm", donViDich: "m",
    })?.trapId).toBe("BAY-DON-VI");
  });
});

describe("lời giảng phải bám ĐÚNG đề trong ảnh của phụ huynh", () => {
  const de: DeDaDoc = { dang: "phep-tinh", bieuThuc: "45 + 27" };
  const nguyenVan = "Đặt tính rồi tính: 45 + 27";

  it("giữ nguyên văn đề và đáp án của chính đề đó", () => {
    // Đây là bài canh lỗi đã từng có: hệ thống sinh MỘT BÀI KHÁC từ kho rồi
    // giảng bài đó, nên hộ chụp "45 + 27" nhận về lời giảng cho một phép tính
    // hoàn toàn khác. Với một phụ huynh đang ngồi cạnh con, đó còn tệ hơn là
    // không giảng gì.
    const lg = soanLoiGiangTatDinh(de, giaiDeTatDinh(de)!, "giang-tu-dau", nguyenVan);
    expect(lg.deBai).toBe(nguyenVan);
    expect(lg.dapAn).toBe(72);
    expect(JSON.stringify(lg)).toContain("45 + 27");
  });

  it("mức rút gọn ngắn hơn mức đầy đủ (BR-33)", () => {
    const giai = giaiDeTatDinh(de)!;
    const ngan = soanLoiGiangTatDinh(de, giai, "nhac-lai", nguyenVan);
    const day = soanLoiGiangTatDinh(de, giai, "giang-tu-dau", nguyenVan);
    expect(day.buoc.length).toBeGreaterThan(ngan.buoc.length);
  });

  it("mọi bước đều có câu để hỏi con (BR-27)", () => {
    for (const d of [
      { dang: "phep-tinh", bieuThuc: "45 + 27" },
      { dang: "dien-so", bieuThuc: "5 + ? = 8" },
      { dang: "so-sanh", veTrai: "45", vePhai: "54" },
      { dang: "doi-don-vi", soNguon: 300, donViNguon: "cm", donViDich: "m" },
    ] as DeDaDoc[]) {
      const lg = soanLoiGiangTatDinh(d, giaiDeTatDinh(d)!, "giang-tu-dau", "đề");
      for (const b of lg.buoc) expect(b.hoiCon.length, d.dang).toBeGreaterThan(10);
    }
  });

  it("tầng 1 không gắn nhãn máy, vì không có máy nào tham gia soạn", () => {
    const lg = soanLoiGiangTatDinh(de, giaiDeTatDinh(de)!, "giang-tu-dau", nguyenVan);
    expect(lg.nhanMay).toBeNull();
  });

  it("không câu nào vi phạm điều cấm chẩn đoán (NT-07)", () => {
    const lg = soanLoiGiangTatDinh(de, giaiDeTatDinh(de)!, "giang-tu-dau", nguyenVan);
    const toanBo = [lg.neuVanChuaHieu, ...lg.choHaySai,
      ...lg.buoc.flatMap((b) => [b.tieuDe, b.lamGi, b.hoiCon])].join(" ");
    expect(viPhamNT07(toanBo)).toEqual([]);
  });
});

describe("tầng 2 — chỉ gọi mô hình mạnh khi thật sự cần", () => {
  /*
   * Hai nguồn, vì hai thứ này nay ở hai tệp.
   *
   * CHỌN mô hình nào là việc riêng của nhà cung cấp Anthropic, nên ở claude.ts.
   * LỜI NHẮC thì mọi nhà cung cấp phải dùng CHUNG một bản, nên ở luoc-do.ts —
   * `npm run dau-model` chạy cùng một ảnh qua nhiều mô hình, và phép so sánh
   * chỉ có nghĩa khi mọi bên nhận đúng cùng một lời nhắc.
   */
  const chonModel = readFileSync("src/lib/vision/claude.ts", "utf-8");
  const loiNhac = readFileSync("src/lib/vision/luoc-do.ts", "utf-8");

  it("mô hình phiên âm mặc định là mô hình rẻ, không phải mô hình đắt", () => {
    expect(chonModel).toContain('OLY_MODEL_DOC_ANH ?? "claude-haiku-4-5"');
    expect(chonModel).toContain('OLY_MODEL_SOAN_GIANG ?? "claude-opus-5"');
  });

  it("lời nhắc soạn giảng cấm mọi nhận định về đứa trẻ (NT-07)", () => {
    const i = loiNhac.indexOf("export const NHAC_SOAN_GIANG");
    expect(i, "phải tìm thấy lời nhắc soạn giảng").toBeGreaterThan(-1);
    // Cắt tới dấu backtick đóng, không cắt tới một mốc có thể biến mất: bản
    // trước cắt tới "export class" — chuỗi ấy không còn trong tệp này, nên
    // indexOf trả -1 và phép cắt lặng lẽ lấy gần hết tệp. Bài vẫn xanh, nhưng
    // xanh vì quét cả tệp chứ không vì lời nhắc đúng.
    const nhac = loiNhac.slice(i, loiNhac.indexOf("`;", i));
    expect(nhac).toContain("tăng động");
    expect(nhac).toContain("Tuyệt đối không");
    expect(nhac).toContain("bạn không biết gì về đứa trẻ đó");
  });

  it("lời nhắc soạn giảng bắt mỗi bước phải có câu hỏi con (BR-27)", () => {
    expect(loiNhac).toContain("hoiCon");
    expect(loiNhac).toContain("Không được để trống");
  });

  it("tầng 2 nằm sau giao diện nhà cung cấp, để bản giả lập không gọi ra mạng", () => {
    const route = readFileSync("src/app/api/anh/xu-ly/route.ts", "utf-8");
    expect(route).toContain("layNhaCungCap().soanLoiGiang");
    expect(route).not.toContain("soanLoiGiangBangMay");
  });

  it("tắt mục đích soạn lời giảng thì KHÔNG gọi mô hình, và không trừ lượt", () => {
    const route = readFileSync("src/app/api/anh/xu-ly/route.ts", "utf-8");
    const nhanh = route.slice(route.indexOf("const giai = giaiDeTatDinh"), route.indexOf("ketQua = {"));
    // Lời gọi tầng 2 phải nằm trong nhánh đã kiểm tra sự đồng ý.
    expect(nhanh).toMatch(/else if \(batSoanGiang\)[\s\S]*soanLoiGiang/);
    expect(nhanh).toContain("truLuot: false");
  });
});

describe("đo chi phí theo tầng (BR-22)", () => {
  it("tầng 2 đắt hơn tầng 1 nhiều lần, nên phải đếm riêng", () => {
    expect(chiPhiTheoTang(1)).toBe(CHI_PHI_TANG_1);
    expect(chiPhiTheoTang(2)).toBe(CHI_PHI_TANG_2);
    expect(CHI_PHI_TANG_2).toBeGreaterThan(CHI_PHI_TANG_1 * 5);
  });

  it("tính được tỷ lệ tầng 2 từ nhật ký lượt dùng", () => {
    const luot = [1, 1, 1, 2].map((tang) => ({
      householdId: "h", hanhVi: "xu-ly-trang-anh" as const,
      at: "2026-09-14T00:00:00Z", chiPhiUocTinh: chiPhiTheoTang(tang as 1 | 2),
      tang: tang as 1 | 2,
    }));
    expect(tyLeTang2(luot)).toBeCloseTo(0.25);
    expect(tyLeTang2([])).toBe(0);
  });

  it("hằng số chi phí khớp với mô hình chi phí, không trôi khỏi nhau", () => {
    // Nếu ai đó sửa mô hình mà quên sửa hằng số dùng lúc ghi lượt, bài này đỏ.
    expect(CHI_PHI_TANG_1).toBeCloseTo(chiPhiMotTrang("haiku-4-5"), -2);
    const motLanSoan =
      chiPhiTrungBinhMoiTrang("haiku-4-5", "opus-5", 1) -
      chiPhiTrungBinhMoiTrang("haiku-4-5", "opus-5", 0);
    expect(CHI_PHI_TANG_2 - CHI_PHI_TANG_1).toBeCloseTo(motLanSoan, -2);
  });

  it("cách chia hai tầng rẻ hơn hẳn dùng mô hình đắt cho mọi việc", () => {
    const haiTang = chiPhiTrungBinhMoiTrang("haiku-4-5", "opus-5", 0.1);
    expect(haiTang).toBeLessThan(chiPhiMotTrang("opus-5"));
    // Nhưng KHÔNG rẻ bằng dùng mô hình rẻ cho mọi việc — đó là cái giá của
    // việc giảng được bài toán có lời văn, và nó phải nhìn thấy được.
    expect(haiTang).toBeGreaterThan(chiPhiMotTrang("haiku-4-5"));
  });
});

describe("đáp án không phải con số thì hiện bằng chữ", () => {
  it("bài so sánh trả về dấu, không trả về con số quy ước nội bộ", () => {
    const de: DeDaDoc = { dang: "so-sanh", veTrai: "13", vePhai: "26" };
    const lg = soanLoiGiangTatDinh(de, giaiDeTatDinh(de)!, "giang-tu-dau", "13 ... 26");
    // Phụ huynh phải thấy "dấu <", không phải "-1".
    expect(lg.dapAnChu).toBe("dấu <");
    expect(lg.donVi).toBeUndefined();
  });

  it("bài có đáp án là số thì không dùng đáp án bằng chữ", () => {
    const de: DeDaDoc = { dang: "phep-tinh", bieuThuc: "45 + 27" };
    const lg = soanLoiGiangTatDinh(de, giaiDeTatDinh(de)!, "giang-tu-dau", "45 + 27");
    expect(lg.dapAnChu).toBeUndefined();
    expect(lg.dapAn).toBe(72);
  });
});
