import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

process.env.OLY_DB = ":memory:";

type Repo = typeof import("@/lib/server/repo");
type Req = typeof import("@/lib/server/requests");
type Thuc = typeof import("@/lib/server/thuc-thi-yeu-cau");
let repo: Repo;
let req: Req;
let thuc: Thuc;
let hoId: string;

beforeAll(async () => {
  const seed = await import("@/lib/server/seed");
  repo = await import("@/lib/server/repo");
  req = await import("@/lib/server/requests");
  thuc = await import("@/lib/server/thuc-thi-yeu-cau");
  hoId = seed.moiDuLieu().householdId;

  // Dựng một hộ có dữ liệu thật để việc xóa có cái mà xóa.
  const con = repo.danhSachCon(hoId)[0];
  repo.moPhien("phien-truc", con.id, new Date().toISOString());
  repo.ghiLanTraLoi("phien-truc", con.id, {
    itemId: "KD-001:5", templateId: "KD-001", yccd: "T2.SPT.02",
    given: 72, correct: true, trapId: null, hintsUsed: 0,
    attemptNo: 1, elapsedMs: 5000, at: new Date().toISOString(),
  });
  repo.ghiDongY(hoId, "doc-anh-de-bai", true);
  repo.ghiLuotXuLyTrang(hoId, 1);
});

describe("xuất dữ liệu — phục vụ yêu cầu xem và xuất (BR-39)", () => {
  it("gom đủ mọi thứ Ô Ly đang giữ về hộ", () => {
    const ban = thuc.xuatDuLieuHo(hoId);
    expect(ban).not.toBeNull();
    expect(ban!.con.length).toBeGreaterThan(0);
    expect(ban!.lichSuHocTap.length).toBeGreaterThan(0);
    expect(ban!.lichSuDongY.length).toBeGreaterThan(0);
    expect(ban!.luotTinhPhi.length).toBeGreaterThan(0);
  });

  it("nói rõ những gì Ô Ly KHÔNG giữ, không để người dùng phải đoán", () => {
    const ghi = thuc.xuatDuLieuHo(hoId)!.ghiChu.join(" ");
    expect(ghi).toContain("không giữ ảnh");
    expect(ghi).toContain("nét chữ");
  });

  it("hộ không tồn tại thì trả null, không ném lỗi", () => {
    expect(thuc.xuatDuLieuHo("khong-co-that")).toBeNull();
  });
});

describe("rút toàn bộ sự đồng ý", () => {
  it("tắt hết mọi mục đích nhưng GIỮ NGUYÊN lịch sử đồng ý cũ", async () => {
    const truoc = repo.lichSuDongY(hoId).length;
    const so = thuc.rutToanBoDongY(hoId);
    const sau = repo.lichSuDongY(hoId);

    expect(so).toBeGreaterThan(0);
    // Lịch sử dài ra chứ không ngắn đi: đó là bằng chứng CR-04 rằng trước đây
    // đã hỏi, và nay đã tắt theo yêu cầu.
    expect(sau.length).toBe(truoc + so);
    const { dangBat } = await import("@/lib/privacy/consent");
    expect(dangBat(sau, "doc-anh-de-bai")).toBe(false);
  });
});

describe("xóa dữ liệu — xóa thật, nhưng bằng chứng tuân thủ sống sót", () => {
  it("xóa sạch mọi bảng có dính tới hộ", async () => {
    const seed = await import("@/lib/server/seed");
    const hoXoa = seed.moiDuLieu().householdId;
    const con = repo.themCon(hoXoa, "Bé sẽ xóa", 2);
    repo.moPhien("phien-xoa", con.id, new Date().toISOString());
    repo.ghiLanTraLoi("phien-xoa", con.id, {
      itemId: "KD-001:9", templateId: "KD-001", yccd: "T2.SPT.02",
      given: 50, correct: false, trapId: null, hintsUsed: 1,
      attemptNo: 1, elapsedMs: 3000, at: new Date().toISOString(),
    });

    expect(thuc.conSotLaiCuaHo(hoXoa)).toBeGreaterThan(0);
    const kq = thuc.xoaDuLieuHo(hoXoa);
    expect(kq).not.toBeNull();
    expect(kq!.soCon).toBeGreaterThan(0);

    // Không còn một dòng nào ở bất kỳ bảng nào.
    expect(thuc.conSotLaiCuaHo(hoXoa)).toBe(0);
    expect(repo.danhSachCon(hoXoa)).toEqual([]);
    expect(repo.lichSuCuaCon(con.id)).toEqual([]);
  });

  it("NHẬT KÝ XỬ LÝ SỐNG SÓT sau khi xóa hộ", async () => {
    const seed = await import("@/lib/server/seed");
    const hoXoa = seed.moiDuLieu().householdId;
    const yc = req.taoYeuCauDuLieu(hoXoa, "xoa", "Xin xóa toàn bộ dữ liệu của cháu.");

    req.ghiNhatKy({
      loaiYeuCau: "du-lieu", maYeuCau: yc.id, hanhDong: "hoan-thanh:xoa",
      tuTrangThai: "moi", sangTrangThai: "hoan-thanh",
      nguoiTruc: "Trực viên A", ghiChu: "Đã xóa toàn bộ dữ liệu.", dungHan: true,
    });
    thuc.xoaDuLieuHo(hoXoa);

    // Bản ghi yêu cầu mất theo hộ — đúng, vì nó chứa nội dung của người dùng.
    expect(req.danhSachYeuCauDuLieu(hoXoa)).toEqual([]);
    // Nhưng dấu vết "đã nhận, đã xử lý, đúng hạn" phải còn. Nếu không thì việc
    // tuân thủ tốt nhất lại xóa mất bằng chứng tuân thủ (CR-06, BO-05).
    const nk = req.nhatKyCuaYeuCau(yc.id);
    expect(nk).toHaveLength(1);
    expect(nk[0].nguoiTruc).toBe("Trực viên A");
    expect(nk[0].dungHan).toBe(true);
  });

  it("nhật ký không chứa dữ liệu cá nhân của hộ", () => {
    const luocDo = readFileSync("src/lib/server/db.ts", "utf-8");
    const bang = luocDo.slice(luocDo.indexOf("CREATE TABLE IF NOT EXISTS nhat_ky_xu_ly"));
    const den = bang.slice(0, bang.indexOf(");"));
    expect(den).not.toMatch(/household_id|child_id|ten_goi|noi_dung/);
    // Và cố ý không có khóa ngoại, để không bị xóa dây chuyền.
    expect(den).not.toContain("REFERENCES");
  });
});

