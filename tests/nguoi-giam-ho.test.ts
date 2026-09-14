import { beforeAll, describe, expect, it } from "vitest";
import {
  PHUONG_THUC, PHUONG_THUC_BY_MA, canhBaoXacMinh, kiemTraDuDieuKien,
  type NguoiGiamHo,
} from "@/lib/privacy/nguoi-giam-ho";
import {
  TUOI_TU_DONG_Y, ThangNamSinhKhongHopLeError, cheDoDongY, kiemThangNamSinh,
  ngayChuyenCheDo, tuoiTron,
} from "@/lib/privacy/tuoi";
import { MUC_DICH, dangBat, treDaDongY, type BanGhiDongY } from "@/lib/privacy/consent";

process.env.OLY_DB = ":memory:";

const NGUOI_GIAM_HO: NguoiGiamHo = {
  householdId: "h",
  quanHe: "me",
  hoTen: "Nguyễn Thị A",
  phuongThuc: "otp-dien-thoai",
  haiSoCuoi: "78",
  xacMinhLuc: "2026-09-01T00:00:00Z",
  phienBanVanBan: "v1",
  tuXacNhanDaiDien: true,
};

const T = (iso: string) => new Date(iso);

describe("tuổi của trẻ, tính từ tháng năm sinh", () => {
  it("tính đúng tuổi tròn", () => {
    expect(tuoiTron({ nam: 2019, thang: 3 }, T("2026-09-14T00:00:00Z"))).toBe(7);
    expect(tuoiTron({ nam: 2020, thang: 3 }, T("2026-09-14T00:00:00Z"))).toBe(6);
    expect(tuoiTron({ nam: 2019, thang: 10 }, T("2026-09-14T00:00:00Z"))).toBe(6);
  });

  it("thiếu ngày sinh thì làm tròn về phía HỎI THÊM, không về phía hỏi thiếu", () => {
    // Sinh tháng 9/2019, xét vào đầu tháng 9/2026. Không biết ngày, nên em có
    // thể đã tròn bảy tuổi hoặc còn vài ngày nữa. Ô Ly coi là đã đủ, và vì vậy
    // hỏi thêm chính em — thừa một câu hỏi thì được, thiếu sự đồng ý thì không.
    expect(tuoiTron({ nam: 2019, thang: 9 }, T("2026-09-01T00:00:00Z"))).toBe(TUOI_TU_DONG_Y);
    expect(cheDoDongY({ nam: 2019, thang: 9 }, T("2026-09-01T00:00:00Z"))).toBe("ca-hai");
  });

  it("mốc bảy tuổi chia đúng hai chế độ", () => {
    expect(cheDoDongY({ nam: 2020, thang: 1 }, T("2026-09-14T00:00:00Z"))).toBe("chi-nguoi-giam-ho");
    expect(cheDoDongY({ nam: 2019, thang: 1 }, T("2026-09-14T00:00:00Z"))).toBe("ca-hai");
  });

  it("báo trước ngày con chuyển chế độ, và im khi đã qua", () => {
    const sapToi = ngayChuyenCheDo({ nam: 2020, thang: 3 }, T("2026-09-14T00:00:00Z"));
    expect(sapToi?.toISOString()).toBe("2027-03-01T00:00:00.000Z");
    expect(ngayChuyenCheDo({ nam: 2018, thang: 3 }, T("2026-09-14T00:00:00Z"))).toBeNull();
  });

  it("từ chối tháng năm sinh vô lý thay vì âm thầm nhận", () => {
    const moc = T("2026-09-14T00:00:00Z");
    expect(() => kiemThangNamSinh({ nam: 2020, thang: 13 }, moc)).toThrow(ThangNamSinhKhongHopLeError);
    expect(() => kiemThangNamSinh({ nam: 2020, thang: 0 }, moc)).toThrow(ThangNamSinhKhongHopLeError);
    expect(() => kiemThangNamSinh({ nam: 2030, thang: 5 }, moc)).toThrow(/ngoài khoảng phục vụ/);
    expect(() => kiemThangNamSinh({ nam: 1990, thang: 5 }, moc)).toThrow(/ngoài khoảng phục vụ/);
    expect(kiemThangNamSinh({ nam: 2019, thang: 5 }, moc)).toEqual({ nam: 2019, thang: 5 });
  });
});

describe("cổng đủ điều kiện xử lý dữ liệu của trẻ (CR-05)", () => {
  const duoc7 = { nam: 2018, thang: 3 };
  const chua7 = { nam: 2021, thang: 3 };
  const moc = T("2026-09-14T00:00:00Z");

  it("chưa khai tháng năm sinh thì chưa được xử lý, và không đoán tuổi theo lớp", () => {
    const kq = kiemTraDuDieuKien(
      { nguoiGiamHo: NGUOI_GIAM_HO, thangNamSinh: null, dongYNguoiGiamHo: true, dongYCuaTre: true },
      moc,
    );
    expect(kq.duDieuKien).toBe(false);
    expect(kq.thieu).toContain("chua-khai-thang-nam-sinh");
    expect(kq.cheDo).toBeNull();
  });

  it("chưa có người đại diện thì chưa được xử lý, dù đã bấm đồng ý", () => {
    const kq = kiemTraDuDieuKien(
      { nguoiGiamHo: null, thangNamSinh: chua7, dongYNguoiGiamHo: true, dongYCuaTre: false },
      moc,
    );
    expect(kq.duDieuKien).toBe(false);
    expect(kq.thieu).toContain("chua-co-nguoi-giam-ho");
  });

  it("trẻ dưới 7 tuổi: người giám hộ đồng ý là đủ", () => {
    const kq = kiemTraDuDieuKien(
      { nguoiGiamHo: NGUOI_GIAM_HO, thangNamSinh: chua7, dongYNguoiGiamHo: true, dongYCuaTre: false },
      moc,
    );
    expect(kq.duDieuKien).toBe(true);
    expect(kq.cheDo).toBe("chi-nguoi-giam-ho");
  });

  it("trẻ từ đủ 7 tuổi: người giám hộ đồng ý thay con là KHÔNG đủ", () => {
    const kq = kiemTraDuDieuKien(
      { nguoiGiamHo: NGUOI_GIAM_HO, thangNamSinh: duoc7, dongYNguoiGiamHo: true, dongYCuaTre: false },
      moc,
    );
    expect(kq.duDieuKien).toBe(false);
    expect(kq.thieu).toEqual(["chua-co-dong-y-cua-tre"]);
    expect(kq.noiGiVoiPhuHuynh).toMatch(/chính con/);
  });

  it("trẻ từ đủ 7 tuổi: con đồng ý một mình cũng KHÔNG đủ", () => {
    const kq = kiemTraDuDieuKien(
      { nguoiGiamHo: NGUOI_GIAM_HO, thangNamSinh: duoc7, dongYNguoiGiamHo: false, dongYCuaTre: true },
      moc,
    );
    expect(kq.duDieuKien).toBe(false);
    expect(kq.thieu).toContain("chua-co-dong-y-nguoi-giam-ho");
  });

  it("trẻ từ đủ 7 tuổi: đủ cả hai mới được xử lý", () => {
    const kq = kiemTraDuDieuKien(
      { nguoiGiamHo: NGUOI_GIAM_HO, thangNamSinh: duoc7, dongYNguoiGiamHo: true, dongYCuaTre: true },
      moc,
    );
    expect(kq.duDieuKien).toBe(true);
    expect(kq.cheDo).toBe("ca-hai");
  });

  /*
   * Đây là bài kiểm thử quan trọng nhất của cả tệp.
   *
   * Một hộ hợp lệ hôm nay có thể thành không hợp lệ vào hôm con tròn bảy tuổi,
   * mà KHÔNG có sự kiện nào xảy ra để đánh dấu: không ai bấm gì, không ai sửa
   * gì, chỉ có thời gian trôi. Mọi cách làm dạng "chốt chế độ lúc đăng ký rồi
   * lưu lại" đều qua được năm bài trên và trượt đúng bài này.
   */
  it("sinh nhật lần thứ bảy làm một hộ đang đủ điều kiện trở thành thiếu", () => {
    const dv = {
      nguoiGiamHo: NGUOI_GIAM_HO,
      thangNamSinh: { nam: 2019, thang: 10 },
      dongYNguoiGiamHo: true,
      dongYCuaTre: false,
    };
    expect(kiemTraDuDieuKien(dv, T("2026-09-30T00:00:00Z")).duDieuKien).toBe(true);
    const sau = kiemTraDuDieuKien(dv, T("2026-10-01T00:00:00Z"));
    expect(sau.duDieuKien).toBe(false);
    expect(sau.thieu).toEqual(["chua-co-dong-y-cua-tre"]);
  });
});

describe("phương thức xác minh nói thật về sức mạnh của chính nó", () => {
  it("mỗi phương thức phải nêu được cả cái nó KHÔNG chứng minh được", () => {
    for (const p of PHUONG_THUC) {
      expect(p.khongChungMinhDuoc.length, p.ma).toBeGreaterThan(30);
    }
  });

  it("tự khai là yếu nhất và bị cảnh báo, không bị ỉm đi", () => {
    expect(PHUONG_THUC_BY_MA.get("tu-khai")?.doManh).toBe(1);
    const c = canhBaoXacMinh({ ...NGUOI_GIAM_HO, phuongThuc: "tu-khai" });
    expect(c).toMatch(/Tự khai/);
    expect(c).toMatch(/luật sư/);
  });

  it("chưa có bản ghi nào thì cũng phải cảnh báo", () => {
    expect(canhBaoXacMinh(null)).toMatch(/chưa có/i);
  });

  it("phương thức đủ mạnh thì không cảnh báo nữa", () => {
    expect(canhBaoXacMinh(NGUOI_GIAM_HO)).toBeNull();
  });
});

describe("hai sự đồng ý là hai bản ghi, không thay thế được cho nhau", () => {
  const chung = { householdId: "h", phienBanVanBan: "v1" };

  it("sự đồng ý của người giám hộ không tính là sự đồng ý của trẻ", () => {
    const ds: BanGhiDongY[] = [
      { ...chung, mucDich: "cham-bai-viet-tay", dongY: true, at: "2026-09-01T00:00:00Z",
        nguoiDongY: "nguoi-giam-ho", childId: null },
    ];
    expect(dangBat(ds, "cham-bai-viet-tay")).toBe(true);
    expect(treDaDongY(ds, "cham-bai-viet-tay", "con-1")).toBe(false);
  });

  it("sự đồng ý của trẻ gắn với đúng đứa trẻ đó, không lan sang anh em", () => {
    const ds: BanGhiDongY[] = [
      { ...chung, mucDich: "cham-bai-viet-tay", dongY: true, at: "2026-09-01T00:00:00Z",
        nguoiDongY: "tre-em", childId: "con-1" },
    ];
    expect(treDaDongY(ds, "cham-bai-viet-tay", "con-1")).toBe(true);
    expect(treDaDongY(ds, "cham-bai-viet-tay", "con-2")).toBe(false);
    expect(dangBat(ds, "cham-bai-viet-tay")).toBe(false);
  });

  it("con đổi ý thì bản ghi mới nhất có hiệu lực ngay", () => {
    const ds: BanGhiDongY[] = [
      { ...chung, mucDich: "cham-bai-viet-tay", dongY: true, at: "2026-09-01T00:00:00Z",
        nguoiDongY: "tre-em", childId: "con-1" },
      { ...chung, mucDich: "cham-bai-viet-tay", dongY: false, at: "2026-09-02T00:00:00Z",
        nguoiDongY: "tre-em", childId: "con-1" },
    ];
    expect(treDaDongY(ds, "cham-bai-viet-tay", "con-1")).toBe(false);
  });

  it("mọi mục đích đều có câu hỏi viết cho trẻ bảy tuổi, và là câu hỏi thật", () => {
    for (const m of MUC_DICH) {
      expect(m.hoiCon, m.ma).toMatch(/\?$/);
      // Câu cho trẻ không được là bản sao câu cho người lớn.
      expect(m.hoiCon, m.ma).not.toBe(m.giaiThich);
    }
  });
});

/* ------------------------------------------------------------------ */

type Repo = typeof import("@/lib/server/repo");
type DuDieuKien = typeof import("@/lib/server/du-dieu-kien");
type Thuc = typeof import("@/lib/server/thuc-thi-yeu-cau");
let repo: Repo;
let cong: DuDieuKien;
let thuc: Thuc;
let hoId: string;

beforeAll(async () => {
  const seed = await import("@/lib/server/seed");
  repo = await import("@/lib/server/repo");
  cong = await import("@/lib/server/du-dieu-kien");
  thuc = await import("@/lib/server/thuc-thi-yeu-cau");
  hoId = seed.moiDuLieu().householdId;
});

describe("lưu xuống cơ sở dữ liệu và đọc lại", () => {
  it("bản ghi người giám hộ mới nhất là bản có hiệu lực, bản cũ vẫn còn", () => {
    expect(repo.nguoiGiamHoHienTai(hoId)).toBeNull();
    repo.ghiNguoiGiamHo({
      householdId: hoId, quanHe: "me", hoTen: "Mẹ Bống",
      phuongThuc: "tu-khai", tuXacNhanDaiDien: true,
    });
    repo.ghiNguoiGiamHo({
      householdId: hoId, quanHe: "me", hoTen: "Mẹ Bống",
      phuongThuc: "otp-dien-thoai", tuXacNhanDaiDien: true,
    });
    expect(repo.nguoiGiamHoHienTai(hoId)?.phuongThuc).toBe("otp-dien-thoai");
  });

  it("sự đồng ý của trẻ mà không nói là trẻ nào thì bị từ chối ghi", () => {
    expect(() => repo.ghiDongY(hoId, "cham-bai-viet-tay", true, "tre-em", null)).toThrow(/childId/);
  });

  it("hai bạn hai bên mốc bảy tuổi thì chịu hai chế độ khác nhau", () => {
    const cacCon = repo.danhSachCon(hoId);
    const bong = cacCon.find((c) => c.tenGoi === "Bống")!;
    const cuTi = cacCon.find((c) => c.tenGoi === "Cu Tí")!;
    repo.ghiDongY(hoId, "cham-bai-viet-tay", true);

    // Cu Tí sáu tuổi: xong.
    expect(cong.dieuKienXuLy(hoId, cuTi, "cham-bai-viet-tay").duDieuKien).toBe(true);
    // Bống tám tuổi: còn thiếu chính Bống.
    const bongTruoc = cong.dieuKienXuLy(hoId, bong, "cham-bai-viet-tay");
    expect(bongTruoc.duDieuKien).toBe(false);
    expect(bongTruoc.thieu).toEqual(["chua-co-dong-y-cua-tre"]);

    repo.ghiDongY(hoId, "cham-bai-viet-tay", true, "tre-em", bong.id);
    expect(cong.dieuKienXuLy(hoId, bong, "cham-bai-viet-tay").duDieuKien).toBe(true);
    // Và sự đồng ý của Bống không mở khóa cho mục đích khác.
    expect(cong.dieuKienXuLy(hoId, bong, "doc-anh-de-bai").duDieuKien).toBe(false);
  });

  it("chưa khai tháng năm sinh thì bị chặn, khai rồi thì thôi", () => {
    const con = repo.themCon(hoId, "Bé mới", 1);
    expect(con.thangNamSinh).toBeNull();
    repo.ghiDongY(hoId, "doc-anh-de-bai", true);
    expect(cong.dieuKienXuLy(hoId, con, "doc-anh-de-bai").thieu).toContain("chua-khai-thang-nam-sinh");

    repo.ghiThangNamSinh(con.id, { nam: new Date().getUTCFullYear() - 6, thang: 1 });
    const sau = repo.danhSachCon(hoId).find((c) => c.id === con.id)!;
    expect(cong.dieuKienXuLy(hoId, sau, "doc-anh-de-bai").duDieuKien).toBe(true);
  });

  it("bản xuất dữ liệu có cả người đại diện và tháng năm sinh, không giấu đi", () => {
    const ban = thuc.xuatDuLieuHo(hoId)!;
    expect(ban.nguoiDaiDien?.hoTen).toBe("Mẹ Bống");
    expect(ban.con.find((c) => c.tenGoi === "Bống")?.thangNamSinh).not.toBeNull();
    expect(ban.ghiChu.join(" ")).toMatch(/không giữ ngày sinh/);
  });

  it("xóa hộ thì xóa luôn bản ghi người đại diện, không sót dòng nào", () => {
    expect(thuc.xoaDuLieuHo(hoId)).not.toBeNull();
    expect(thuc.conSotLaiCuaHo(hoId)).toBe(0);
  });
});
