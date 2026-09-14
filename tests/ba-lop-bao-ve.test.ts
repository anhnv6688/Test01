import { describe, expect, it } from "vitest";
import { ThieuCheAnhError, kiemTraChungTuChe } from "@/lib/privacy/redaction";
import { TRUONG_CAM, dungGoiGuiDi, timTruongCamTrongGoi } from "@/lib/privacy/envelope";
import { dungAnhRoiXoa, khoAnhTamThoi } from "@/lib/privacy/retention";
import { MUC_DICH, dangBat } from "@/lib/privacy/consent";
import type { BanGhiDongY } from "@/lib/privacy/consent";

/**
 * Thiết kế ba lớp của BR-32, BR-34, BR-35.
 *
 * Ghi chú cuối mục 6.6 của BRD: ba lớp này phải làm ĐỦ mới có giá trị — thiếu
 * một lớp thì hai lớp còn lại mất tác dụng pháp lý. Vì vậy mỗi lớp có bài kiểm
 * thử riêng, và điều kiện ra mắt số 10 đòi kiểm tra bằng nhật ký chứ không chỉ
 * bằng tài liệu mô tả.
 */
describe("lớp 1 — che ảnh ngay trên thiết bị (BR-32)", () => {
  const hopLe = {
    daCheTrenThietBi: true as const,
    daBoExif: true as const,
    vung: [{ x: 0, y: 0, w: 1, h: 0.16 }],
    phienBan: "che-tren-thiet-bi@1",
  };

  it("chứng từ đầy đủ thì nhận", () => {
    expect(() => kiemTraChungTuChe(hopLe)).not.toThrow();
  });

  it("thiếu chứng từ thì từ chối cả ảnh", () => {
    expect(() => kiemTraChungTuChe(undefined)).toThrow(ThieuCheAnhError);
    expect(() => kiemTraChungTuChe({})).toThrow(ThieuCheAnhError);
  });

  it("chưa che trên thiết bị thì từ chối", () => {
    expect(() => kiemTraChungTuChe({ ...hopLe, daCheTrenThietBi: false })).toThrow(ThieuCheAnhError);
  });

  it("còn siêu dữ liệu ảnh thì từ chối", () => {
    expect(() => kiemTraChungTuChe({ ...hopLe, daBoExif: false })).toThrow(ThieuCheAnhError);
  });

  it("không có vùng nào được tô đè thì từ chối", () => {
    expect(() => kiemTraChungTuChe({ ...hopLe, vung: [] })).toThrow(ThieuCheAnhError);
  });

  it("vùng tô đè quá nhỏ thì từ chối, vì không phủ nổi dải họ tên", () => {
    expect(() => kiemTraChungTuChe({ ...hopLe, vung: [{ x: 0, y: 0, w: 0.02, h: 0.02 }] }))
      .toThrow(ThieuCheAnhError);
  });
});

describe("lớp 2 — gói gửi đi không kèm mã truy ngược (BR-34)", () => {
  it("gói chỉ có đúng năm trường đã được duyệt", () => {
    const goi = dungGoiGuiDi({ loaiViec: "cham-bai-lam", lop: 2, hocKy: 2, anhBase64: "AAA" });
    expect(Object.keys(goi).sort()).toEqual(["anhBase64", "hocKy", "loaiViec", "lop", "maLanGoi"]);
  });

  it("không trường cấm nào lọt ra ngoài, dù người gọi truyền thừa", () => {
    const banDau = {
      loaiViec: "doc-de-bai" as const, lop: 2 as const, hocKy: 2 as const, anhBase64: "AAA",
      householdId: "ho-1", childId: "con-1", tenTre: "Bống", tenTruong: "Tiểu học Kim Liên",
      email: "me@example.com", deviceId: "abc", fileName: "bong-lop-2a.jpg",
    };
    const goi = dungGoiGuiDi(banDau);
    expect(timTruongCamTrongGoi(goi)).toEqual([]);
    const chuoi = JSON.stringify(goi);
    for (const cam of ["ho-1", "con-1", "Bống", "Kim Liên", "me@example.com", "abc", "bong-lop-2a.jpg"]) {
      expect(chuoi, `gói rò rỉ "${cam}"`).not.toContain(cam);
    }
  });

  it("mã mỗi lần gọi là ngẫu nhiên, không nối được hai lần gọi với nhau", () => {
    const a = dungGoiGuiDi({ loaiViec: "doc-de-bai", lop: 2, hocKy: 2, anhBase64: "X" });
    const b = dungGoiGuiDi({ loaiViec: "doc-de-bai", lop: 2, hocKy: 2, anhBase64: "X" });
    expect(a.maLanGoi).not.toBe(b.maLanGoi);
  });

  it("danh sách trường cấm bao gồm mọi mã định danh đã biết", () => {
    for (const k of ["householdId", "childId", "tenTre", "tenTruong", "deviceId"]) {
      expect(TRUONG_CAM as readonly string[]).toContain(k);
    }
  });
});

describe("lớp 3 — xóa ảnh gốc ngay sau khi trả kết quả (BR-35)", () => {
  it("ảnh bị xóa khi xử lý xong", async () => {
    const bytes = Buffer.from("anh-goc-cua-tre");
    const kq = await dungAnhRoiXoa("ma-1", bytes, async () => "xong");
    expect(kq).toBe("xong");
    expect(khoAnhTamThoi.co("ma-1")).toBe(false);
    expect(khoAnhTamThoi.doc("ma-1")).toBeNull();
  });

  it("ảnh vẫn bị xóa kể cả khi xử lý thất bại giữa chừng", async () => {
    const bytes = Buffer.from("anh-goc-cua-tre");
    await expect(
      dungAnhRoiXoa("ma-2", bytes, async () => { throw new Error("bên xử lý hỏng"); }),
    ).rejects.toThrow("bên xử lý hỏng");
    expect(khoAnhTamThoi.co("ma-2")).toBe(false);
  });

  it("vùng nhớ chứa ảnh bị ghi đè chứ không chỉ bỏ tham chiếu", async () => {
    const bytes = Buffer.from("anh-goc-cua-tre");
    await dungAnhRoiXoa("ma-3", bytes, async () => null);
    expect(bytes.every((b) => b === 0)).toBe(true);
  });

  it("không giữ lại ảnh nào sau khi mọi việc xong", async () => {
    for (let i = 0; i < 5; i++) {
      await dungAnhRoiXoa(`ma-${i}`, Buffer.from(`anh-${i}`), async () => i);
    }
    expect(khoAnhTamThoi.soAnhDangGiu()).toBe(0);
  });
});

describe("sự đồng ý tách theo từng mục đích (BR-37, CR-04)", () => {
  it("mặc định mọi mục đích đều tắt, không đánh dấu sẵn", () => {
    for (const m of MUC_DICH) {
      expect(m.macDinh).toBe(false);
      expect(dangBat([], m.ma), m.ma).toBe(false);
    }
  });

  it("lấy bản ghi mới nhất, nên tắt lại thì có hiệu lực ngay", () => {
    const ds: BanGhiDongY[] = [
      { householdId: "h", mucDich: "doc-anh-de-bai", dongY: true, at: "2026-09-01T00:00:00Z", phienBanVanBan: "v1", nguoiDongY: "nguoi-giam-ho", childId: null },
      { householdId: "h", mucDich: "doc-anh-de-bai", dongY: false, at: "2026-09-02T00:00:00Z", phienBanVanBan: "v1", nguoiDongY: "nguoi-giam-ho", childId: null },
    ];
    expect(dangBat(ds, "doc-anh-de-bai")).toBe(false);
  });

  it("bật một mục đích không kéo theo bật mục đích khác", () => {
    const ds: BanGhiDongY[] = [
      { householdId: "h", mucDich: "doc-anh-de-bai", dongY: true, at: "2026-09-01T00:00:00Z", phienBanVanBan: "v1", nguoiDongY: "nguoi-giam-ho", childId: null },
    ];
    expect(dangBat(ds, "doc-anh-de-bai")).toBe(true);
    expect(dangBat(ds, "cham-bai-viet-tay")).toBe(false);
    expect(dangBat(ds, "sinh-loi-giang")).toBe(false);
  });

  it("tắt một mục đích thì vẫn còn tính năng khác chạy — lựa chọn phải là thật", () => {
    for (const m of MUC_DICH) {
      expect(m.matGi.length, m.ma).toBeGreaterThan(0);
      expect(m.vanChay.length, `tắt ${m.ma} mà không còn gì chạy thì không phải lựa chọn thật`)
        .toBeGreaterThan(1);
    }
  });

  it("phần luyện tập của trẻ không bao giờ nằm trong danh sách mất đi", () => {
    for (const m of MUC_DICH) {
      for (const mat of m.matGi) {
        expect(mat.toLowerCase(), m.ma).not.toContain("luyện tập");
      }
    }
  });
});
