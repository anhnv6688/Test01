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
    // Canh Ý, không canh cách viết: phải dùng CẢ mảng `thieu`, và tuyệt đối
    // không quay lại `noiGiVoiPhuHuynh` — hàm ấy chỉ trả thiếu[0].
    expect(trang).toMatch(/\.thieu\.map\(/);
    expect(trang).not.toMatch(/noiGiVoiPhuHuynh/);
    // Và hiện ra dạng danh sách có thứ tự, vì đây là các bước làm lần lượt.
    expect(ma).toMatch(/list-decimal/);
  });

  it("xin đồng ý ĐÚNG MỘT mục đích, ngay tại chỗ tắc", () => {
    /**
     * Trước đây chỗ này chỉ nói "anh chị bật riêng trong mục Quyền riêng tư
     * nhé". Mục ấy có BỐN ô, mà việc phụ huynh đang làm chỉ cần MỘT. Không đoán
     * được ô nào thì người ta bật hết cho chắc — và bật hết "cho chắc" chính là
     * thứ mà đồng ý theo mục đích sinh ra để tránh: nó biến bốn quyết định
     * riêng thành một cái gật đầu.
     *
     * Xin đúng một mục đích vừa đỡ mất công hơn vừa là tuân thủ đúng hơn. Hiếm
     * khi hai thứ ấy cùng chiều; ở đây chúng cùng chiều.
     */
    expect(ma).toMatch(/const mucDichDangCan = loaiViec === "doc-de-bai"/);
    expect(ma).toMatch(/<XinDongY mucDich=\{mucDichDangCan\}/);
  });

  it("đồng ý tại chỗ vẫn là đồng ý CÓ HIỂU, không phải một nút trống", () => {
    // Rút gọn đường đi thì được, rút gọn thông tin thì không: vẫn nêu đủ việc
    // Ô Ly sẽ làm và thứ sẽ mất nếu không bật.
    const i = ma.indexOf("function XinDongY");
    expect(i).toBeGreaterThan(-1);
    const than = ma.slice(i, i + 1400);
    expect(than).toMatch(/moTa\.giaiThich/);
    expect(than).toMatch(/moTa\.matGi/);
    // Và không có ô đánh dấu sẵn (CR-04) — phụ huynh phải tự bấm.
    expect(than).not.toMatch(/defaultChecked/);
  });

  it("bật đồng ý xong thì trang chụp vẽ lại, không để nút xám tiếp", () => {
    // Bấm đồng ý mà nút vẫn xám thì phụ huynh tưởng nút hỏng — đúng cái vòng
    // bế tắc vừa gỡ ra.
    const act = readFileSync("src/app/phu-huynh/actions.ts", "utf8");
    const i = act.indexOf("export async function hanhDongDoiDongY");
    expect(act.slice(i, i + 700)).toMatch(/revalidatePath\("\/phu-huynh\/chup"\)/);
  });

  it("ba điều kiện khóa nút đều có chỗ nói ra", () => {
    // dangXuLy tự nói bằng chữ trên nút ("Đang xử lý…"); hai điều kiện còn lại
    // phải có khối giải thích riêng.
    expect(ma).toMatch(/disabled=\{dangXuLy \|\| !daBat \|\| hetLuot\}/);
    expect(ma).toMatch(/\{!daBat && \(/);
    expect(ma).toMatch(/\{daBat && hetLuot && \(/);
  });
});
