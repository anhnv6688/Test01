import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { chamBaiLam } from "@/lib/domain/cham-bai";
import { MOI_MA_DANG } from "@/lib/domain/cham-bai/dang-bai-lam";
import {
  baiTrong, chuSoTreTuChuoi, chuoiTuChuSoTre, gopNhanMotAnh, laTenAnhHopLe,
  locTenAnh, MO_TA_DANG, tienDoGanNhan, xoaNhanMotAnh,
} from "@/lib/do-anh/gan-nhan";
import { MOI_DIEU_KIEN, MO_TA_DIEU_KIEN, type NhanBoAnh, type NhanMotAnh } from "@/lib/do-anh/nhan";
import {
  CongCuKhoaError, congCuGanNhanMoKhong, danhSachAnh, docAnh, docNhan, ghiNhan,
} from "@/lib/server/kho-anh-do";

/**
 * Canh công cụ gắn nhãn — một công cụ cục bộ phục vụ ẢNH TRANG VỞ CỦA TRẺ.
 *
 * Hai nhóm ràng buộc, và nhóm thứ hai quan trọng hơn nhóm thứ nhất:
 *
 *   1. Nhãn gõ ra phải đúng khuôn, vì nhãn sai làm bộ đo báo sai — mà một bộ đo
 *      báo sai còn tệ hơn không đo, do người ta sẽ tin vào con số nó in ra.
 *   2. Công cụ phải KHÓA HẲN ở bản phát hành. Nó đọc ảnh chưa che từ đĩa và
 *      đưa ra qua HTTP; trên một địa chỉ công khai thì đó là một sự cố lộ dữ
 *      liệu trẻ em, không phải một tính năng cần bảo vệ bằng mật khẩu.
 */
const GOC = { ...process.env };
afterEach(() => { process.env = { ...GOC }; });

function datPhatHanh(): void {
  (process.env as Record<string, string>).NODE_ENV = "production";
}

describe("chốt: công cụ gắn nhãn không theo lên bản phát hành", () => {
  it("bản phát triển thì mở", () => {
    expect(congCuGanNhanMoKhong()).toBe(true);
  });

  it("bản phát hành thì mọi cửa vào đều ném lỗi khóa", async () => {
    datPhatHanh();
    expect(congCuGanNhanMoKhong()).toBe(false);
    await expect(danhSachAnh()).rejects.toBeInstanceOf(CongCuKhoaError);
    await expect(docAnh("a.jpg")).rejects.toBeInstanceOf(CongCuKhoaError);
    await expect(docNhan()).rejects.toBeInstanceOf(CongCuKhoaError);
    await expect(ghiNhan({ moTa: "", nguoiGanNhan: "x", ganNhanLuc: "", anh: [] }))
      .rejects.toBeInstanceOf(CongCuKhoaError);
  });

  it("không có biến môi trường nào mở lại được", () => {
    datPhatHanh();
    for (const bien of [
      "OLY_GAN_NHAN", "OLY_DU_LIEU_MAU", "OLY_MOI_TRUONG", "OLY_THU_MUC_ANH", "OLY_MA_TRUC",
    ]) {
      (process.env as Record<string, string>)[bien] = "true";
      expect(congCuGanNhanMoKhong(), `${bien} mở lại được công cụ`).toBe(false);
    }
  });

  it("trang và hai địa chỉ API đều tự kiểm chốt, không tin vào một chỗ duy nhất", () => {
    for (const tep of [
      "src/app/gan-nhan/page.tsx",
      "src/app/api/gan-nhan/route.ts",
      "src/app/api/gan-nhan/anh/route.ts",
    ]) {
      expect(readFileSync(tep, "utf8"), `${tep} không gọi chốt`).toMatch(/congCuGanNhanMoKhong\(\)/);
    }
  });
});

describe("tên tệp ảnh", () => {
  it("nhận đúng đuôi ảnh", () => {
    expect(laTenAnhHopLe("trang-01.jpg")).toBe(true);
    expect(laTenAnhHopLe("TRANG.JPEG")).toBe(true);
    expect(laTenAnhHopLe("a.heic")).toBe(true);
  });

  it("chặn đường dẫn đi ra khỏi thư mục ảnh", () => {
    for (const xau of [
      "../.env", "../../etc/passwd.png", "a/b.jpg", "a\\b.jpg", ".env", "", "x.txt", "nhan.json",
    ]) {
      expect(laTenAnhHopLe(xau), `${xau} lọt qua`).toBe(false);
    }
  });

  it("xếp theo số chứ không theo chữ, để trang 2 đứng trước trang 10", () => {
    expect(locTenAnh(["trang-10.jpg", "ghi-chu.txt", "trang-2.jpg", "trang-1.jpg"]))
      .toEqual(["trang-1.jpg", "trang-2.jpg", "trang-10.jpg"]);
  });
});

describe("nhãn rỗng của từng dạng", () => {
  it("mọi dạng trong sổ đăng ký đều có nhãn rỗng và có mô tả cho người gắn nhãn", () => {
    for (const d of MOI_MA_DANG) {
      expect(baiTrong(d).dang).toBe(d);
      expect(MO_TA_DANG[d].ten.length).toBeGreaterThan(0);
      expect(MO_TA_DANG[d].nhanBiet.length).toBeGreaterThan(0);
    }
  });

  it("bộ chấm chạy được ngay trên nhãn rỗng, không ném lỗi giữa lúc đang gõ", () => {
    for (const d of MOI_MA_DANG) {
      expect(() => chamBaiLam(baiTrong(d))).not.toThrow();
    }
  });

  it("mọi điều kiện chụp đều có mô tả", () => {
    for (const d of MOI_DIEU_KIEN) expect(MO_TA_DIEU_KIEN[d].length).toBeGreaterThan(0);
    expect(MOI_DIEU_KIEN).toContain("xoay-90");
  });
});

/**
 * Chỗ dễ sai nhất của cả trang gắn nhãn.
 *
 * Người gõ từ trái sang phải, khuôn lưu từ phải sang trái. Gõ ngược thì "75"
 * thành "57" — cả hai đều là số hợp lệ, nên KHÔNG có cách nào phát hiện từ dữ
 * liệu về sau. Sai ở đây là sai vĩnh viễn và im lặng.
 */
describe("dòng kết quả của phép tính cột dọc", () => {
  it("đảo từ cách người gõ sang cách bộ chấm đọc", () => {
    expect(chuSoTreTuChuoi("75")).toEqual([5, 7]);
    expect(chuSoTreTuChuoi("123")).toEqual([3, 2, 1]);
  });

  it("dấu chấm là ô bỏ trống, khác hẳn với số 0", () => {
    expect(chuSoTreTuChuoi("7.")).toEqual([null, 7]);
    expect(chuSoTreTuChuoi("70")).toEqual([0, 7]);
    expect(chuSoTreTuChuoi("7.")).not.toEqual(chuSoTreTuChuoi("70"));
  });

  it("đi và về không mất gì", () => {
    for (const s of ["75", "7.", "103", ".", "9"]) {
      expect(chuoiTuChuSoTre(chuSoTreTuChuoi(s))).toBe(s);
    }
  });

  it("bộ chấm hiểu đúng hàng đơn vị sau khi đảo", () => {
    const kq = chamBaiLam({ dang: "cot-doc", soA: 47, soB: 28, phep: "+", chuSoTre: chuSoTreTuChuoi("75") });
    expect(kq.dung).toBe(true);
    const sai = chamBaiLam({ dang: "cot-doc", soA: 47, soB: 28, phep: "+", chuSoTre: chuSoTreTuChuoi("65") });
    expect(sai.dung).toBe(false);
  });
});

function boMau(anh: NhanMotAnh[]): NhanBoAnh {
  return { moTa: "", nguoiGanNhan: "người thử", ganNhanLuc: "", anh };
}
function nhanCho(tep: string): NhanMotAnh {
  return { tep, loaiViec: "cham-bai-lam", dieuKienChup: "tot", nguoiDocDuoc: true, cacBai: [] };
}

describe("gộp nhãn", () => {
  it("gắn lại một ảnh thì THAY, không thêm bản thứ hai", () => {
    const bo = boMau([nhanCho("a.jpg"), nhanCho("b.jpg")]);
    const moi = { ...nhanCho("a.jpg"), ghiChu: "đã sửa" };
    const sau = gopNhanMotAnh(bo, moi);
    expect(sau.anh).toHaveLength(2);
    expect(sau.anh[0].ghiChu).toBe("đã sửa");
    expect(sau.anh[1].tep).toBe("b.jpg");
  });

  it("ảnh chưa có thì thêm vào cuối", () => {
    const sau = gopNhanMotAnh(boMau([nhanCho("a.jpg")]), nhanCho("c.jpg"));
    expect(sau.anh.map((a) => a.tep)).toEqual(["a.jpg", "c.jpg"]);
  });

  it("xóa nhãn thì chỉ mất đúng ảnh đó", () => {
    const sau = xoaNhanMotAnh(boMau([nhanCho("a.jpg"), nhanCho("b.jpg")]), "a.jpg");
    expect(sau.anh.map((a) => a.tep)).toEqual(["b.jpg"]);
  });
});

describe("tiến độ gắn nhãn", () => {
  it("đếm còn thiếu ảnh nào", () => {
    const t = tienDoGanNhan(boMau([nhanCho("a.jpg")]), ["a.jpg", "b.jpg", "c.jpg"]);
    expect(t.tongAnh).toBe(3);
    expect(t.daGanNhan).toBe(1);
    expect(t.conThieu).toEqual(["b.jpg", "c.jpg"]);
  });

  it("chỉ ra nhãn mồ côi — bộ đo sẽ dừng vì thiếu ảnh, biết trước thì đỡ tốn một lần chạy", () => {
    const t = tienDoGanNhan(boMau([nhanCho("da-xoa.jpg")]), ["a.jpg"]);
    expect(t.nhanMoCoi).toEqual(["da-xoa.jpg"]);
  });

  it("đếm độ phủ theo dạng, và nói rõ dạng nào còn trống", () => {
    const a = { ...nhanCho("a.jpg"), cacBai: [baiTrong("cot-doc"), baiTrong("cot-doc")] };
    const b = { ...nhanCho("b.jpg"), cacBai: [baiTrong("xem-gio")] };
    const t = tienDoGanNhan(boMau([a, b]), ["a.jpg", "b.jpg"]);
    expect(t.theoDang["cot-doc"]).toBe(2);
    expect(t.theoDang["xem-gio"]).toBe(1);
    expect(t.theoDang["bai-giai-loi-van"]).toBe(0);
    // Mọi dạng đều có mặt trong bảng đếm, kể cả dạng chưa có ví dụ nào.
    expect(Object.keys(t.theoDang).sort()).toEqual([...MOI_MA_DANG].sort());
  });
});

describe("ghi tệp nhãn", () => {
  let thuMuc: string;
  beforeEach(() => {
    thuMuc = mkdtempSync(join(tmpdir(), "oly-gan-nhan-"));
    (process.env as Record<string, string>).OLY_THU_MUC_ANH = thuMuc;
  });

  it("giữ lại bản trước khi ghi đè, vì tệp này là công sức gõ tay hàng trăm bài", async () => {
    await ghiNhan(boMau([nhanCho("a.jpg")]));
    await ghiNhan(boMau([nhanCho("a.jpg"), nhanCho("b.jpg")]));
    const truoc = JSON.parse(readFileSync(join(thuMuc, "nhan.json.truoc"), "utf8"));
    expect(truoc.anh).toHaveLength(1);
    const nay = JSON.parse(readFileSync(join(thuMuc, "nhan.json"), "utf8"));
    expect(nay.anh).toHaveLength(2);
  });

  it("đọc lại đúng thứ đã ghi", async () => {
    await ghiNhan(boMau([{ ...nhanCho("a.jpg"), ghiChu: "trang cong" }]));
    const bo = await docNhan();
    expect(bo.anh[0].ghiChu).toBe("trang cong");
  });

  it("chưa có tệp nhãn thì trả bộ rỗng, không ném lỗi", async () => {
    expect((await docNhan()).anh).toEqual([]);
  });

  it("tệp nhãn ĐANG GẮN DỞ vẫn đọc được, nhưng bộ đo phải từ chối nó", async () => {
    // Thêm ảnh rồi chưa kịp gõ bài nào là trạng thái bình thường lúc gắn nhãn.
    writeFileSync(
      join(thuMuc, "nhan.json"),
      JSON.stringify(boMau([nhanCho("a.jpg")])),
    );
    const bo = await docNhan();
    expect(bo.anh).toHaveLength(1);
    const { sanSangChayDo } = await import("@/lib/server/kho-anh-do");
    expect(sanSangChayDo(bo).duoc).toBe(false);
  });
});
