import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";
import { MOI_MA_DANG } from "@/lib/domain/cham-bai/dang-bai-lam";
import { Rng } from "@/lib/domain/rng";
import { gopBaoCao, chiPhiLanGoiDong, bangGiaCuaModel, type DongDo } from "@/lib/do-anh/bao-cao";
import { ghiBoAnhDienTap, NHAN_DIEN_TAP } from "@/lib/do-anh/bo-dien-tap";
import { chayBoDo, ThieuAnhError } from "@/lib/do-anh/chay";
import { inBaoCao } from "@/lib/do-anh/in-bao-cao";
import { doPhuDang, kiemTraNhan, NhanKhongHopLeError } from "@/lib/do-anh/nhan";
import {
  DIEN_TAP_MAC_DINH, lamSaiMotChuSo, NhaCungCapDienTap,
} from "@/lib/do-anh/nha-cung-cap-dien-tap";
import { soKhopCacBai, soKhopDeBai, soKhopKetLuan } from "@/lib/do-anh/so-khop";
import { kiemBoDo } from "@/lib/do-anh/tu-kiem";

let thuMuc: string;
let anhTheoTep: Map<string, string>;

beforeAll(async () => {
  thuMuc = await mkdtemp(path.join(tmpdir(), "o-ly-do-anh-"));
  anhTheoTep = await ghiBoAnhDienTap(thuMuc);
});

afterAll(async () => {
  await rm(thuMuc, { recursive: true, force: true });
});

describe("tệp nhãn phải hợp lệ trước khi tiêu đồng nào", () => {
  it("nhận bộ nhãn diễn tập", () => {
    expect(kiemTraNhan(NHAN_DIEN_TAP).anh.length).toBeGreaterThan(0);
  });

  it("từ chối nhãn thiếu người gắn nhãn", () => {
    expect(() => kiemTraNhan({ anh: [{ tep: "a.png", loaiViec: "cham-bai-lam", nguoiDocDuoc: false }] }))
      .toThrow(NhanKhongHopLeError);
  });

  it("từ chối một tệp bị gắn nhãn hai lần", () => {
    const a = { tep: "a.png", loaiViec: "cham-bai-lam", dieuKienChup: "tot", nguoiDocDuoc: false };
    expect(() => kiemTraNhan({ nguoiGanNhan: "x", anh: [a, { ...a }] })).toThrow(/hai lần/);
  });

  it("từ chối ảnh nói là đọc được mà chưa gắn nhãn bài nào", () => {
    expect(() =>
      kiemTraNhan({
        nguoiGanNhan: "x",
        anh: [{ tep: "a.png", loaiViec: "cham-bai-lam", dieuKienChup: "tot", nguoiDocDuoc: true }],
      }),
    ).toThrow(/chưa gắn nhãn bài nào/);
  });

  it("bộ diễn tập phủ hết mọi dạng bài mà VM-08 đòi chấm", () => {
    const phu = doPhuDang(NHAN_DIEN_TAP);
    for (const dang of MOI_MA_DANG) expect(phu.get(dang) ?? 0).toBeGreaterThan(0);
  });
});

describe("so khớp theo thứ tự trên trang", () => {
  const b = (n: number): DangBaiLam => ({ dang: "hang-ngang", veTrai: `${n} + 1`, ketQuaTre: n + 1 });

  it("hai danh sách giống hệt thì khớp hết", () => {
    const k = soKhopCacBai([b(1), b(2)], [b(1), b(2)]);
    expect(k.every((x) => x.mucKhop === "khop-het")).toBe(true);
  });

  it("bỏ sót một bài giữa trang làm mọi bài sau lệch nhịp, và bộ đo phải thấy", () => {
    const k = soKhopCacBai([b(1), b(2), b(3)], [b(1), b(3)]);
    expect(k[0].mucKhop).toBe("khop-het");
    expect(k[1].mucKhop).toBe("dung-dang-sai-so");
    expect(k[2].mucKhop).toBe("thieu");
  });

  it("đọc nhầm sang dạng khác bị gọi đúng tên", () => {
    const k = soKhopCacBai([b(1)], [{ dang: "dem-hinh", soThat: 2, ketQuaTre: 2 }]);
    expect(k[0].mucKhop).toBe("sai-dang");
  });

  it("nêu đúng trường bị đọc sai", () => {
    const k = soKhopCacBai([b(1)], [{ dang: "hang-ngang", veTrai: "1 + 1", ketQuaTre: 3 }]);
    expect(k[0].truongLech).toEqual(["ketQuaTre"]);
  });
});

describe("lệch kết luận — thứ thật sự làm hại một gia đình", () => {
  const dung: DangBaiLam = { dang: "hang-ngang", veTrai: "35 + 24", ketQuaTre: 59 };
  const sai: DangBaiLam = { dang: "hang-ngang", veTrai: "35 + 24", ketQuaTre: 58 };
  const khongKetLuan: DangBaiLam = { dang: "chua-nhan-dang", docDuoc: "vẽ hình", ghiChu: null };

  it("con làm đúng mà Ô Ly bảo sai là báo động giả", () => {
    expect(soKhopKetLuan([dung], [sai])).toEqual(["bao-dong-gia"]);
  });

  it("con làm sai mà Ô Ly bảo đúng là bỏ sót", () => {
    expect(soKhopKetLuan([sai], [dung])).toEqual(["bo-sot"]);
  });

  it("Ô Ly không dám kết luận thì gọi là mất kết luận, không gọi là sai", () => {
    expect(soKhopKetLuan([dung], [khongKetLuan])).toEqual(["mat-ket-luan"]);
    expect(soKhopKetLuan([khongKetLuan], [dung])).toEqual(["them-ket-luan"]);
  });

  it("đọc đúng thì không có lệch nào", () => {
    expect(soKhopKetLuan([dung, sai], [dung, sai])).toEqual(["giong-nhau", "giong-nhau"]);
  });
});

describe("ảnh chụp đề bài: sai một con số là hỏng cả lời giảng", () => {
  it("khác chữ mà đúng số thì không báo động", () => {
    expect(soKhopDeBai("Lan có 15 cái kẹo.", "Lan có 15 chiếc kẹo").muc).toBe("khop-so");
  });

  it("đúng từng chữ thì khớp hết", () => {
    expect(soKhopDeBai("Tính 5 + 3", "tính  5 + 3.").muc).toBe("khop-het");
  });

  it("đọc nhầm một con số thì gọi thẳng là sai số", () => {
    expect(soKhopDeBai("Lan có 15 cái kẹo", "Lan có 16 cái kẹo").muc).toBe("sai-so");
  });

  it("thiếu hẳn một con số cũng là sai số", () => {
    expect(soKhopDeBai("có 15 quả, cho 8 quả", "có 15 quả, cho đi một ít").muc).toBe("sai-so");
  });
});

describe("chi phí thật", () => {
  it("tra được bảng giá từ tên mô hình có đuôi ngày tháng", () => {
    expect(bangGiaCuaModel("claude-haiku-4-5-20251001")?.ten).toBe("Claude Haiku 4.5");
    expect(bangGiaCuaModel("claude-opus-5")?.ten).toBe("Claude Opus 5");
  });

  it("không tra được thì trả null chứ không đoán bừa", () => {
    expect(bangGiaCuaModel("mo-hinh-la-hoac")).toBeNull();
    expect(
      chiPhiLanGoiDong({ tokenVaoMoi: 1, tokenVaoTuDem: 0, tokenRa: 1, thoiGianMs: 1, model: "la" }),
    ).toBeNull();
  });

  it("tính đúng theo bảng giá và tỷ giá", () => {
    // Haiku 4.5: 1 USD mỗi triệu token vào, 5 USD mỗi triệu token ra.
    const tien = chiPhiLanGoiDong(
      { tokenVaoMoi: 1e6, tokenVaoTuDem: 0, tokenRa: 0, thoiGianMs: 0, model: "claude-haiku-4-5" },
      26_000,
    );
    expect(tien).toBeCloseTo(26_000, 5);
  });

  it("token đọc lại từ bộ đệm rẻ bằng một phần mười", () => {
    const tien = chiPhiLanGoiDong(
      { tokenVaoMoi: 0, tokenVaoTuDem: 1e6, tokenRa: 0, thoiGianMs: 0, model: "claude-haiku-4-5" },
      26_000,
    );
    expect(tien).toBeCloseTo(2_600, 5);
  });

  it("không nhà cung cấp nào báo token thì báo cáo nói chưa đo được, không lấp số", () => {
    const dong: DongDo[] = [
      {
        khop: { tep: "a.png", mayDocDuoc: true, nguoiDocDuoc: true, tuChoiOan: false, docBua: false, soBaiNhan: 0, soBaiMay: 0, bai: [], lechKetLuan: [] },
        dieuKienChup: "tot", loaiViec: "cham-bai-lam", maLoi: null, dungTang2: false,
        chiPhiDocAnh: null, chiPhiSoanGiang: null, khopDeBai: null,
      },
    ];
    const b = gopBaoCao(dong);
    expect(b.chiPhiTrungBinhMoiTrang).toBeNull();
    expect(inBaoCao(b)).toContain("CHƯA ĐO ĐƯỢC");
  });
});

describe("làm sai một chữ số — mọi dạng bài đều làm sai được, trừ dạng không kết luận", () => {
  const mau: Record<string, DangBaiLam> = {
    "cot-doc": { dang: "cot-doc", soA: 47, soB: 28, phep: "+", chuSoTre: [5, 7] },
    "hang-ngang": { dang: "hang-ngang", veTrai: "35 + 24", ketQuaTre: 59 },
    "dien-so": { dang: "dien-so", bieuThuc: "5 + ? = 12", soTre: 7 },
    "so-sanh": { dang: "so-sanh", veTrai: "45", vePhai: "54", dauTre: "<" },
    "trac-nghiem": { dang: "trac-nghiem", luaChon: ["1", "2"], chonTre: 0, dapAnDung: 0 },
    "bai-giai-loi-van": {
      dang: "bai-giai-loi-van",
      deBai: null,
      // Đủ ba phần và đáp số có đơn vị, nếu không thì chính cái nhãn đã sai sẵn
      // và bài kiểm thử sẽ không phân biệt được lỗi đọc với lỗi của trẻ.
      cauLoiGiai: "Số quả cam còn lại là:",
      phepTinh: "32 - 8 = 24",
      dapSo: "24 quả",
    },
    "doi-don-vi": { dang: "doi-don-vi", soNguon: 3, donViNguon: "m", donViDich: "cm", ketQuaTre: 300 },
    "dem-hinh": { dang: "dem-hinh", soThat: 7, ketQuaTre: 7 },
    "xem-gio": { dang: "xem-gio", gioThat: 8, phutThat: 30, gioTre: 8, phutTre: 30 },
    "noi-ghep": {
      dang: "noi-ghep",
      capTre: [{ trai: "2 x 3", phai: "6" }, { trai: "4 x 5", phai: "20" }],
      capDung: [{ trai: "2 x 3", phai: "6" }, { trai: "4 x 5", phai: "20" }],
    },
  };

  for (const [dang, bai] of Object.entries(mau)) {
    it(`${dang}: làm sai xong thì kết luận lật, nên bộ đo có cái để bắt`, () => {
      const sai = lamSaiMotChuSo(bai, new Rng(7));
      expect(sai, `${dang} phải làm sai được`).not.toBeNull();
      expect(soKhopKetLuan([bai], [sai as DangBaiLam])).toEqual(["bao-dong-gia"]);
    });
  }

  it("dạng chưa nhận dạng vốn không có kết luận nên không làm sai được", () => {
    expect(lamSaiMotChuSo({ dang: "chua-nhan-dang", docDuoc: "x", ghiChu: null }, new Rng(1))).toBeNull();
  });
});

describe("chạy trọn bộ đo trên bộ ảnh diễn tập", () => {
  it("dừng trước lần gọi đầu nếu thiếu tệp ảnh", async () => {
    await expect(
      chayBoDo({
        thuMuc,
        nhan: { ...NHAN_DIEN_TAP, anh: [...NHAN_DIEN_TAP.anh, { tep: "khong-co.png", loaiViec: "cham-bai-lam", dieuKienChup: "tot", nguoiDocDuoc: false }] },
        nhaCungCap: new NhaCungCapDienTap(NHAN_DIEN_TAP, anhTheoTep),
      }),
    ).rejects.toThrow(ThieuAnhError);
  });

  it("chạy hết bộ và dựng được báo cáo đọc được", async () => {
    const ncc = new NhaCungCapDienTap(NHAN_DIEN_TAP, anhTheoTep);
    const { baoCao } = await chayBoDo({ thuMuc, nhan: NHAN_DIEN_TAP, nhaCungCap: ncc });
    expect(baoCao.soAnh).toBe(NHAN_DIEN_TAP.anh.length);
    expect(baoCao.soBai).toBeGreaterThan(0);
    expect(baoCao.theoDieuKien.length).toBeGreaterThan(1);
    expect(baoCao.chiPhiTrungBinhMoiTrang).not.toBeNull();
    expect(inBaoCao(baoCao)).toContain("BÁO CÁO ĐO BỘ ẢNH");
  });

  it("đề giải được bằng mã nguồn thì KHÔNG chạm tầng 2", async () => {
    const ncc = new NhaCungCapDienTap(NHAN_DIEN_TAP, anhTheoTep);
    const { dong } = await chayBoDo({ thuMuc, nhan: NHAN_DIEN_TAP, nhaCungCap: ncc });
    const tang2 = dong.filter((d) => d.dungTang2).map((d) => d.khop.tep);
    // Bản diễn tập trả mọi đề về dạng lời văn, nên chỉ ảnh đề nào đọc được mới
    // chạm tầng 2 — và không ảnh chấm bài nào được chạm tới nó.
    expect(dong.filter((d) => d.loaiViec === "cham-bai-lam" && d.dungTang2)).toEqual([]);
    expect(tang2.length).toBeGreaterThan(0);
  });

  it("chạy lại cùng một bộ ảnh cho đúng cùng một kết quả", async () => {
    const chay = async () => {
      const ncc = new NhaCungCapDienTap(NHAN_DIEN_TAP, anhTheoTep);
      const { baoCao } = await chayBoDo({ thuMuc, nhan: NHAN_DIEN_TAP, nhaCungCap: ncc });
      // Bỏ phần thời gian: nó thay đổi theo từng lần chạy một cách chính đáng.
      return { ...baoCao, thoiGianTrungViMs: 0, thoiGianP90Ms: 0, chiPhiTrungBinhMoiTrang: 0, chiPhiTrangCaoNhat: 0 };
    };
    expect(await chay()).toEqual(await chay());
  });
});

describe("bộ đo tự kiểm: gài lỗi biết trước rồi đòi bộ đo nêu đúng", () => {
  it("ở mức lỗi mặc định, không ảnh nào bị bỏ sót và không ảnh sạch nào bị báo nhầm", async () => {
    const ncc = new NhaCungCapDienTap(NHAN_DIEN_TAP, anhTheoTep);
    const { dong } = await chayBoDo({ thuMuc, nhan: NHAN_DIEN_TAP, nhaCungCap: ncc });
    expect(kiemBoDo(dong, ncc)).toEqual([]);
  });

  it("vẫn đúng khi gài lỗi dày đặc, qua nhiều hạt ngẫu nhiên khác nhau", async () => {
    for (const hat of [1, 2, 3, 5, 8, 13, 21, 34]) {
      const ncc = new NhaCungCapDienTap(NHAN_DIEN_TAP, anhTheoTep, {
        ...DIEN_TAP_MAC_DINH,
        tyLeSaiChuSo: 0.5,
        tyLeBoBai: 0.25,
        tyLeTuChoiOan: 0.2,
        tyLeDocBua: 0.5,
        hat,
      });
      const { dong } = await chayBoDo({ thuMuc, nhan: NHAN_DIEN_TAP, nhaCungCap: ncc });
      expect(kiemBoDo(dong, ncc), `hạt ${hat}`).toEqual([]);
      // Mức lỗi dày thế này phải gài được vào ít nhất vài tấm, nếu không thì
      // bài kiểm thử đang không kiểm gì cả.
      expect(ncc.daGai.size, `hạt ${hat}`).toBeGreaterThan(2);
    }
  });

  it("không gài lỗi nào thì báo cáo phải hoàn toàn sạch", async () => {
    const ncc = new NhaCungCapDienTap(NHAN_DIEN_TAP, anhTheoTep, {
      tyLeSaiChuSo: 0, tyLeBoBai: 0, tyLeTuChoiOan: 0, tyLeDocBua: 0, hat: 1,
    });
    const { baoCao } = await chayBoDo({ thuMuc, nhan: NHAN_DIEN_TAP, nhaCungCap: ncc });
    expect(baoCao.demLechKetLuan["bao-dong-gia"]).toBe(0);
    expect(baoCao.demLechKetLuan["bo-sot"]).toBe(0);
    expect(baoCao.soTuChoiOan).toBe(0);
    expect(baoCao.soDocBua).toBe(0);
    expect(baoCao.tyLeKhopChung).toBe(1);
  });
});
