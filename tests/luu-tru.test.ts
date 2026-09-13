import { beforeAll, describe, expect, it } from "vitest";

process.env.OLY_DB = ":memory:";

type Repo = typeof import("@/lib/server/repo");
type Requests = typeof import("@/lib/server/requests");
let repo: Repo;
let requests: Requests;
let hoId: string;

beforeAll(async () => {
  const seed = await import("@/lib/server/seed");
  repo = await import("@/lib/server/repo");
  requests = await import("@/lib/server/requests");
  hoId = seed.moiDuLieu().householdId;
});

describe("dữ liệu mồi (BR-14)", () => {
  it("hộ mới mở ứng dụng đã có hồ sơ con để dùng ngay", () => {
    const con = repo.danhSachCon(hoId);
    expect(con.length).toBeGreaterThan(0);
    expect(con[0].lop === 1 || con[0].lop === 2).toBe(true);
  });

  it("mồi dữ liệu hai lần không tạo ra hộ thứ hai", async () => {
    const seed = await import("@/lib/server/seed");
    expect(seed.moiDuLieu().householdId).toBe(hoId);
  });
});

describe("hộ gia đình nhiều con (BR-11)", () => {
  it("thêm con thứ ba, thứ tư vẫn được", () => {
    const truoc = repo.danhSachCon(hoId).length;
    repo.themCon(hoId, "Nhím", 1);
    repo.themCon(hoId, "Sóc", 2);
    expect(repo.danhSachCon(hoId).length).toBe(truoc + 2);
  });
});

describe("lịch sử học (BR-09)", () => {
  it("ghi và đọc lại đúng từng lần trả lời của trẻ", () => {
    const con = repo.danhSachCon(hoId)[0];
    repo.moPhien("phien-1", con.id, new Date().toISOString());
    repo.ghiLanTraLoi("phien-1", con.id, {
      itemId: "KD-006:12", templateId: "KD-006", yccd: "T2.DL.01",
      given: 350, correct: false, trapId: "BAY-DON-VI", hintsUsed: 1,
      attemptNo: 1, elapsedMs: 8000, at: new Date().toISOString(),
    });
    const ds = repo.lichSuCuaCon(con.id);
    expect(ds).toHaveLength(1);
    expect(ds[0].trapId).toBe("BAY-DON-VI");
    expect(ds[0].correct).toBe(false);
  });

  it("hàm đọc lịch sử không nhận tham số nào về gói cước hay hạn thuê bao", () => {
    // Không có chỗ để cắm điều kiện chặn vào, kể cả sau này.
    expect(repo.lichSuCuaCon.length).toBeLessThanOrEqual(2);
  });
});

describe("đếm lượt xử lý trang ảnh (BR-19, BR-22, BR-31)", () => {
  it("chỉ ghi lượt khi được gọi tường minh, sau khi đã có kết quả", () => {
    const truoc = repo.soTrangDaDungThangNay(hoId);
    repo.ghiViecAnh({
      householdId: hoId, loai: "cham-bai-lam", thanhCong: false,
      ketQua: null, maLoi: "anh-toi-qua", vungDaChe: [{ x: 0, y: 0, w: 1, h: 0.2 }],
    });
    // Ghi một việc thất bại KHÔNG làm tăng số lượt đã dùng.
    expect(repo.soTrangDaDungThangNay(hoId)).toBe(truoc);

    repo.ghiLuotXuLyTrang(hoId);
    expect(repo.soTrangDaDungThangNay(hoId)).toBe(truoc + 1);
  });

  it("chi phí mỗi lượt được ghi lại để đối chiếu với hóa đơn thật", () => {
    const luot = repo.luotDungCuaHo(hoId);
    expect(luot.length).toBeGreaterThan(0);
    expect(luot[0].chiPhiUocTinh).toBeGreaterThan(0);
  });

  it("việc ảnh lưu lại kết quả và vùng đã che, làm nhật ký rà soát", () => {
    const ds = repo.lichSuViecAnh(hoId);
    expect(ds.length).toBeGreaterThan(0);
    expect(ds.some((v) => !v.thanhCong && v.maLoi === "anh-toi-qua")).toBe(true);
  });
});

describe("đếm lượt theo ngày, không cộng dồn (VM-07)", () => {
  it("mốc ngày cắt theo nửa đêm giờ Việt Nam, không theo giờ quốc tế", () => {
    // 17:30 giờ quốc tế ngày 20/9 là 00:30 sáng ngày 21/9 ở Việt Nam.
    // Một lượt chụp lúc đó phải tính vào ngày 21, tức là lượt của ngày mới.
    expect(repo.ngayVietNam(new Date("2026-09-20T17:30:00Z"))).toBe("2026-09-21");
    // 16:30 giờ quốc tế vẫn là 23:30 tối ngày 20 ở Việt Nam.
    expect(repo.ngayVietNam(new Date("2026-09-20T16:30:00Z"))).toBe("2026-09-20");
  });

  it("lượt của hôm qua không tính vào hôm nay", () => {
    const rieng = repo.themCon(hoId, "Bé đếm lượt", 2);
    expect(rieng.id.length).toBeGreaterThan(0);
    const homNayTruoc = repo.soTrangDaDungHomNay(hoId);
    const thangTruoc = repo.soTrangDaDungThangNay(hoId);

    repo.ghiLuotXuLyTrang(hoId);

    expect(repo.soTrangDaDungHomNay(hoId)).toBe(homNayTruoc + 1);
    expect(repo.soTrangDaDungThangNay(hoId)).toBe(thangTruoc + 1);

    // Nhìn từ một ngày khác, lượt vừa ghi không được tính.
    const ngayKhac = new Date(Date.now() + 3 * 86400_000);
    expect(repo.soTrangDaDungHomNay(hoId, ngayKhac)).toBe(0);
  });

  it("mucDaDung trả về cả hai con số cho bộ kiểm tra trần", () => {
    const m = repo.mucDaDung(hoId);
    expect(m.homNay).toBeGreaterThanOrEqual(0);
    expect(m.thangNay).toBeGreaterThanOrEqual(m.homNay);
  });
});

describe("bằng chứng về sự đồng ý (CR-04)", () => {
  it("mỗi lần bật tắt đều ghi kèm thời điểm và phiên bản văn bản đã đọc", () => {
    repo.ghiDongY(hoId, "doc-anh-de-bai", true);
    repo.ghiDongY(hoId, "doc-anh-de-bai", false);
    const ds = repo.lichSuDongY(hoId);
    expect(ds).toHaveLength(2);
    expect(ds[0].phienBanVanBan.length).toBeGreaterThan(0);
    expect(ds[1].dongY).toBe(false);
  });
});

describe("yêu cầu của người dùng và yêu cầu gỡ bỏ (BR-23, BR-39)", () => {
  it("yêu cầu về dữ liệu được gắn hạn ngay khi nhận, không chờ người trực ghi tay", () => {
    const yc = requests.taoYeuCauDuLieu(hoId, "xoa", "Xin xóa toàn bộ dữ liệu của cháu.");
    expect(new Date(yc.hanTiepNhan).getTime()).toBeGreaterThan(new Date(yc.nhanLuc).getTime());
    expect(new Date(yc.hanHoanThanh).getTime()).toBeGreaterThan(new Date(yc.nhanLuc).getTime());
    expect(requests.danhSachYeuCauDuLieu(hoId)).toHaveLength(1);
  });

  it("yêu cầu gỡ bỏ nội dung vào nhật ký kèm hạn xử lý", () => {
    requests.taoYeuCauGoBo({
      nguoiGui: "Nhà xuất bản X", lienHe: "phapche@example.com",
      doiTuong: "KD-001", lyDo: "Nghi ngờ trùng nội dung có bản quyền.",
    });
    const nk = requests.nhatKyGoBo();
    expect(nk).toHaveLength(1);
    expect(nk[0].trangThai).toBe("moi");
    expect(new Date(nk[0].hanXuLy).getTime()).toBeGreaterThan(new Date(nk[0].nhanLuc).getTime());
  });
});
