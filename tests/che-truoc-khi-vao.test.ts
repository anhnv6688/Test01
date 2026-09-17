import { describe, expect, it } from "vitest";
import {
  MOI_CANH_CHE, TY_LE_CHE_MAC_DINH, giaiMaDuocKhong, laAnhVaoDuoc,
  phaiHoiCanh, quyetDinhChe, tenTepRa, vungCheTheoCanh,
} from "@/lib/do-anh/che-truoc-khi-vao";
import { VUNG_DAU_TRANG_MAC_DINH } from "@/lib/privacy/redaction";

describe("che ảnh trước khi vào bo-anh-do", () => {
  it("dùng ĐÚNG dải che của luồng phụ huynh, không có con số riêng", () => {
    /**
     * Đây là điều quan trọng nhất trong tệp này.
     *
     * Bộ đo tồn tại để trả lời "Ô Ly đọc được bao nhiêu phần trăm trang vở
     * thật". Câu trả lời ấy chỉ đúng nếu ảnh trong bộ đo bị che GIỐNG HỆT ảnh
     * phụ huynh gửi lên. Che rộng hơn thì báo cáo bi quan hơn thực tế; che hẹp
     * hơn thì báo cáo lạc quan hơn thực tế — và còn để lọt tên trẻ.
     *
     * Hai hằng số rời nhau sẽ lệch nhau, và lúc lệch thì không có gì báo: cả
     * hai bên vẫn chạy, báo cáo vẫn ra một con số trông hợp lý.
     */
    expect(TY_LE_CHE_MAC_DINH).toBe(VUNG_DAU_TRANG_MAC_DINH.h);
    expect(vungCheTheoCanh("tren")).toEqual(VUNG_DAU_TRANG_MAC_DINH);
  });

  it("mỗi cạnh cho một dải nằm sát đúng cạnh đó", () => {
    expect(vungCheTheoCanh("tren", 0.2)).toEqual({ x: 0, y: 0, w: 1, h: 0.2 });
    expect(vungCheTheoCanh("duoi", 0.2)).toEqual({ x: 0, y: 0.8, w: 1, h: 0.2 });
    expect(vungCheTheoCanh("trai", 0.2)).toEqual({ x: 0, y: 0, w: 0.2, h: 1 });
    expect(vungCheTheoCanh("phai", 0.2)).toEqual({ x: 0.8, y: 0, w: 0.2, h: 1 });
  });

  it("mọi cạnh đều phủ hết chiều còn lại của ảnh", () => {
    // Dải hụt một đoạn ở rìa là chỗ tên trẻ thò ra, và là kiểu sót khó thấy
    // nhất khi nhìn nhanh trang xem lại.
    for (const canh of MOI_CANH_CHE) {
      const v = vungCheTheoCanh(canh, 0.16);
      const ngang = canh === "tren" || canh === "duoi";
      expect(ngang ? v.w : v.h).toBe(1);
      expect(ngang ? v.x : v.y).toBe(0);
    }
  });

  it("ảnh dọc thì tự che cạnh trên", () => {
    const qd = quyetDinhChe({ ten: "a.jpg", rong: 1200, cao: 1600 }, null);
    expect(qd).toMatchObject({ che: true, canh: "tren" });
  });

  it("ảnh NẰM NGANG thì từ chối, không đoán", () => {
    /**
     * Trang vở khổ dọc. Ảnh nằm ngang nghĩa là điện thoại cầm ngang (điều kiện
     * `xoay-90`, gặp ngay ở lô ảnh thật đầu tiên) hoặc chụp cả hai trang mở ra.
     * Cả hai trường hợp, dải trên cùng đều KHÔNG phải chỗ có tên.
     *
     * Đoán bừa ở đây là tô đè một dải giấy trắng rồi báo "đã che" trong khi tên
     * trẻ còn nguyên trong ảnh. Một phép che báo xanh mà không che gì thì tệ
     * hơn hẳn không có phép che nào: nó tạo ra niềm tin sai, và niềm tin ấy đi
     * thẳng tới lệnh gửi ảnh ra nhà cung cấp.
     */
    expect(phaiHoiCanh(1600, 1200)).toBe(true);
    const qd = quyetDinhChe({ ten: "ngang.jpg", rong: 1600, cao: 1200 }, null);
    expect(qd.che).toBe(false);
    if (!qd.che) expect(qd.lyDo).toMatch(/--canh/);
  });

  it("ảnh nằm ngang có khai cạnh thì che theo cạnh đã khai", () => {
    const qd = quyetDinhChe({ ten: "ngang.jpg", rong: 1600, cao: 1200 }, "trai");
    expect(qd).toMatchObject({ che: true, canh: "trai" });
  });

  it("ảnh vuông vẫn che cạnh trên — không phải ảnh nằm ngang", () => {
    expect(phaiHoiCanh(1000, 1000)).toBe(false);
    expect(quyetDinhChe({ ten: "v.jpg", rong: 1000, cao: 1000 }, null).che).toBe(true);
  });

  it("không đọc được kích thước thì từ chối", () => {
    expect(quyetDinhChe({ ten: "x.jpg", rong: 0, cao: 0 }, null).che).toBe(false);
  });

  it("nói thẳng ra HEIC không giải mã được, không bỏ qua lặng lẽ", () => {
    // Ảnh iPhone mặc định là HEIC, mà Chromium không giải mã được. Một tệp bị
    // bỏ qua trong im lặng sẽ được hiểu là "đã che xong", rồi có người chép tay
    // nó vào thư mục.
    expect(giaiMaDuocKhong("IMG_1234.HEIC")).toBe(false);
    expect(giaiMaDuocKhong("IMG_1234.heif")).toBe(false);
    expect(giaiMaDuocKhong("IMG_1234.jpg")).toBe(true);
  });

  it("nhận đúng loại tệp ảnh, bỏ tệp ẩn", () => {
    expect(laAnhVaoDuoc("trang-1.jpg")).toBe(true);
    expect(laAnhVaoDuoc("trang-1.PNG")).toBe(true);
    expect(laAnhVaoDuoc(".DS_Store")).toBe(false);
    expect(laAnhVaoDuoc("nhan.json")).toBe(false);
  });

  it("tên tệp ra luôn là .jpg và không mang theo đường dẫn", () => {
    // Thư mục này được trang gắn nhãn đọc thẳng, nên một tên tệp mang theo
    // "../" là một đường đọc ra ngoài thư mục.
    expect(tenTepRa("IMG_0042.HEIC")).toBe("IMG_0042.jpg");
    expect(tenTepRa("../../etc/passwd")).toBe("passwd.jpg");
    expect(tenTepRa("C:\\Users\\Admin\\ảnh vở (1).png")).toBe("ảnh-vở-1.jpg");
    expect(tenTepRa("....")).toBe("anh.jpg");
  });

  it("giữ được chữ tiếng Việt trong tên tệp", () => {
    expect(tenTepRa("bài tập tuần 3.jpg")).toBe("bài-tập-tuần-3.jpg");
  });
});
