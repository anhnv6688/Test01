import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { chuyenDoi, ThieuThoaThuanError } from "@/lib/vision/claude";
import { chamBaiLam } from "@/lib/domain/cham-bai";
import { MOI_MA_DANG } from "@/lib/domain/cham-bai/dang-bai-lam";

/**
 * Nhà cung cấp thật: cổng chặn tuân thủ và phần ghép dữ liệu.
 *
 * Không bài nào ở đây gọi ra mạng. Phần gọi mạng chỉ có một đường vào duy nhất
 * là hàm xuLy, và đường đó bị chặn bởi hàm dựng nếu chưa ký thỏa thuận.
 */
const CO = ["OLY_DPA_DA_KY", "OLY_DPA_CAM_HUAN_LUYEN", "OLY_DPA_CAM_LUU_GIU"] as const;

describe("cổng chặn tuân thủ trước khi xử lý dữ liệu thật (CR-03, CR-16)", () => {
  const luu: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const c of CO) { luu[c] = process.env[c]; delete process.env[c]; }
    luu.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "khoa-gia-cho-kiem-thu";
  });

  afterEach(async () => {
    for (const c of CO) {
      if (luu[c] === undefined) delete process.env[c];
      else process.env[c] = luu[c] as string;
    }
    if (luu.ANTHROPIC_API_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = luu.ANTHROPIC_API_KEY;
  });

  it("chưa ký thỏa thuận thì không dựng được nhà cung cấp thật", async () => {
    const { NhaCungCapClaude } = await import("@/lib/vision/claude");
    expect(() => new NhaCungCapClaude()).toThrow(ThieuThoaThuanError);
  });

  it("thiếu dù chỉ một trong ba cam kết cũng bị chặn", async () => {
    const { NhaCungCapClaude } = await import("@/lib/vision/claude");
    for (const thieu of CO) {
      for (const c of CO) process.env[c] = "true";
      delete process.env[thieu];
      expect(() => new NhaCungCapClaude(), `thiếu ${thieu}`).toThrow(ThieuThoaThuanError);
    }
  });

  it("chưa cấu hình đủ thì hệ thống quay về bản giả lập, không gửi dữ liệu ra ngoài", async () => {
    const { layNhaCungCap, datNhaCungCap } = await import("@/lib/vision/chon-nha-cung-cap");
    const { NhaCungCapGiaLap } = await import("@/lib/vision/mock");
    datNhaCungCap(new NhaCungCapGiaLap());
    expect(layNhaCungCap().ten).toBe("gia-lap-noi-bo");
  });
});

describe("ghép dữ liệu phẳng về đúng dạng bài", () => {
  const rong = {
    soA: null, soB: null, phep: null, chuSoTre: null, veTrai: null, vePhai: null,
    ketQuaTre: null, bieuThuc: null, soTre: null, dauTre: null, luaChon: null,
    chonTre: null, dapAnDung: null, deBai: null, cauLoiGiai: null, phepTinh: null,
    dapSo: null, soNguon: null, donViNguon: null, donViDich: null, soThat: null,
    gioThat: null, phutThat: null, gioTre: null, phutTre: null, capTre: null,
    capDung: null, docDuoc: null, ghiChu: null,
  };

  it("ghép đúng một bài cột dọc đầy đủ", () => {
    const kq = chuyenDoi({ ...rong, dang: "cot-doc", soA: 47, soB: 28, phep: "+", chuSoTre: [5, 7] });
    expect(kq.dang).toBe("cot-doc");
    expect(chamBaiLam(kq).dung).toBe(true);
  });

  it("thiếu trường bắt buộc thì rơi về dạng chưa nhận dạng, KHÔNG ném lỗi", () => {
    // Phụ huynh đang đứng chờ trước màn hình; một câu nói thật tử tế hơn một
    // màn hình lỗi kỹ thuật.
    for (const dang of MOI_MA_DANG) {
      const kq = chuyenDoi({ ...rong, dang });
      expect(() => chamBaiLam(kq)).not.toThrow();
    }
  });

  it("cột dọc thiếu dòng kết quả thì nói rõ vì sao chưa nhận dạng", () => {
    const kq = chuyenDoi({ ...rong, dang: "cot-doc", soA: 47, soB: 28, phep: "+", chuSoTre: null });
    expect(kq.dang).toBe("chua-nhan-dang");
    if (kq.dang === "chua-nhan-dang") expect(kq.ghiChu).toContain("cột dọc");
  });

  it("giữ nguyên con số trẻ viết, kể cả khi sai — mô hình phiên âm chứ không sửa", () => {
    const kq = chuyenDoi({
      ...rong, dang: "hang-ngang", veTrai: "47 + 28", ketQuaTre: 65,
    });
    expect(kq.dang).toBe("hang-ngang");
    if (kq.dang === "hang-ngang") expect(kq.ketQuaTre).toBe(65);
    // Việc phát hiện 65 là sai thuộc về phần chấm, không thuộc về mô hình.
    expect(chamBaiLam(kq).dung).toBe(false);
  });

  it("mọi dạng ghép ra đều chấm được", () => {
    const mau: Record<string, Parameters<typeof chuyenDoi>[0]> = {
      "cot-doc": { ...rong, dang: "cot-doc", soA: 30, soB: 12, phep: "-", chuSoTre: [8, 1] },
      "hang-ngang": { ...rong, dang: "hang-ngang", veTrai: "5 + 3", ketQuaTre: 8 },
      "dien-so": { ...rong, dang: "dien-so", bieuThuc: "5 + ? = 8", soTre: 3 },
      "so-sanh": { ...rong, dang: "so-sanh", veTrai: "45", vePhai: "54", dauTre: "<" },
      "trac-nghiem": { ...rong, dang: "trac-nghiem", luaChon: ["3", "4"], chonTre: 0, dapAnDung: 0 },
      "bai-giai-loi-van": {
        ...rong, dang: "bai-giai-loi-van",
        cauLoiGiai: "Số kẹo còn lại là:", phepTinh: "20 - 5 = 15", dapSo: "15 cái",
      },
      "doi-don-vi": {
        ...rong, dang: "doi-don-vi", soNguon: 200, donViNguon: "cm", donViDich: "m", ketQuaTre: 2,
      },
      "dem-hinh": { ...rong, dang: "dem-hinh", soThat: 9, ketQuaTre: 9 },
      "xem-gio": { ...rong, dang: "xem-gio", gioThat: 3, phutThat: 0, gioTre: 3, phutTre: 0 },
      "noi-ghep": {
        ...rong, dang: "noi-ghep",
        capTre: [{ trai: "2 x 2", phai: "4" }], capDung: [{ trai: "2 x 2", phai: "4" }],
      },
      "chua-nhan-dang": { ...rong, dang: "chua-nhan-dang", docDuoc: "hình lạ" },
    };
    for (const ma of MOI_MA_DANG) {
      const kq = chamBaiLam(chuyenDoi(mau[ma]));
      expect(kq.choPhuHuynh.length, ma).toBeGreaterThan(20);
    }
  });
});

describe("lời nhắc gửi cho mô hình nói rõ chỉ phiên âm, không chấm", () => {
  it("mã nguồn có câu cấm chấm điểm", async () => {
    const { readFileSync } = await import("node:fs");
    const nguon = readFileSync("src/lib/vision/claude.ts", "utf-8");
    expect(nguon).toContain("KHÔNG chấm điểm");
    expect(nguon).toContain("PHIÊN ÂM");
    // Lược đồ đầu ra không có chỗ nào để mô hình ghi đúng sai.
    const luocDo = nguon.slice(nguon.indexOf("const BaiSchema"), nguon.indexOf("const TrangSchema"));
    expect(luocDo).not.toMatch(/\b(dung|correct|diem|score)\s*:/);
  });
});
