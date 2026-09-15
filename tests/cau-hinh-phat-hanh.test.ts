import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MA_TRUC_MAC_DINH, choPhepDuLieuMau, laBanPhatHanh, maTruc, pinHoMau,
  thieuGiDeChayThat,
} from "@/lib/server/moi-truong";

process.env.OLY_DB = ":memory:";

/**
 * Canh những tiện nghi của bản phát triển không theo chân lên máy chủ.
 *
 * Bản dựng phát triển cố tình dễ tính: có sẵn hộ mẫu, PIN 1234, mã trực đoán
 * được. Trên một địa chỉ công khai thì đúng ba thứ đó là ba lỗ hổng — và chúng
 * thuộc loại không ai nhìn thấy khi đọc mã, vì mã chạy đúng như đã viết. Chỉ
 * bối cảnh đổi.
 */
const GOC = { ...process.env };

beforeEach(() => {
  for (const k of ["NODE_ENV", "OLY_MA_TRUC", "OLY_DU_LIEU_MAU", "OLY_PIN_MAU", "OLY_DB"]) {
    delete (process.env as Record<string, string | undefined>)[k];
  }
});
afterEach(() => {
  process.env = { ...GOC };
});

function datPhatHanh(): void {
  (process.env as Record<string, string>).NODE_ENV = "production";
}

describe("mã trực", () => {
  it("bản phát triển dùng mã mặc định cho tiện", () => {
    expect(laBanPhatHanh()).toBe(false);
    expect(maTruc()).toBe(MA_TRUC_MAC_DINH);
  });

  it("bản phát hành mà quên khai báo thì KHÓA HẲN, không rơi về mã mặc định", () => {
    datPhatHanh();
    expect(maTruc()).toBeNull();
    expect(maTruc()).not.toBe(MA_TRUC_MAC_DINH);
  });

  it("bản phát hành có khai báo thì dùng đúng mã đã khai", () => {
    datPhatHanh();
    process.env.OLY_MA_TRUC = "mot-ma-that-dai-va-kho-doan";
    expect(maTruc()).toBe("mot-ma-that-dai-va-kho-doan");
  });
});

describe("hộ mẫu", () => {
  it("bản phát triển luôn có hộ mẫu, PIN 1234, để mở ra là chạy được ngay", () => {
    expect(choPhepDuLieuMau()).toBe(true);
    expect(pinHoMau()).toBe("1234");
  });

  it("bản phát hành KHÔNG tự dựng hộ mẫu", () => {
    datPhatHanh();
    expect(choPhepDuLieuMau()).toBe(false);
  });

  it("bật hộ mẫu ở bản phát hành thì phải tự đặt PIN, không có mặc định", () => {
    datPhatHanh();
    process.env.OLY_DU_LIEU_MAU = "true";
    expect(choPhepDuLieuMau()).toBe(true);
    expect(pinHoMau()).toBeNull();

    process.env.OLY_PIN_MAU = "918273";
    expect(pinHoMau()).toBe("918273");
  });

  it("PIN mẫu phải là 4 tới 8 chữ số, không nhận thứ khác", () => {
    datPhatHanh();
    for (const xau of ["123", "123456789", "abcd", "12 34", ""]) {
      process.env.OLY_PIN_MAU = xau;
      expect(pinHoMau(), xau).toBeNull();
    }
  });

  it("PIN 1234 KHÔNG bao giờ là giá trị mặc định ở bản phát hành", () => {
    datPhatHanh();
    process.env.OLY_DU_LIEU_MAU = "true";
    expect(pinHoMau()).not.toBe("1234");
  });
});

describe("bảng kiểm trước khi chạy thật", () => {
  it("bản phát triển không đòi khai báo gì", () => {
    expect(thieuGiDeChayThat()).toEqual([]);
  });

  it("bản phát hành thiếu mã trực và chỗ để cơ sở dữ liệu thì nói ra cả hai", () => {
    datPhatHanh();
    const thieu = thieuGiDeChayThat().map((t) => t.bien);
    expect(thieu).toContain("OLY_MA_TRUC");
    expect(thieu).toContain("OLY_DB");
  });

  it("mỗi thứ thiếu phải nói được hậu quả, không chỉ nêu tên biến", () => {
    datPhatHanh();
    for (const t of thieuGiDeChayThat()) {
      expect(t.viSao.length, t.bien).toBeGreaterThan(50);
    }
  });

  it("khai đủ thì bảng kiểm sạch", () => {
    datPhatHanh();
    process.env.OLY_MA_TRUC = "ma-that";
    process.env.OLY_DB = "/du-lieu/oly.sqlite";
    expect(thieuGiDeChayThat()).toEqual([]);
  });

  it("bật hộ mẫu mà quên PIN thì bảng kiểm bắt được", () => {
    datPhatHanh();
    process.env.OLY_MA_TRUC = "ma-that";
    process.env.OLY_DB = "/du-lieu/oly.sqlite";
    process.env.OLY_DU_LIEU_MAU = "true";
    expect(thieuGiDeChayThat().map((t) => t.bien)).toContain("OLY_PIN_MAU");
  });
});
