import { describe, expect, it } from "vitest";
import {
  CHI_PHI_MOI_TRANG_GIA_DINH, chiPhiTrungBinhMoiHo, kiemTraQuyen, tinhTran,
  type ChucNang, type LuotDung,
} from "@/lib/domain/metering";
import { GIOI_HAN_SO_CON_MOI_HO, GOI, TRAN_MIEN_PHI_TRANG_THANG, goiTraPhiTheoDiaBan } from "@/lib/domain/pricing";
import { congNgayLamViec, hanHoanThanh } from "@/lib/server/requests";

describe("chỉ chỗ phát sinh hóa đơn mới bị giới hạn (BR-19)", () => {
  const chucNangKhongTonPhi: ChucNang[] = ["luyen-tap", "xem-lich-su", "xem-ban-tin", "xuat-du-lieu"];

  it("luyện tập không bao giờ bị chặn, dù hết lượt hay hết hạn", () => {
    for (const cn of chucNangKhongTonPhi) {
      expect(kiemTraQuyen(cn, { goi: "vo-nhap", hetHan: true, daDungThangNay: 9999 }).duocPhep, cn).toBe(true);
    }
  });

  it("mọi gói đều cho luyện tập không giới hạn", () => {
    for (const g of Object.values(GOI)) {
      expect(g.luyenTapKhongGioiHan, g.ma).toBe(true);
    }
  });

  it("chỉ việc xử lý trang ảnh mới bị đếm lượt", () => {
    const chua = kiemTraQuyen("xu-ly-trang-anh", { goi: "vo-nhap", hetHan: false, daDungThangNay: 0 });
    const het = kiemTraQuyen("xu-ly-trang-anh", {
      goi: "vo-nhap", hetHan: false, daDungThangNay: TRAN_MIEN_PHI_TRANG_THANG,
    });
    expect(chua.duocPhep).toBe(true);
    expect(het.duocPhep).toBe(false);
  });
});

describe("lịch sử học không bao giờ bị khóa khi hết hạn (BR-09)", () => {
  it("hộ đã hết hạn vẫn xem được toàn bộ lịch sử và bản tin", () => {
    const ctx = { goi: "vo-o-ly-do-thi" as const, hetHan: true, daDungThangNay: 500 };
    expect(kiemTraQuyen("xem-lich-su", ctx).duocPhep).toBe(true);
    expect(kiemTraQuyen("xem-ban-tin", ctx).duocPhep).toBe(true);
    expect(kiemTraQuyen("xuat-du-lieu", ctx).duocPhep).toBe(true);
  });

  it("hết hạn thì chỉ tính năng chụp tạm dừng, và lời từ chối nói rõ điều đó", () => {
    const kq = kiemTraQuyen("xu-ly-trang-anh", {
      goi: "vo-o-ly-do-thi", hetHan: true, daDungThangNay: 0,
    });
    expect(kq.duocPhep).toBe(false);
    expect(kq.lyDo).toContain("lịch sử");
  });
});

describe("một thuê bao cho cả hộ (BR-11)", () => {
  it("không có giới hạn số con trong một thuê bao", () => {
    expect(GIOI_HAN_SO_CON_MOI_HO).toBeNull();
  });

  it("hai mức giá theo địa bàn, không theo số con", () => {
    expect(goiTraPhiTheoDiaBan("do-thi").giaThang).toBe(59000);
    expect(goiTraPhiTheoDiaBan("tinh").giaThang).toBe(39000);
  });
});

describe("theo dõi chi phí ở mức từng hộ (BR-22)", () => {
  it("tính đúng chi phí trung bình mỗi hộ", () => {
    const luot: LuotDung[] = Array.from({ length: 10 }, () => ({
      householdId: "h1", hanhVi: "xu-ly-trang-anh" as const,
      at: "2026-09-13T00:00:00Z", chiPhiUocTinh: CHI_PHI_MOI_TRANG_GIA_DINH,
    }));
    expect(chiPhiTrungBinhMoiHo(luot, 1)).toBe(10 * CHI_PHI_MOI_TRANG_GIA_DINH);
    expect(chiPhiTrungBinhMoiHo(luot, 2)).toBe(5 * CHI_PHI_MOI_TRANG_GIA_DINH);
    expect(chiPhiTrungBinhMoiHo([], 5)).toBe(0);
  });

  it("trần đếm đúng phần còn lại", () => {
    const t = tinhTran("vo-nhap", 1);
    expect(t.tran).toBe(TRAN_MIEN_PHI_TRANG_THANG);
    expect(t.conLai).toBe(TRAN_MIEN_PHI_TRANG_THANG - 1);
    expect(t.vuotTran).toBe(false);
  });

  it("không bao giờ báo số còn lại âm", () => {
    expect(tinhTran("vo-nhap", 999).conLai).toBe(0);
  });
});

describe("thời hạn xử lý yêu cầu của người dùng (BR-39)", () => {
  it("đếm ngày làm việc, bỏ qua thứ bảy và chủ nhật", () => {
    // 11/9/2026 là thứ sáu; cộng 2 ngày làm việc phải ra thứ ba 15/9.
    const thuSau = new Date("2026-09-11T09:00:00Z");
    expect(thuSau.getDay()).toBe(5);
    const han = congNgayLamViec(thuSau, 2);
    expect(han.getDay()).toBe(2);
    expect(han.toISOString().slice(0, 10)).toBe("2026-09-15");
  });

  it("yêu cầu rút đồng ý và xóa có hạn ngắn hơn hẳn yêu cầu xem", () => {
    const moc = new Date("2026-09-13T09:00:00Z");
    const rut = hanHoanThanh("rut-dong-y", moc).getTime() - moc.getTime();
    const xoa = hanHoanThanh("xoa", moc).getTime() - moc.getTime();
    const xem = hanHoanThanh("xem", moc).getTime() - moc.getTime();
    expect(rut).toBe(72 * 3600_000);
    expect(xoa).toBe(72 * 3600_000);
    expect(xem).toBeGreaterThan(rut);
  });
});
