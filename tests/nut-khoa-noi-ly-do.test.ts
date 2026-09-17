import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Nút bị khóa phải nói VÌ SAO, ngay cạnh nút.
 *
 * Chuyện đã xảy ra thật ở luồng chụp: lý do có được in ra, nhưng nằm trong khối
 * chọn bạn ở đầu trang. Phụ huynh chọn ảnh xong thì cuộn xuống tận cuối để kéo
 * thanh che và bấm gửi — lúc ấy lời giải thích nằm cách hai màn hình phía trên,
 * ngoài tầm nhìn. Thứ họ thấy là một nút xám câm lặng.
 *
 * Một nút khóa mà không nói vì sao thì người dùng đọc thành "sản phẩm hỏng",
 * không đọc thành "còn thiếu một bước" — hai cách đọc dẫn tới hai hành động
 * khác hẳn: một bên bỏ đi, một bên làm nốt bước còn thiếu.
 *
 * Bài kiểm thử quét mã nguồn vì thứ hỏng là KHOẢNG CÁCH giữa hai phần tử trên
 * trang, không phải một giá trị trả về. Không có gì sai để mà bắt bằng cách gọi
 * hàm, và `npm run kiem-giao-dien` thì không đăng nhập vào cổng phụ huynh rồi
 * cuộn xuống cuối luồng chụp.
 */
const ma = readFileSync("src/app/phu-huynh/chup/LuongChup.tsx", "utf8");

/**
 * Bỏ chú thích trước khi quét.
 *
 * Bản đầu của bài "liệt kê MỌI việc còn thiếu" đỏ vì nó khớp trúng chính chú
 * thích giải thích — đoạn văn ấy có nhắc tên `noiGiVoiPhuHuynh` để nói vì sao
 * KHÔNG dùng hàm đó nữa. Một bài kiểm đọc cả lời giải thích thành mã thì nó
 * canh nhầm thứ.
 */
const khongChuThich = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("nút gửi ảnh bị khóa thì nói ngay tại chỗ vì sao", () => {
  it("có lời giải thích nằm SAU nút, không chỉ ở đầu trang", () => {
    const iNut = ma.indexOf('Tôi đã che xong, gửi đi');
    expect(iNut).toBeGreaterThan(-1);
    const sauNut = ma.slice(iNut, iNut + 2600);
    expect(sauNut).toMatch(/Chưa gửi đi được/);
    expect(sauNut).toMatch(/vuongGi\.map/);
  });

  it("kèm đường dẫn tới đúng chỗ gỡ vướng", () => {
    // Nói "chưa đủ điều kiện" mà không chỉ đường thì vẫn là ngõ cụt.
    const iNut = ma.indexOf('Tôi đã che xong, gửi đi');
    expect(ma.slice(iNut, iNut + 2600)).toMatch(/\/phu-huynh\/nguoi-giam-ho/);
  });

  it("hết lượt cũng nói, và nói rõ phần luyện tập không bị ảnh hưởng", () => {
    /**
     * Hết lượt chụp KHÔNG được đọc thành "hết lượt học". Hạn mức chỉ chạm vào
     * việc xử lý trang ảnh; lịch sử học và phần luyện tập giữ nguyên — cùng một
     * nguyên tắc với KHOA_LICH_SU_KHI_HET_HAN ở domain/thue-bao.ts.
     */
    const iNut = ma.indexOf('Tôi đã che xong, gửi đi');
    const sauNut = ma.slice(iNut, iNut + 2600);
    expect(sauNut).toMatch(/Hết lượt chụp rồi/);
    expect(sauNut).toMatch(/luyện tập của\s*\n?\s*con thì không giới hạn/);
  });

  it("liệt kê MỌI việc còn thiếu, không chỉ việc đầu tiên", () => {
    /**
     * Một hộ mới thiếu tới ba thứ cùng lúc: chưa có người đại diện, chưa bật
     * đồng ý cho mục đích này, và với bạn từ 7 tuổi thì còn cần chính con đồng ý
     * (CR-05). `noiGiVoiPhuHuynh` cố ý chỉ nêu thiếu[0] — hợp lý cho một dòng
     * nhắc ngắn, nhưng dùng ở đây thì phụ huynh làm xong việc đầu lại gặp một
     * ngõ cụt mới, rồi lại một cái nữa. Ba lần bế tắc thay vì một lần nhìn thấy
     * cả đường đi.
     */
    const trang = khongChuThich(readFileSync("src/app/phu-huynh/chup/page.tsx", "utf8"));
    expect(trang).toMatch(/\.thieu\.map\(\(t\) => NOI_GI_KHI_THIEU\[t\]\)/);
    expect(trang).not.toMatch(/noiGiVoiPhuHuynh/);
    // Và hiện ra dạng danh sách có thứ tự, vì đây là các bước làm lần lượt.
    expect(ma).toMatch(/list-decimal/);
  });

  it("ba điều kiện khóa nút đều có chỗ nói ra", () => {
    // dangXuLy tự nói bằng chữ trên nút ("Đang xử lý…"); hai điều kiện còn lại
    // phải có khối giải thích riêng.
    expect(ma).toMatch(/disabled=\{dangXuLy \|\| !daBat \|\| hetLuot\}/);
    expect(ma).toMatch(/\{!daBat && \(/);
    expect(ma).toMatch(/\{daBat && hetLuot && \(/);
  });
});
