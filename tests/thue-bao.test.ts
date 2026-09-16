import { describe, expect, it } from "vitest";
import {
  KHOA_LICH_SU_KHI_HET_HAN, SO_NGAY_BAO_TRUOC_GIA_HAN, conDungDuocGi,
  duocTruTienGiaHan, huy, huyViecHuy, soNgayConLai, trangThai, type ThueBao,
} from "@/lib/domain/thue-bao";
import { kiemTraQuyen } from "@/lib/domain/metering";
import { NhaCungCapThanhToanGiaLap } from "@/lib/thanh-toan/gia-lap";

const MOC = new Date("2026-09-16T00:00:00Z");
const ngayToi = (n: number) => new Date(MOC.getTime() + n * 86_400_000);

const traPhi = (sua: Partial<ThueBao> = {}): ThueBao => ({
  goi: "vo-o-ly-do-thi",
  hetHanAt: ngayToi(30),
  tuDongGiaHan: false,
  daBamHuy: false,
  dangDungThu: false,
  ...sua,
});

describe("trạng thái thuê bao", () => {
  it("gói miễn phí luôn là miễn phí, không có hạn", () => {
    expect(trangThai({ ...traPhi(), goi: "vo-nhap", hetHanAt: null }, MOC)).toBe("mien-phi");
  });

  it("còn nhiều ngày thì đang chạy", () => {
    expect(trangThai(traPhi(), MOC)).toBe("dang-chay");
  });

  it("còn ít hơn kỳ báo trước thì là sắp hết hạn", () => {
    expect(trangThai(traPhi({ hetHanAt: ngayToi(SO_NGAY_BAO_TRUOC_GIA_HAN - 1) }), MOC))
      .toBe("sap-het-han");
  });

  it("quá hạn thì hết hạn", () => {
    expect(trangThai(traPhi({ hetHanAt: ngayToi(-1) }), MOC)).toBe("het-han");
  });

  it("đếm đúng số ngày còn lại", () => {
    expect(soNgayConLai(traPhi({ hetHanAt: ngayToi(12) }), MOC)).toBe(12);
    expect(soNgayConLai({ ...traPhi(), hetHanAt: null }, MOC)).toBeNull();
  });
});

/*
 * Điều 1 — hủy phải dễ như mua.
 *
 * Không kiểm được "số lần bấm" trong một bài kiểm thử đơn vị, nhưng kiểm được
 * điều làm cho việc hủy trở nên khó: hủy mà bị cắt dịch vụ ngay thì người ta
 * ngại bấm, và đó là một cửa ải không cần dựng hàng rào nào cũng có.
 */
describe("hủy", () => {
  it("hủy rồi vẫn dùng hết chu kỳ đã trả tiền", () => {
    const sau = huy(traPhi({ hetHanAt: ngayToi(20) }));
    expect(trangThai(sau, MOC)).toBe("da-huy-cho-het-chu-ky");
    expect(conDungDuocGi(trangThai(sau, MOC)).xuLyTrangAnh).toBe(true);
  });

  it("hủy thì tắt luôn trừ tiền định kỳ, không để sót", () => {
    expect(huy(traPhi({ tuDongGiaHan: true })).tuDongGiaHan).toBe(false);
  });

  it("đổi ý được khi chu kỳ chưa kết thúc", () => {
    const tb = huyViecHuy(huy(traPhi()));
    expect(trangThai(tb, MOC)).toBe("dang-chay");
  });
});

/*
 * Điều 2 — gia hạn tự động phải báo trước, và báo đủ sớm để kịp hủy.
 */
describe("trừ tiền gia hạn", () => {
  const hetHan = ngayToi(0);
  const dv = (sua: Partial<ThueBao> = {}, daBaoTruocLuc: Date | null = null) => ({
    thueBao: traPhi({ hetHanAt: hetHan, ...sua }),
    daBaoTruocLuc,
  });

  it("chưa bật trừ tiền định kỳ thì không được trừ", () => {
    expect(duocTruTienGiaHan(dv({ tuDongGiaHan: false }), MOC)).toBe("chua-bat-tu-dong-gia-han");
  });

  it("đã bấm hủy thì không được trừ, dù đã từng bật", () => {
    expect(duocTruTienGiaHan(dv({ tuDongGiaHan: true, daBamHuy: true }), MOC)).toBe("da-bam-huy");
  });

  it("chưa tới hạn thì chưa được trừ", () => {
    expect(duocTruTienGiaHan(dv({ tuDongGiaHan: true, hetHanAt: ngayToi(5) }), MOC))
      .toBe("chua-toi-han");
  });

  it("chưa gửi thông báo nào thì không được trừ", () => {
    expect(duocTruTienGiaHan(dv({ tuDongGiaHan: true }, null), MOC)).toBe("chua-bao-truoc-du-som");
  });

  /*
   * Bài quan trọng nhất của nhóm này.
   *
   * Gửi thư "ngày mai trừ tiền" rồi trừ thật thì về mặt chữ nghĩa là đã báo
   * trước. Nhưng nó không cho cơ hội thật để hủy, mà cơ hội thật mới là điều
   * luật bảo vệ người tiêu dùng nhắm tới. Báo muộn phải bị từ chối y như không
   * báo.
   */
  it("báo trước quá muộn thì bị từ chối y như chưa báo", () => {
    const muon = new Date(hetHan.getTime() - 1 * 86_400_000);
    expect(duocTruTienGiaHan(dv({ tuDongGiaHan: true }, muon), MOC)).toBe("chua-bao-truoc-du-som");
  });

  it("báo trước đủ sớm và đã tới hạn thì được trừ", () => {
    const dungHan = new Date(hetHan.getTime() - SO_NGAY_BAO_TRUOC_GIA_HAN * 86_400_000);
    expect(duocTruTienGiaHan(dv({ tuDongGiaHan: true }, dungHan), MOC)).toBeNull();
  });
});

/*
 * Điều 3 — hết hạn KHÔNG khóa lịch sử học của con.
 *
 * Đây là điều dễ bị bẻ nhất khi có áp lực doanh thu, vì khóa dữ liệu là cách
 * ép gia hạn hiệu quả nhất mà người ta nghĩ ra được. Nên nó có hằng số riêng,
 * và có bài kiểm thử chỉ đích danh hằng số đó.
 */
describe("hết hạn thì mất gì và giữ gì", () => {
  it("hằng số khóa lịch sử phải luôn là false", () => {
    expect(KHOA_LICH_SU_KHI_HET_HAN).toBe(false);
  });

  it("hết hạn chỉ dừng đúng một thứ: xử lý trang ảnh", () => {
    const con = conDungDuocGi("het-han");
    expect(con.xuLyTrangAnh).toBe(false);
    expect(con.luyenTapCuaCon).toBe(true);
    expect(con.lichSuHocCuaCon).toBe(true);
    expect(con.banTinToi).toBe(true);
    expect(con.xuatDuLieu).toBe(true);
  });

  it("mọi trạng thái khác đều không khóa gì cả", () => {
    for (const tt of ["mien-phi", "dung-thu", "dang-chay", "sap-het-han", "da-huy-cho-het-chu-ky"] as const) {
      expect(Object.values(conDungDuocGi(tt)).every(Boolean), tt).toBe(true);
    }
  });

  it("khớp với phần đếm lượt: hết hạn chỉ chặn xử lý trang ảnh", () => {
    const q = kiemTraQuyen("xu-ly-trang-anh", {
      goi: "vo-o-ly-do-thi", hetHan: true, daDung: { homNay: 0, thangNay: 0 },
    });
    expect(q.duocPhep).toBe(false);
    expect(q.lyDo).toMatch(/lịch sử học của con vẫn xem được/);
  });
});

/*
 * Điều 4 — không tự trừ tiền sau khi dùng thử.
 */
describe("dùng thử", () => {
  it("mặc định KHÔNG bật trừ tiền định kỳ", () => {
    expect(traPhi().tuDongGiaHan).toBe(false);
  });

  it("hết kỳ dùng thử mà chưa ai bật trừ tiền thì không được trừ", () => {
    const tb = traPhi({ dangDungThu: true, hetHanAt: ngayToi(0) });
    expect(duocTruTienGiaHan({ thueBao: tb, daBaoTruocLuc: ngayToi(-30) }, MOC))
      .toBe("chua-bat-tu-dong-gia-han");
  });
});

describe("cổng thanh toán giả lập phải tự nhận là giả lập", () => {
  it("mọi kết quả đều mang dấu laGiaLap", async () => {
    const ncc = new NhaCungCapThanhToanGiaLap();
    const kq = await ncc.thu({
      householdId: "h", goi: "vo-o-ly-do-thi", soTien: 79_000, chapNhanTuDongGiaHan: false,
    });
    expect(kq.laGiaLap).toBe(true);
    expect(kq.ok && kq.maGiaoDich).toMatch(/^gia-lap-/);
  });

  it("dừng trừ tiền định kỳ được gọi tách khỏi việc hủy trong cơ sở dữ liệu", async () => {
    const ncc = new NhaCungCapThanhToanGiaLap();
    await ncc.dungTruTienDinhKy("h1");
    expect(ncc.daDung).toEqual(["h1"]);
  });
});
