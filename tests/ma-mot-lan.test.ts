import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  CHO_GIUA_HAI_LAN_GUI_GIAY, HAN_DUNG_PHUT, SO_CHU_SO, SO_LAN_SAI_TOI_DA,
  TRAN_GUI_MOI_GIO, bamMa, duocGuiKhong, khopMa, kiemMa, sinhMa,
  type BanGhiMa,
} from "@/lib/privacy/ma-mot-lan";
import {
  SoDienThoaiKhongHopLeError, cheSo, chuanHoaSo, haiSoCuoi,
} from "@/lib/privacy/so-dien-thoai";
import { PHUONG_THUC_BY_MA, canhBaoXacMinh, mucDatDuocQuaMaMotLan } from "@/lib/privacy/nguoi-giam-ho";
import { NhaCungCapSmsGiaLap } from "@/lib/sms/gia-lap";
import { soanTinNhan, type NhaCungCapSms } from "@/lib/sms/provider";

process.env.OLY_DB = ":memory:";

describe("chuẩn hóa số điện thoại", () => {
  it("mọi kiểu viết của cùng một thuê bao đều ra cùng một chuỗi", () => {
    for (const kieu of [
      "0912345678", "+84912345678", "84912345678",
      "091 234 5678", "091.234.5678", "091-234-5678", "(091) 234 5678",
    ]) {
      expect(chuanHoaSo(kieu), kieu).toBe("0912345678");
    }
  });

  it("nhận đủ các đầu số di động đang dùng", () => {
    for (const dau of ["03", "05", "07", "08", "09"]) {
      expect(chuanHoaSo(`${dau}12345678`)).toBe(`${dau}12345678`);
    }
  });

  it("từ chối số cố định, số thiếu chữ số, và chuỗi có chữ", () => {
    for (const xau of ["02412345678", "091234567", "09123456789", "0212345678", "abc0912345678"]) {
      expect(() => chuanHoaSo(xau), xau).toThrow(SoDienThoaiKhongHopLeError);
    }
  });

  it("chỉ giữ hai số cuối, và dạng che không lộ phần còn lại", () => {
    expect(haiSoCuoi("0912345678")).toBe("78");
    const che = cheSo("78");
    expect(che).toContain("78");
    expect(che).not.toContain("912345");
  });
});

describe("mã một lần được đối xử như một thông tin xác thực", () => {
  it("mã đủ số chữ số, kể cả khi bắt đầu bằng 0", () => {
    for (let i = 0; i < 400; i++) {
      const m = sinhMa();
      expect(m).toMatch(new RegExp(`^\\d{${SO_CHU_SO}}$`));
    }
  });

  it("mã không lặp lại một cách dễ đoán", () => {
    const da = new Set(Array.from({ length: 300 }, () => sinhMa()));
    expect(da.size).toBeGreaterThan(250);
  });

  it("bản băm không chứa mã, và hai lần băm cùng mã ra hai kết quả khác nhau", () => {
    const ma = "123456";
    const a = bamMa(ma);
    const b = bamMa(ma);
    expect(a.bam).not.toContain(ma);
    expect(a.muoi).not.toBe(b.muoi);
    expect(a.bam).not.toBe(b.bam);
  });

  it("khớp đúng mã, không khớp mã khác", () => {
    const daBam = bamMa("123456");
    expect(khopMa("123456", daBam)).toBe(true);
    expect(khopMa("123457", daBam)).toBe(false);
    expect(khopMa("", daBam)).toBe(false);
    expect(khopMa("1234567", daBam)).toBe(false);
  });
});

describe("chính sách dùng mã", () => {
  const moc = new Date("2026-09-14T10:00:00Z");
  const ban = (sua: Partial<BanGhiMa> = {}): BanGhiMa => ({
    daBam: bamMa("123456"),
    hetHanLuc: new Date(moc.getTime() + HAN_DUNG_PHUT * 60_000),
    soLanSai: 0,
    daDung: false,
    ...sua,
  });

  it("mã đúng thì qua", () => {
    expect(kiemMa(ban(), "123456", moc)).toEqual({ dung: true });
  });

  it("quá hạn thì hỏng, kể cả khi gõ đúng mã", () => {
    const sau = new Date(moc.getTime() + (HAN_DUNG_PHUT + 1) * 60_000);
    expect(kiemMa(ban(), "123456", sau)).toEqual({ dung: false, lyDo: "het-han" });
  });

  it("dùng rồi thì không dùng lại được", () => {
    expect(kiemMa(ban({ daDung: true }), "123456", moc)).toEqual({ dung: false, lyDo: "da-dung" });
  });

  it("sai quá số lần cho phép thì mã chết, dù sau đó gõ đúng", () => {
    const b = ban({ soLanSai: SO_LAN_SAI_TOI_DA });
    expect(kiemMa(b, "123456", moc)).toEqual({ dung: false, lyDo: "sai-qua-nhieu-lan" });
  });

  it("mã hết hạn không tốn một lần băm chậm — lý do không phụ thuộc mã được kiểm trước", () => {
    const sau = new Date(moc.getTime() + 60 * 60_000);
    // Dựng bản ghi TRƯỚC khi bấm giờ: chính bamMa trong đó cũng chạy scrypt.
    const b = ban({ daDung: true });
    const truoc = Date.now();
    kiemMa(b, "999999", sau);
    const nhanh = Date.now() - truoc;

    // Đối chứng: một lần kiểm có chạm tới scrypt thì chậm hơn hẳn.
    const bSong = ban();
    const truoc2 = Date.now();
    kiemMa(bSong, "999999", moc);
    expect(nhanh).toBeLessThan(Date.now() - truoc2);
  });
});

describe("chặn gửi dồn", () => {
  const moc = new Date("2026-09-14T10:00:00Z");
  const truoc = (giay: number) => new Date(moc.getTime() - giay * 1000);

  it("chưa gửi lần nào thì gửi được", () => {
    expect(duocGuiKhong({ lanGuiCuaHo: [], lanGuiToiSoMay: [] }, moc)).toBeNull();
  });

  it("vừa gửi xong thì phải chờ", () => {
    expect(
      duocGuiKhong({ lanGuiCuaHo: [truoc(10)], lanGuiToiSoMay: [truoc(10)] }, moc),
    ).toBe("vua-gui-xong");
  });

  it("hết thời gian chờ thì gửi lại được", () => {
    const vua = truoc(CHO_GIUA_HAI_LAN_GUI_GIAY + 1);
    expect(duocGuiKhong({ lanGuiCuaHo: [vua], lanGuiToiSoMay: [vua] }, moc)).toBeNull();
  });

  it("hộ xin quá nhiều lần trong một giờ thì bị chặn", () => {
    const ds = Array.from({ length: TRAN_GUI_MOI_GIO }, (_, i) => truoc(300 * (i + 1)));
    expect(duocGuiKhong({ lanGuiCuaHo: ds, lanGuiToiSoMay: [] }, moc)).toBe("gui-qua-nhieu-trong-gio");
  });

  /*
   * Bài này canh thứ mà giới hạn theo hộ không canh được: dùng Ô Ly làm công cụ
   * nhắn tin quấy rối một người ngoài. Kẻ muốn làm vậy chỉ cần lập nhiều tài
   * khoản là qua được giới hạn theo hộ — nhưng số máy nạn nhân thì vẫn là một.
   */
  it("số máy đã nhận đủ tin trong một giờ thì chặn, dù hộ này chưa gửi lần nào", () => {
    const ds = Array.from({ length: TRAN_GUI_MOI_GIO }, (_, i) => truoc(300 * (i + 1)));
    expect(duocGuiKhong({ lanGuiCuaHo: [], lanGuiToiSoMay: ds }, moc)).toBe("so-may-nhan-qua-nhieu");
  });

  it("các lần gửi cũ hơn một giờ không còn tính", () => {
    const cu = Array.from({ length: 20 }, () => truoc(3601));
    expect(duocGuiKhong({ lanGuiCuaHo: cu, lanGuiToiSoMay: cu }, moc)).toBeNull();
  });
});

describe("mức xác minh phải GIÀNH ĐƯỢC, không phải KHAI RA", () => {
  it("gửi bằng bản giả lập thì ghi mức giả lập, không ghi mức thật", () => {
    expect(mucDatDuocQuaMaMotLan(true)).toBe("otp-gia-lap");
    expect(mucDatDuocQuaMaMotLan(false)).toBe("otp-dien-thoai");
  });

  it("mức giả lập vẫn yếu nhất, nên lời cảnh báo không im", () => {
    expect(PHUONG_THUC_BY_MA.get("otp-gia-lap")?.doManh).toBe(1);
    const c = canhBaoXacMinh({
      householdId: "h", quanHe: "me", hoTen: "A", phuongThuc: "otp-gia-lap",
      haiSoCuoi: "78", xacMinhLuc: "2026-09-14T00:00:00Z",
      phienBanVanBan: "v1", tuXacNhanDaiDien: true,
    });
    expect(c).toMatch(/luật sư/);
  });

  it("chỉ mức đạt được bằng tin nhắn thật mới làm cảnh báo im", () => {
    const c = canhBaoXacMinh({
      householdId: "h", quanHe: "me", hoTen: "A", phuongThuc: "otp-dien-thoai",
      haiSoCuoi: "78", xacMinhLuc: "2026-09-14T00:00:00Z",
      phienBanVanBan: "v1", tuXacNhanDaiDien: true,
    });
    expect(c).toBeNull();
  });
});

describe("nội dung tin nhắn", () => {
  it("có mã, có hạn dùng, và nhắc không đọc mã cho ai", () => {
    const t = soanTinNhan("123456", HAN_DUNG_PHUT);
    expect(t).toContain("123456");
    expect(t).toContain(String(HAN_DUNG_PHUT));
    expect(t.toLowerCase()).toContain("khong bao gio goi dien hoi ma nay");
  });
});

/* ------------------------------------------------------------------ */

type Repo = typeof import("@/lib/server/repo");
type Otp = typeof import("@/lib/server/ma-mot-lan");
type Sms = typeof import("@/lib/sms/chon-nha-cung-cap");
let repo: Repo;
let otp: Otp;
let sms: Sms;
let hoId: string;
let gia: NhaCungCapSmsGiaLap;

beforeAll(async () => {
  const seed = await import("@/lib/server/seed");
  repo = await import("@/lib/server/repo");
  otp = await import("@/lib/server/ma-mot-lan");
  sms = await import("@/lib/sms/chon-nha-cung-cap");
  hoId = seed.moiDuLieu().householdId!;
});

beforeEach(async () => {
  gia = new NhaCungCapSmsGiaLap();
  sms.datNhaCungCapSms(gia);
  const { getDb } = await import("@/lib/server/db");
  getDb().prepare("DELETE FROM ma_mot_lan").run();
});

describe("luồng gửi và kiểm mã, chạy thật trên cơ sở dữ liệu", () => {
  it("gửi rồi nhập đúng mã thì qua, và mã chỉ dùng được một lần", async () => {
    const g = await otp.guiMa(hoId, "0912345678");
    expect(g.ok).toBe(true);
    if (!g.ok) return;
    expect(g.haiSoCuoi).toBe("78");
    const ma = g.maHienThi!;

    expect(otp.kiemMaCuaHo(hoId, ma)).toMatchObject({ ok: true, haiSoCuoi: "78" });
    expect(otp.kiemMaCuaHo(hoId, ma)).toMatchObject({ ok: false, lyDo: "da-dung" });
  });

  /*
   * Mã dưới dạng rõ chỉ được sống trong đúng một biến cục bộ của guiMa. Bài này
   * đọc thẳng cơ sở dữ liệu để chắc là nó không nằm lại ở đâu — đây là kiểu rò
   * rỉ chỉ cần một dòng mã là mở ra, và rất khó thấy khi đọc lướt.
   */
  it("không chỗ nào trong cơ sở dữ liệu chứa mã dưới dạng rõ", async () => {
    const g = await otp.guiMa(hoId, "0912345678");
    if (!g.ok) throw new Error("phải gửi được");
    const { getDb } = await import("@/lib/server/db");
    const dong = getDb().prepare("SELECT * FROM ma_mot_lan").all();
    expect(JSON.stringify(dong)).not.toContain(g.maHienThi!);
  });

  it("không chỗ nào trong cơ sở dữ liệu chứa số điện thoại dưới dạng rõ", async () => {
    await otp.guiMa(hoId, "0912345678");
    const { getDb } = await import("@/lib/server/db");
    const tat = JSON.stringify(getDb().prepare("SELECT * FROM ma_mot_lan").all());
    expect(tat).not.toContain("0912345678");
    expect(tat).not.toContain("91234567");
  });

  it("cùng một thuê bao viết kiểu khác vẫn ra cùng vân tay, nên không lách được phần đếm", () => {
    expect(otp.bamSoMay(chuanHoaSo("0912345678")))
      .toBe(otp.bamSoMay(chuanHoaSo("+84 912 345 678")));
  });

  it("nhập sai quá số lần cho phép thì mã chết, dù sau đó gõ đúng", async () => {
    const g = await otp.guiMa(hoId, "0912345678");
    if (!g.ok) throw new Error("phải gửi được");
    for (let i = 0; i < SO_LAN_SAI_TOI_DA; i++) {
      expect(otp.kiemMaCuaHo(hoId, "000000")).toMatchObject({ ok: false, lyDo: "sai-ma" });
    }
    expect(otp.kiemMaCuaHo(hoId, g.maHienThi!)).toMatchObject({
      ok: false, lyDo: "sai-qua-nhieu-lan",
    });
  });

  it("xin mã mới thì mã cũ chết ngay, không có hai mã cùng sống", async () => {
    const g1 = await otp.guiMa(hoId, "0912345678");
    if (!g1.ok) throw new Error("phải gửi được");
    // Lùi mốc để qua được thời gian chờ giữa hai lần gửi.
    const { getDb } = await import("@/lib/server/db");
    getDb().prepare("UPDATE ma_mot_lan SET tao_luc = ?").run(
      new Date(Date.now() - (CHO_GIUA_HAI_LAN_GUI_GIAY + 5) * 1000).toISOString(),
    );
    const g2 = await otp.guiMa(hoId, "0912345678");
    if (!g2.ok) throw new Error("phải gửi được lần hai");

    expect(otp.kiemMaCuaHo(hoId, g1.maHienThi!)).toMatchObject({ ok: false });
    expect(otp.kiemMaCuaHo(hoId, g2.maHienThi!)).toMatchObject({ ok: true });
  });

  it("chặn gửi dồn ngay lần thứ hai liên tiếp", async () => {
    await otp.guiMa(hoId, "0912345678");
    expect(await otp.guiMa(hoId, "0912345678")).toMatchObject({
      ok: false, lyDo: "vua-gui-xong",
    });
  });

  it("số sai định dạng thì nói rõ, và không gửi tin nào", async () => {
    const kq = await otp.guiMa(hoId, "0212345678");
    expect(kq.ok).toBe(false);
    expect(gia.daGui).toHaveLength(0);
  });

  it("chưa xin mã mà nhập thì nói rõ, không báo là sai mã", () => {
    expect(otp.kiemMaCuaHo(hoId, "123456")).toMatchObject({ ok: false, lyDo: "chua-xin-ma" });
  });

  it("gửi không thành công thì nói thẳng, và vô hiệu mã vừa sinh", async () => {
    const hong: NhaCungCapSms = {
      ten: "hỏng", laGiaLap: false,
      gui: async () => ({ ok: false, loi: "nhà mạng từ chối" }),
    };
    sms.datNhaCungCapSms(hong);
    expect(await otp.guiMa(hoId, "0912345678")).toMatchObject({ ok: false, lyDo: "gui-that-bai" });
    expect(otp.kiemMaCuaHo(hoId, "123456")).toMatchObject({ ok: false });
  });

  /*
   * Bài quan trọng nhất của tệp này.
   *
   * Với nhà cung cấp THẬT, mã tuyệt đối không được quay về máy khách. Chỉ cần
   * một dòng trả nó về cho tiện gỡ lỗi là toàn bộ lớp bảo vệ này thành trang
   * trí — ai cũng tự xác minh được số máy của người khác.
   */
  it("nhà cung cấp thật thì KHÔNG bao giờ trả mã về máy khách", async () => {
    const that: NhaCungCapSms = {
      ten: "giả vờ là thật", laGiaLap: false,
      gui: async () => ({ ok: true }),
    };
    sms.datNhaCungCapSms(that);
    const g = await otp.guiMa(hoId, "0912345678");
    expect(g.ok).toBe(true);
    if (!g.ok) return;
    expect(g.maHienThi).toBeNull();
    expect(JSON.stringify(g)).not.toMatch(/\d{6}/);
  });

  it("xác minh xong thì bản ghi người đại diện chỉ giữ hai số cuối", async () => {
    const g = await otp.guiMa(hoId, "0987654321");
    if (!g.ok) throw new Error("phải gửi được");
    const k = otp.kiemMaCuaHo(hoId, g.maHienThi!);
    expect(k.ok).toBe(true);
    if (!k.ok) return;

    repo.ghiNguoiGiamHo({
      householdId: hoId, quanHe: "me", hoTen: "Mẹ Bống",
      phuongThuc: mucDatDuocQuaMaMotLan(k.laGiaLap),
      tuXacNhanDaiDien: true, haiSoCuoi: k.haiSoCuoi,
    });
    const ng = repo.nguoiGiamHoHienTai(hoId)!;
    expect(ng.haiSoCuoi).toBe("21");
    // Chạy bằng bản giả lập nên KHÔNG được ghi là đã xác minh thật.
    expect(ng.phuongThuc).toBe("otp-gia-lap");
    expect(JSON.stringify(ng)).not.toContain("0987654321");
  });
});
