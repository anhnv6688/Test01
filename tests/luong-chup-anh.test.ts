import { beforeAll, describe, expect, it } from "vitest";
import { dungGoiGuiDi } from "@/lib/privacy/envelope";
import { NhaCungCapGiaLap } from "@/lib/vision/mock";
import {
  GIAI_THICH_LOI, NGUONG_NHO, NGUONG_NHOE, NGUONG_TOI, tienKiemChatLuong,
} from "@/lib/vision/provider";

const TOT = { doSang: 150, doTuongPhan: 45, canhDai: 1200 };
const goi = (anh: string) =>
  dungGoiGuiDi({ loaiViec: "cham-bai-lam", lop: 2, hocKy: 2, anhBase64: anh });

describe("chất lượng ảnh chụp trong điều kiện thật (BR-30)", () => {
  it("ảnh chụp bàn học buổi tối đủ sáng thì nhận", () => {
    expect(tienKiemChatLuong(TOT)).toBeNull();
  });

  it("ảnh tối, nhòe hoặc quá nhỏ đều được gọi đúng tên lỗi", () => {
    expect(tienKiemChatLuong({ ...TOT, doSang: NGUONG_TOI - 1 })).toBe("anh-toi-qua");
    expect(tienKiemChatLuong({ ...TOT, doTuongPhan: NGUONG_NHOE - 1 })).toBe("anh-mo");
    expect(tienKiemChatLuong({ ...TOT, canhDai: NGUONG_NHO - 1 })).toBe("khong-thay-chu");
  });
});

describe("ứng xử khi không đọc được ảnh (BR-31)", () => {
  const ncc = new NhaCungCapGiaLap();

  it("mọi lời giải thích đều nói rõ nguyên nhân và nói rõ không bị trừ lượt", () => {
    for (const [ma, cau] of Object.entries(GIAI_THICH_LOI)) {
      expect(cau, ma).toContain("không bị trừ lượt");
      expect(cau.length, ma).toBeGreaterThan(40);
    }
  });

  it("ảnh tối thì trả về lỗi kèm hướng dẫn chụp lại, không cố giải bừa", async () => {
    const kq = await ncc.xuLy(goi("QUFB"), { ...TOT, doSang: 10 });
    expect(kq.ok).toBe(false);
    if (!kq.ok) {
      expect(kq.loi.ma).toBe("anh-toi-qua");
      expect(kq.loi.noiGiVoiPhuHuynh).toContain("đèn bàn");
    }
  });
});

describe("nhà cung cấp xử lý ảnh", () => {
  const ncc = new NhaCungCapGiaLap();

  it("có thỏa thuận cấm huấn luyện và cam kết không lưu giữ (CR-03, CR-16)", () => {
    expect(ncc.thoaThuan.daKy).toBe(true);
    expect(ncc.thoaThuan.camDungDeHuanLuyen).toBe(true);
    expect(ncc.thoaThuan.camLuuGiu).toBe(true);
  });

  it("cùng một ảnh cho cùng một kết quả, để đo được chi phí và bấm giờ", async () => {
    const a = await ncc.xuLy(goi("bWFuaC1hbmgtbW90"), TOT);
    const b = await ncc.xuLy(goi("bWFuaC1hbmgtbW90"), TOT);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("kết quả chấm bài đọc ra được các chữ số ở dòng kết quả", async () => {
    const kq = await ncc.xuLy(goi("Y2hhbS1iYWktbGFt"), TOT);
    expect(kq.ok).toBe(true);
    if (kq.ok && kq.ketQua.loai === "cham-bai-lam") {
      expect(kq.ketQua.chuSoTre.length).toBeGreaterThan(0);
      expect(kq.ketQua.buocDocDuoc.length).toBe(2);
    }
  });

  it("đọc đề bài thì khớp về một khuôn dạng có trong kho", async () => {
    const nccDe = new NhaCungCapGiaLap();
    const kq = await nccDe.xuLy(
      dungGoiGuiDi({ loaiViec: "doc-de-bai", lop: 2, hocKy: 2, anhBase64: "ZGUtYmFp" }),
      TOT,
    );
    expect(kq.ok).toBe(true);
    if (kq.ok && kq.ketQua.loai === "doc-de-bai") {
      expect(kq.ketQua.khuonDangKhop).toMatch(/^KD-\d+$/);
      expect(kq.ketQua.deBai.length).toBeGreaterThan(10);
    }
  });
});

describe("lược đồ lưu trữ không có chỗ nào chứa ảnh (BR-35)", () => {
  let luocDo = "";
  beforeAll(async () => {
    const { readFileSync } = await import("node:fs");
    luocDo = readFileSync("src/lib/server/db.ts", "utf-8");
  });

  it("bảng photo_jobs không có cột nào chứa dữ liệu ảnh", () => {
    const bang = luocDo.slice(luocDo.indexOf("CREATE TABLE IF NOT EXISTS photo_jobs"));
    const den = bang.slice(0, bang.indexOf(");"));
    expect(den).not.toMatch(/\banh\b|\bimage\b|\bblob\b|BLOB/i);
  });

  it("không bảng nào có kiểu BLOB", () => {
    expect(luocDo).not.toMatch(/\bBLOB\b/);
  });

  it("không có cột nào lưu đặc trưng nét chữ hay khuôn mặt (NT-03, CR-18)", () => {
    expect(luocDo).not.toMatch(/net_chu|chu_ky_viet|handwriting|khuon_mat|face/i);
  });
});
