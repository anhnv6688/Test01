import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MA_TRUC_MAC_DINH, choPhepDuLieuMau, laBanPhatHanh, maTruc, moiTruong,
  goiYPinHoMau, noiDungRobots, pinHoMau, thieuGiDeChayThat,
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
  for (const k of [
    "NODE_ENV", "OLY_MA_TRUC", "OLY_DU_LIEU_MAU", "OLY_PIN_MAU", "OLY_DB", "OLY_MOI_TRUONG",
  ]) {
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

    process.env.OLY_PIN_MAU = "9182";
    expect(pinHoMau()).toBe("9182");
  });

  it("PIN mẫu phải là ĐÚNG bốn chữ số — vì đó là thứ duy nhất gõ được", () => {
    /**
     * Bản đầu nhận 4–8 chữ số, và đó là một cái bẫy im lặng.
     *
     * Ô nhập duy nhất dẫn vào phần của bố mẹ (CongPin.tsx) có maxLength={4} và
     * nhãn "Mã PIN bốn số". Một mã sáu số được cấu hình chấp nhận, được ghi vào
     * cơ sở dữ liệu, hộ mẫu dựng lên bình thường — rồi không ai gõ nổi nó vào,
     * vì trình duyệt cắt ở ký tự thứ tư. Máy chủ chỉ thấy bốn số đầu và trả về
     * "Mã PIN chưa đúng", đúng một câu, lặp lại mãi.
     *
     * Đã xảy ra thật trên bản thử: chay-anh.sh sinh PIN sáu số và không ai vào
     * được phần của bố mẹ. Một dải giá trị "hợp lệ mà vô dụng" thì thà từ chối.
     */
    datPhatHanh();
    for (const xau of ["123", "12345", "123456", "123456789", "abcd", "12 34", ""]) {
      process.env.OLY_PIN_MAU = xau;
      expect(pinHoMau(), xau).toBeNull();
    }
  });

  it("gợi ý dưới ô PIN không nói 1234 ở bản phát hành, và không in mã thật", () => {
    /**
     * Câu gợi ý từng được viết cứng trong giao diện: "Bản dựng thử nghiệm dùng
     * sẵn mã 1234." Không kèm điều kiện nào, nên nó theo lên máy chủ thật, nơi
     * nó sai — người đọc gõ 1234, bị từ chối, và kết luận sản phẩm hỏng.
     *
     * Và không bao giờ in mã thật ra trang này: trang công khai, in mã hộ mẫu
     * lên đó thì lớp khóa còn lại đúng bằng không.
     */
    expect(goiYPinHoMau()).toMatch(/1234/); // bản phát triển: đúng sự thật

    datPhatHanh();
    process.env.OLY_DU_LIEU_MAU = "true";
    process.env.OLY_PIN_MAU = "8391";
    const goiY = goiYPinHoMau();
    expect(goiY).not.toMatch(/1234/);
    expect(goiY).not.toMatch(/8391/);

    // Không có hộ mẫu thì không gợi ý gì cả.
    delete (process.env as Record<string, string | undefined>).OLY_DU_LIEU_MAU;
    expect(goiYPinHoMau()).toBeNull();
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

describe("phân biệt bản thử với bản thật", () => {
  it("máy người viết mã là bản phát triển", () => {
    expect(moiTruong()).toBe("phat-trien");
  });

  it("khai rõ thì theo khai", () => {
    datPhatHanh();
    process.env.OLY_MOI_TRUONG = "thu";
    expect(moiTruong()).toBe("thu");
    process.env.OLY_MOI_TRUONG = "that";
    expect(moiTruong()).toBe("that");
  });

  /*
   * Đoán nhầm theo hướng "thật" thì hậu quả là chặt hơn cần thiết: máy tìm kiếm
   * không vào, cảnh báo kêu. Đoán nhầm theo hướng "thử" thì những nới lỏng dành
   * cho bản thử sẽ áp lên dữ liệu của trẻ thật. Nên phải nghiêng về "thật".
   */
  it("bản phát hành quên khai thì coi là THẬT, không coi là thử", () => {
    datPhatHanh();
    expect(moiTruong()).toBe("that");
  });

  it("khai bậy thì cũng coi là thật", () => {
    datPhatHanh();
    process.env.OLY_MOI_TRUONG = "staging";
    expect(moiTruong()).toBe("that");
  });
});

describe("robots.txt theo môi trường", () => {
  it("bản thử chặn toàn bộ — trang thử không được nằm trên máy tìm kiếm", () => {
    expect(noiDungRobots("thu")).toMatch(/^Disallow: \/$/m);
  });

  it("bản phát triển cũng chặn toàn bộ", () => {
    expect(noiDungRobots("phat-trien")).toMatch(/^Disallow: \/$/m);
  });

  it("bản thật chặn bề mặt trẻ, bề mặt phụ huynh, bảng trực và tuyến xử lý", () => {
    const r = noiDungRobots("that");
    for (const d of ["/be", "/phu-huynh", "/truc", "/api"]) {
      expect(r, d).toContain(`Disallow: ${d}`);
    }
  });

  it("bản thật vẫn mở trang giới thiệu và các trang minh bạch", () => {
    const r = noiDungRobots("that");
    expect(r).toContain("Allow: /$");
    expect(r).toContain("Allow: /cach-cham-bai");
    expect(r).toContain("Allow: /go-bo-noi-dung");
  });
});
