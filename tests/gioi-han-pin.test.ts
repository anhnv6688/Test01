import { describe, expect, it } from "vitest";
import {
  CHO_DAU_MS, CHO_TOI_DA_MS, KHOA_BAO_LAU_MS, SAI_TRUOC_KHI_CHO, SAI_TRUOC_KHI_KHOA,
  hetHanKhoa, loiChoDoi, quyetDinhThuPin, type LanThuPin,
} from "@/lib/server/gioi-han-pin";

const T = 1_700_000_000_000;
const lan = (soLanSai: number, saiLuc: number | null = T): LanThuPin => ({ soLanSai, saiLuc });

describe("giới hạn số lần thử mã PIN", () => {
  it("chưa sai lần nào thì cho thử ngay", () => {
    expect(quyetDinhThuPin(lan(0, null), T)).toEqual({ choPhep: true });
  });

  it("gõ nhầm một hai lần không bị phạt gì", () => {
    // Phụ huynh gõ nhầm là chuyện thường ngày. Phạt ngay từ lần đầu là biến một
    // rào chắn chống trẻ con thành một rào chắn chống chính người dùng.
    for (let i = 1; i < SAI_TRUOC_KHI_CHO; i++) {
      expect(quyetDinhThuPin(lan(i), T + 1), `sai ${i} lần`).toEqual({ choPhep: true });
    }
  });

  it("từ lần sai thứ ba thì phải chờ, và chờ gấp đôi mỗi lần", () => {
    const cho = (soLan: number) => {
      const qd = quyetDinhThuPin(lan(soLan), T);
      if (qd.choPhep) throw new Error(`sai ${soLan} lần mà vẫn cho thử ngay`);
      return qd.conLaiMs;
    };
    expect(cho(3)).toBe(CHO_DAU_MS);
    expect(cho(4)).toBe(CHO_DAU_MS * 2);
    expect(cho(5)).toBe(CHO_DAU_MS * 4);
  });

  it("thời gian chờ có trần, không tăng vô hạn", () => {
    const qd = quyetDinhThuPin(lan(SAI_TRUOC_KHI_KHOA - 1), T);
    expect(qd.choPhep).toBe(false);
    if (!qd.choPhep) expect(qd.conLaiMs).toBeLessThanOrEqual(CHO_TOI_DA_MS);
  });

  it("chờ xong thì được thử tiếp", () => {
    expect(quyetDinhThuPin(lan(3), T + CHO_DAU_MS)).toEqual({ choPhep: true });
  });

  it("sai mười lần thì khóa mười lăm phút", () => {
    const qd = quyetDinhThuPin(lan(SAI_TRUOC_KHI_KHOA), T + 1);
    expect(qd.choPhep).toBe(false);
    if (!qd.choPhep) {
      expect(qd.lyDo).toBe("khoa");
      expect(qd.conLaiMs).toBeCloseTo(KHOA_BAO_LAU_MS, -3);
    }
  });

  it("hết hạn khóa thì đếm LẠI TỪ ĐẦU, không khóa tiếp ngay", () => {
    /**
     * Giữ nguyên bộ đếm sau khi hết khóa thì lần thử thứ mười một bị khóa ngay
     * lập tức, rồi lần mười hai cũng vậy — hộ bị khóa vĩnh viễn sau một buổi
     * tối gõ nhầm, và không có đường nào thoát ra ngoài việc gọi cho đội vận
     * hành. Một hình phạt không bao giờ nguôi là lỗi thiết kế, không phải một
     * lớp bảo vệ chặt hơn.
     */
    const sau = T + KHOA_BAO_LAU_MS;
    expect(quyetDinhThuPin(lan(SAI_TRUOC_KHI_KHOA), sau)).toEqual({ choPhep: true });
    expect(hetHanKhoa(lan(SAI_TRUOC_KHI_KHOA), sau)).toBe(true);
    expect(hetHanKhoa(lan(SAI_TRUOC_KHI_KHOA), sau - 1)).toBe(false);
    expect(hetHanKhoa(lan(3), sau)).toBe(false);
  });

  it("dò hết 10.000 mã mất khoảng mười hai ngày, không phải bốn phút", () => {
    /**
     * Bài kiểm thử này nói ra LÝ DO cả tệp kia tồn tại, nên nó TÍNH con số ra
     * chứ không tin vào cảm giác "chắc đủ chậm rồi".
     *
     * Không có giới hạn: vài chục lần thử mỗi giây, 10.000 khả năng — chừng bốn
     * phút. Có giới hạn: ~12 ngày quét hết, tức trung bình ~6 ngày để trúng.
     *
     * Mười hai ngày KHÔNG phải "không thể phá". Nói thẳng ra thay vì viết một
     * con số nghe oai, vì con số nghe oai là thứ người sau sẽ dựa vào:
     *
     *   - Nó đủ cho thứ rào này sinh ra để chặn: một đứa trẻ bảy tuổi mượn điện
     *     thoại của mẹ, và một máy quét tự động lướt qua Internet. Cả hai đều
     *     không đợi mười hai ngày.
     *   - Nó KHÔNG đủ trước một người nhắm đúng vào một hộ và chịu chờ. Phần đó
     *     thuộc về xác thực tài khoản thật, cùng với CR-05 — xem chú thích ở
     *     src/lib/server/cong-phu-huynh.ts.
     *   - Và mười hai ngày đăng nhập hỏng liên tục thì rất dễ thấy, nếu có ai
     *     nhìn. Hiện chưa có cảnh báo nào; đó là việc còn thiếu, không phải việc
     *     đã xong.
     */
    let ms = 0;
    for (let sai = 1; sai <= 10_000; sai++) {
      if (sai >= SAI_TRUOC_KHI_KHOA && sai % SAI_TRUOC_KHI_KHOA === 0) ms += KHOA_BAO_LAU_MS;
      else if (sai >= SAI_TRUOC_KHI_CHO) {
        ms += Math.min(CHO_TOI_DA_MS, CHO_DAU_MS * 2 ** (sai - SAI_TRUOC_KHI_CHO));
      }
    }
    const ngay = ms / 86_400_000;
    expect(ngay).toBeGreaterThan(7);
    // Không có giới hạn thì cùng số lần thử ấy chỉ mất mấy phút — ghi lại ở đây
    // để lần sau ai nới lỏng mấy hằng số kia thì thấy ngay mình đang đánh đổi gì.
    expect(ngay).toBeLessThan(30);
  });

  it("lời nhắn không mách cho người dò mã biết còn mấy lần nữa", () => {
    // "Còn 3 lần nữa là khóa" hữu ích cho người dò mã hơn là cho người quên mã:
    // nó cho biết chính xác khi nào nên dừng lại rồi đổi cách.
    const qd = quyetDinhThuPin(lan(4), T);
    expect(qd.choPhep).toBe(false);
    if (!qd.choPhep) {
      const loi = loiChoDoi(qd);
      expect(loi).toMatch(/giây/);
      expect(loi).not.toMatch(/còn|lần nữa|\d+\s*\/\s*\d+/i);
    }
  });

  it("lời nhắn lúc bị khóa nói bằng phút, không nói 900 giây", () => {
    const qd = quyetDinhThuPin(lan(SAI_TRUOC_KHI_KHOA), T);
    expect(qd.choPhep).toBe(false);
    if (!qd.choPhep) expect(loiChoDoi(qd)).toMatch(/15 phút/);
  });
});
