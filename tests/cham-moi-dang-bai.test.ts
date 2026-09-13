import { describe, expect, it } from "vitest";
import { chamBaiLam, chamCaTrang, tomTatTrang } from "@/lib/domain/cham-bai";
import { MOI_MA_DANG, type DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";
import { soDauTien, tachDangThuc, tinhBieuThuc } from "@/lib/domain/cham-bai/bieu-thuc";
import { TRAP_BY_ID } from "@/lib/domain/traps";

/**
 * VM-08: bản đầu tiên chấm được mọi dạng bài của chương trình lớp 1–2.
 */
describe("sổ đăng ký phủ hết mọi dạng bài (VM-08)", () => {
  const mauMoiDang: Record<string, DangBaiLam> = {
    "cot-doc": { dang: "cot-doc", soA: 47, soB: 28, phep: "+", chuSoTre: [5, 7] },
    "hang-ngang": { dang: "hang-ngang", veTrai: "12 - 4", ketQuaTre: 8 },
    "dien-so": { dang: "dien-so", bieuThuc: "5 + ? = 8", soTre: 3 },
    "so-sanh": { dang: "so-sanh", veTrai: "45", vePhai: "54", dauTre: "<" },
    "trac-nghiem": { dang: "trac-nghiem", luaChon: ["3", "4", "5"], chonTre: 1, dapAnDung: 1 },
    "bai-giai-loi-van": {
      dang: "bai-giai-loi-van", deBai: null,
      cauLoiGiai: "Số quả cam còn lại là:", phepTinh: "32 - 8 = 24", dapSo: "24 quả",
    },
    "doi-don-vi": { dang: "doi-don-vi", soNguon: 300, donViNguon: "cm", donViDich: "m", ketQuaTre: 3 },
    "dem-hinh": { dang: "dem-hinh", soThat: 12, ketQuaTre: 12 },
    "xem-gio": { dang: "xem-gio", gioThat: 4, phutThat: 30, gioTre: 4, phutTre: 30 },
    "noi-ghep": {
      dang: "noi-ghep",
      capTre: [{ trai: "2 x 3", phai: "6" }],
      capDung: [{ trai: "2 x 3", phai: "6" }],
    },
    "chua-nhan-dang": { dang: "chua-nhan-dang", docDuoc: "một sơ đồ lạ", ghiChu: null },
  };

  it("mọi mã dạng đều có mẫu để kiểm", () => {
    expect(Object.keys(mauMoiDang).sort()).toEqual([...MOI_MA_DANG].sort());
  });

  it("mọi dạng đều chấm được mà không ném lỗi", () => {
    for (const ma of MOI_MA_DANG) {
      const kq = chamBaiLam(mauMoiDang[ma]);
      expect(kq.dang, ma).toBe(ma);
      expect(kq.tenDang.length, ma).toBeGreaterThan(3);
      expect(kq.choPhuHuynh.length, ma).toBeGreaterThan(20);
    }
  });

  it("mọi dạng đều khai rõ mức tin cậy", () => {
    for (const ma of MOI_MA_DANG) {
      expect(["cao", "trung-binh", "thap"], ma).toContain(chamBaiLam(mauMoiDang[ma]).doTinCay);
    }
  });

  it("dạng nào không kiểm hết được thì phải nói rõ phần ngoài tầm kiểm (BR-38)", () => {
    for (const ma of MOI_MA_DANG) {
      const kq = chamBaiLam(mauMoiDang[ma]);
      if (kq.doTinCay !== "cao") {
        expect(kq.ngoaiTamKiem.length, `${ma} không nói rõ phần chưa kiểm được`).toBeGreaterThan(0);
      }
    }
  });

  it("mọi mã bẫy do bộ chấm sinh ra đều có trong ngân hàng bẫy", () => {
    const cacBai: DangBaiLam[] = [
      { dang: "cot-doc", soA: 47, soB: 28, phep: "+", chuSoTre: [5, 6] },
      { dang: "hang-ngang", veTrai: "47 + 28", ketQuaTre: 65 },
      { dang: "doi-don-vi", soNguon: 300, donViNguon: "cm", donViDich: "m", ketQuaTre: 300 },
      { dang: "dem-hinh", soThat: 12, ketQuaTre: 13 },
      { dang: "xem-gio", gioThat: 4, phutThat: 30, gioTre: 6, phutTre: 30 },
    ];
    for (const kq of chamCaTrang(cacBai)) {
      if (kq.trapId) expect(TRAP_BY_ID.has(kq.trapId), kq.trapId).toBe(true);
    }
  });
});

describe("đọc biểu thức trẻ viết", () => {
  it("tính đúng phép cộng trừ nhân chia theo đúng thứ tự sách giáo khoa", () => {
    expect(tinhBieuThuc("5 + 3")).toBe(8);
    expect(tinhBieuThuc("12 - 4 + 2")).toBe(10);
    expect(tinhBieuThuc("2 + 3 x 4")).toBe(14);
    expect(tinhBieuThuc("(2 + 3) x 4")).toBe(20);
    expect(tinhBieuThuc("12 : 4")).toBe(3);
  });

  it("hiểu dấu nhân và dấu chia theo cách trẻ viết", () => {
    expect(tinhBieuThuc("3 x 5")).toBe(15);
    expect(tinhBieuThuc("3 × 5")).toBe(15);
    expect(tinhBieuThuc("20 : 5")).toBe(4);
    expect(tinhBieuThuc("20 ÷ 5")).toBe(4);
    expect(tinhBieuThuc("10 − 4")).toBe(6);
  });

  it("trả về null khi không đọc được, chứ không đoán bừa", () => {
    expect(tinhBieuThuc("5 + ")).toBeNull();
    expect(tinhBieuThuc("abc")).toBeNull();
    expect(tinhBieuThuc("5 :: 3")).toBeNull();
    expect(tinhBieuThuc("12 : 0")).toBeNull();
    expect(tinhBieuThuc("")).toBeNull();
  });

  it("không bao giờ chạy chuỗi đến từ ảnh như mã lệnh", () => {
    // Nếu có ai đó lỡ dùng eval thì dòng này sẽ gây tác dụng phụ hoặc ném lỗi.
    expect(tinhBieuThuc("process.exit(1)")).toBeNull();
    expect(tinhBieuThuc("1;console.log(9)")).toBeNull();
  });

  it("tách được đẳng thức và lấy được số trong đáp số", () => {
    expect(tachDangThuc("32 - 8 = 24")).toEqual({ veTrai: "32 - 8", ketQua: 24 });
    expect(tachDangThuc("32 - 8")).toBeNull();
    expect(soDauTien("24 quả")).toBe(24);
    expect(soDauTien(null)).toBeNull();
  });
});

describe("bài giải có lời văn — dạng chiếm phần lớn số điểm", () => {
  const day = (p: Partial<Extract<DangBaiLam, { dang: "bai-giai-loi-van" }>>) =>
    chamBaiLam({
      dang: "bai-giai-loi-van", deBai: null,
      cauLoiGiai: "Số quả cam còn lại là:", phepTinh: "32 - 8 = 24", dapSo: "24 quả",
      ...p,
    });

  it("làm đủ ba phần thì đúng, và lời khen nói rõ khen chỗ nào", () => {
    const kq = day({});
    expect(kq.dung).toBe(true);
    expect(kq.choPhuHuynh).toContain("đủ ba phần");
  });

  it("thiếu câu lời giải thì bắt được, dù tính đúng", () => {
    const kq = day({ cauLoiGiai: null });
    expect(kq.dung).toBe(false);
    expect(kq.buoc[kq.buocSaiDauTien!].nhan).toBe("câu lời giải");
    expect(kq.choPhuHuynh).toContain("lời giải");
  });

  it("tính sai thì chỉ đúng vào dòng phép tính", () => {
    const kq = day({ phepTinh: "32 - 8 = 26" });
    expect(kq.dung).toBe(false);
    expect(kq.buoc[kq.buocSaiDauTien!].nhan).toBe("phép tính");
    expect(kq.buoc[kq.buocSaiDauTien!].oLyTinh).toContain("24");
  });

  it("phân biệt được lỗi chép nhầm đáp số với lỗi không hiểu bài", () => {
    const kq = day({ dapSo: "42 quả" });
    expect(kq.dung).toBe(false);
    expect(kq.buoc[kq.buocSaiDauTien!].nhan).toBe("đáp số");
    expect(kq.choPhuHuynh).toContain("chép nhầm");
    expect(kq.choPhuHuynh).toContain("đừng giảng lại cả bài");
  });

  it("thiếu đáp số thì bắt được", () => {
    expect(day({ dapSo: null }).dung).toBe(false);
  });

  it("đáp số thiếu đơn vị thì nhắc, vì đó là lỗi mất điểm hay gặp", () => {
    const kq = day({ dapSo: "24" });
    expect(kq.dung).toBe(false);
    expect(kq.buoc.some((b) => b.nhan === "đơn vị ở đáp số")).toBe(true);
  });

  it("nói thẳng rằng không kiểm được phép tính có hợp với đề hay không", () => {
    const kq = day({});
    expect(kq.doTinCay).toBe("trung-binh");
    expect(kq.ngoaiTamKiem.join(" ")).toContain("hợp với đề");
  });

  it("không đọc rõ phép tính thì để chưa kết luận, không kết luận là sai", () => {
    const kq = day({ phepTinh: "3? - ? = ??" });
    expect(kq.buoc[1].dung).toBeNull();
  });
});

describe("các dạng còn lại", () => {
  it("hàng ngang: lệch đúng 10 thì đoán là quên nhớ", () => {
    const kq = chamBaiLam({ dang: "hang-ngang", veTrai: "47 + 28", ketQuaTre: 65 });
    expect(kq.dung).toBe(false);
    expect(kq.trapId).toBe("BAY-QUEN-NHO");
    expect(kq.choPhuHuynh).toContain("một chục");
  });

  it("điền số: tìm ra số cần điền bằng cách thử, không cần giải phương trình", () => {
    expect(chamBaiLam({ dang: "dien-so", bieuThuc: "5 + ? = 8", soTre: 3 }).dung).toBe(true);
    expect(chamBaiLam({ dang: "dien-so", bieuThuc: "5 + ? = 8", soTre: 13 }).dung).toBe(false);
    expect(chamBaiLam({ dang: "dien-so", bieuThuc: "? - 4 = 16", soTre: 20 }).dung).toBe(true);
  });

  it("so sánh: chấm đúng và nhắc lại mẹo của cô giáo khi sai", () => {
    expect(chamBaiLam({ dang: "so-sanh", veTrai: "45", vePhai: "54", dauTre: "<" }).dung).toBe(true);
    const sai = chamBaiLam({ dang: "so-sanh", veTrai: "45", vePhai: "54", dauTre: ">" });
    expect(sai.dung).toBe(false);
    expect(sai.choPhuHuynh).toContain("cá sấu");
  });

  it("so sánh cả biểu thức chứ không chỉ hai số", () => {
    expect(chamBaiLam({ dang: "so-sanh", veTrai: "3 + 4", vePhai: "2 x 4", dauTre: "<" }).dung).toBe(true);
  });

  it("trắc nghiệm: không biết đáp án đúng thì không chấm bừa", () => {
    const kq = chamBaiLam({ dang: "trac-nghiem", luaChon: ["3", "4"], chonTre: 0, dapAnDung: null });
    expect(kq.dung).toBeNull();
    expect(kq.choPhuHuynh).toContain("không dám chấm");
  });

  it("trắc nghiệm: khoanh nhiều đáp án thì hỏi lại con, không chấm", () => {
    expect(chamBaiLam({ dang: "trac-nghiem", luaChon: ["3", "4"], chonTre: -1, dapAnDung: 0 }).dung)
      .toBeNull();
  });

  it("đổi đơn vị: bắt đúng bẫy chép nguyên con số sang", () => {
    const kq = chamBaiLam({
      dang: "doi-don-vi", soNguon: 300, donViNguon: "cm", donViDich: "m", ketQuaTre: 300,
    });
    expect(kq.dung).toBe(false);
    expect(kq.trapId).toBe("BAY-DON-VI");
  });

  it("đổi đơn vị: không đổi được giữa hai nhóm đại lượng khác nhau", () => {
    expect(chamBaiLam({
      dang: "doi-don-vi", soNguon: 3, donViNguon: "kg", donViDich: "m", ketQuaTre: 3,
    }).dung).toBeNull();
  });

  it("đếm hình và xem giờ: không đọc được đề thì nói thẳng là chưa kết luận", () => {
    expect(chamBaiLam({ dang: "dem-hinh", soThat: null, ketQuaTre: 12 }).dung).toBeNull();
    expect(chamBaiLam({ dang: "xem-gio", gioThat: null, phutThat: null, gioTre: 4, phutTre: 0 }).dung)
      .toBeNull();
  });

  it("xem giờ: bắt đúng lỗi đổi vai hai kim", () => {
    const kq = chamBaiLam({ dang: "xem-gio", gioThat: 4, phutThat: 30, gioTre: 6, phutTre: 30 });
    expect(kq.trapId).toBe("BAY-DOC-GIO");
  });

  it("nối ghép: đếm được cả số cặp con bỏ sót", () => {
    const kq = chamBaiLam({
      dang: "noi-ghep",
      capTre: [{ trai: "2 x 3", phai: "6" }],
      capDung: [{ trai: "2 x 3", phai: "6" }, { trai: "2 x 5", phai: "10" }],
    });
    expect(kq.dung).toBe(false);
    expect(kq.buoc.some((b) => b.nhan === "số cặp đã nối")).toBe(true);
  });

  it("dạng lạ: đọc được nhưng không chấm, và nói rõ không trừ lượt", () => {
    const kq = chamBaiLam({ dang: "chua-nhan-dang", docDuoc: "biểu đồ cột lạ", ghiChu: null });
    expect(kq.dung).toBeNull();
    expect(kq.choPhuHuynh).toContain("không bị trừ lượt");
  });
});

describe("tóm tắt cả trang", () => {
  it("đếm đủ ba loại kết quả và không giấu phần chưa kết luận", () => {
    const t = tomTatTrang(chamCaTrang([
      { dang: "hang-ngang", veTrai: "5 + 3", ketQuaTre: 8 },
      { dang: "hang-ngang", veTrai: "5 + 3", ketQuaTre: 9 },
      { dang: "dem-hinh", soThat: null, ketQuaTre: 4 },
    ]));
    expect(t.tongSoBai).toBe(3);
    expect(t.soDung).toBe(1);
    expect(t.soSai).toBe(1);
    expect(t.soChuaKetLuan).toBe(1);
    expect(t.cauChoPhuHuynh).toContain("chưa dám kết luận");
  });

  it("trang trắng thì nói không tìm thấy bài nào", () => {
    expect(tomTatTrang([]).cauChoPhuHuynh).toContain("không tìm thấy bài nào");
  });
});
