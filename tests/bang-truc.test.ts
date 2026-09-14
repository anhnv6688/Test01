import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TY_LE_BAO_SOM, thongKeTuanThu, tinhTrangHan, xepTheoMucKhan,
} from "@/lib/domain/han-xu-ly";

const GIO = 3_600_000;
const NGAY = 24 * GIO;
const MOC = new Date("2026-09-14T09:00:00Z").getTime();
const iso = (ms: number) => new Date(ms).toISOString();

describe("tính trạng thái hạn (BR-39)", () => {
  it("còn nhiều thời gian thì bình thường", () => {
    const t = tinhTrangHan(iso(MOC), iso(MOC + 10 * NGAY), false, MOC);
    expect(t.mucKhan).toBe("con-han");
    expect(t.moTa).toContain("còn");
  });

  it("còn dưới một phần tư thời gian thì báo sắp hết hạn", () => {
    const tong = 10 * NGAY;
    const t = tinhTrangHan(iso(MOC - tong * (1 - TY_LE_BAO_SOM) - GIO), iso(MOC + tong * TY_LE_BAO_SOM - GIO), false, MOC);
    expect(t.mucKhan).toBe("sap-het-han");
  });

  it("quá hạn thì nói rõ quá bao lâu, không nói mơ hồ", () => {
    const t = tinhTrangHan(iso(MOC - 2 * NGAY), iso(MOC - 3 * GIO), false, MOC);
    expect(t.mucKhan).toBe("qua-han");
    expect(t.moTa).toContain("QUÁ HẠN");
    expect(t.moTa).toContain("3 giờ");
  });

  it("đã xong thì không còn khẩn nữa, kể cả khi đã quá hạn", () => {
    expect(tinhTrangHan(iso(MOC - 5 * NGAY), iso(MOC - NGAY), true, MOC).mucKhan).toBe("da-xong");
  });

  it("ngưỡng báo sớm tính theo TỶ LỆ, nên hợp với cả hạn 24 giờ lẫn hạn 10 ngày", () => {
    // Yêu cầu gỡ bỏ có 24 giờ: còn 5 giờ là sắp hết.
    const goBo = tinhTrangHan(iso(MOC - 19 * GIO), iso(MOC + 5 * GIO), false, MOC);
    expect(goBo.mucKhan).toBe("sap-het-han");
    // Yêu cầu xem dữ liệu có 10 ngày: còn 5 giờ cũng là sắp hết, nhưng còn 5
    // NGÀY thì vẫn bình thường — một ngưỡng cố định tính bằng giờ sẽ sai một
    // trong hai trường hợp này.
    const xemDuLieu = tinhTrangHan(iso(MOC - 5 * NGAY), iso(MOC + 5 * NGAY), false, MOC);
    expect(xemDuLieu.mucKhan).toBe("con-han");
  });
});

describe("thứ tự xử lý theo mức khẩn, không theo thứ tự nhận", () => {
  it("yêu cầu nhận sau nhưng hạn gấp phải đứng trước", () => {
    // Nhận trước, hạn 10 ngày.
    const xemDuLieu = { ten: "xem", t: tinhTrangHan(iso(MOC - NGAY), iso(MOC + 9 * NGAY), false, MOC) };
    // Nhận sau, hạn 24 giờ.
    const goBo = { ten: "go-bo", t: tinhTrangHan(iso(MOC - GIO), iso(MOC + 23 * GIO), false, MOC) };
    const xep = xepTheoMucKhan([xemDuLieu, goBo], (x) => x.t);
    expect(xep[0].ten).toBe("go-bo");
  });

  it("quá hạn luôn lên đầu, việc đã xong xuống cuối", () => {
    const ds = [
      { ten: "xong", t: tinhTrangHan(iso(MOC - NGAY), iso(MOC - GIO), true, MOC) },
      { ten: "con-han", t: tinhTrangHan(iso(MOC), iso(MOC + 9 * NGAY), false, MOC) },
      { ten: "qua-han", t: tinhTrangHan(iso(MOC - 3 * NGAY), iso(MOC - GIO), false, MOC) },
    ];
    expect(xepTheoMucKhan(ds, (x) => x.t).map((x) => x.ten)).toEqual(["qua-han", "con-han", "xong"]);
  });
});

describe("thống kê tuân thủ — bằng chứng khi bị kiểm tra (BO-05)", () => {
  const muc = (daXong: boolean, dungHan: boolean | null, quaHan = false) => ({
    daXong,
    dungHan,
    tinhTrang: tinhTrangHan(iso(MOC - NGAY), iso(MOC + (quaHan ? -GIO : GIO)), daXong, MOC),
  });

  it("đếm cả phần xử lý quá hạn, không giấu đi", () => {
    const tk = thongKeTuanThu([muc(true, true), muc(true, false), muc(true, true)]);
    expect(tk.daXuLyDungHan).toBe(2);
    expect(tk.daXuLyQuaHan).toBe(1);
    expect(tk.tyLeDungHan).toBeCloseTo(2 / 3);
  });

  it("đếm riêng phần đang chờ mà đã quá hạn — đây là phần cần làm ngay", () => {
    const tk = thongKeTuanThu([muc(false, null, true), muc(false, null), muc(true, true)]);
    expect(tk.dangCho).toBe(2);
    expect(tk.quaHanDangCho).toBe(1);
  });

  it("chưa xử lý cái nào thì không bịa ra tỷ lệ đẹp", () => {
    expect(thongKeTuanThu([muc(false, null)]).tyLeDungHan).toBeNull();
  });
});

/**
 * Bảng trực là bề mặt THỨ BA, tách khỏi cả bề mặt trẻ lẫn bề mặt phụ huynh.
 * Nó nhìn thấy yêu cầu của MỌI hộ, nên một đường đi nhầm từ hai bề mặt kia
 * sang đây là một đường để phụ huynh nhìn sang dữ liệu nhà khác.
 */
function tatCaTep(thuMuc: string): string[] {
  const ra: string[] = [];
  for (const ten of readdirSync(thuMuc)) {
    const d = join(thuMuc, ten);
    if (statSync(d).isDirectory()) ra.push(...tatCaTep(d));
    else if (/\.tsx?$/.test(ten)) ra.push(d);
  }
  return ra;
}

describe("bảng trực tách khỏi hai bề mặt kia", () => {
  it("bề mặt trẻ không có đường nào dẫn sang bảng trực", () => {
    for (const tep of tatCaTep("src/app/be")) {
      expect(readFileSync(tep, "utf-8"), tep).not.toContain("/truc");
    }
  });

  it("bề mặt phụ huynh không có đường nào dẫn sang bảng trực", () => {
    for (const tep of tatCaTep("src/app/phu-huynh")) {
      expect(readFileSync(tep, "utf-8"), tep).not.toContain('"/truc"');
    }
  });

  it("bảng trực có cổng riêng, không dùng chung cổng với phụ huynh", () => {
    const trang = readFileSync("src/app/truc/page.tsx", "utf-8");
    expect(trang).toContain("daMoCongTruc");
    expect(trang).not.toContain("daMoCong(");
    const cong = readFileSync("src/lib/server/cong-truc.ts", "utf-8");
    const congPh = readFileSync("src/lib/server/cong-phu-huynh.ts", "utf-8");
    // Hai cổng phải dùng hai tên cookie khác nhau.
    expect(cong).toContain("oly_cong_truc");
    expect(congPh).toContain("oly_cong_phu_huynh");
  });

  it("mọi hành động của người trực đều ghi nhật ký kèm tên người làm (CR-06)", () => {
    const act = readFileSync("src/app/truc/actions.ts", "utf-8");
    // Đếm số hành động đổi trạng thái và số lần ghi nhật ký: phải khớp nhau.
    const doiTrangThai = (act.match(/doiTrangThai\w+\(/g) ?? []).length;
    const ghi = (act.match(/ghiNhatKy\(/g) ?? []).length;
    expect(ghi).toBeGreaterThanOrEqual(doiTrangThai - 1);
    expect(act).toContain("nguoiTruc: phien.nguoiTruc");
  });
});
