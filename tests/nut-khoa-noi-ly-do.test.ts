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
    const sauNut = ma.slice(iNut, iNut + 3600);
    expect(sauNut).toMatch(/Chưa gửi đi được/);
    expect(sauNut).toMatch(/vuongGi\.map/);
  });

  it("MỌI việc còn thiếu đều có lối đi tiếp ngay tại chỗ tắc", () => {
    /**
     * Nói "chưa đủ điều kiện" mà không cho lối đi tiếp thì vẫn là ngõ cụt.
     *
     * Bài này lấy danh sách việc thiếu từ chính nguồn sự thật (`ThieuGi` ở
     * privacy/nguoi-giam-ho.ts) rồi đòi trang chụp xử lý ĐỦ cả danh sách —
     * hoặc bằng một ô làm tại chỗ, hoặc bằng một đường dẫn. Thêm một mã thiếu
     * thứ năm mà quên nối vào đây thì bài đỏ ngay, thay vì lặng lẽ sinh ra một
     * ngõ cụt mới.
     *
     * Bản trước chỉ dò một đường dẫn viết cứng cạnh nút. Nó xanh suốt trong
     * khi "chua-co-dong-y-cua-tre" vẫn là ngõ cụt — vì có đường dẫn thật, chỉ
     * là dẫn sang một trang bắt người ta tự dò lại từ đầu.
     */
    const ng = readFileSync("src/lib/privacy/nguoi-giam-ho.ts", "utf8");
    const i = ng.indexOf("export type ThieuGi");
    const maThieu = [...ng.slice(i, ng.indexOf(";", i)).matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);
    expect(maThieu).toHaveLength(4);
    for (const t of maThieu) {
      expect(ma, `${t} chưa có lối đi tiếp nào trên trang chụp`).toContain(`"${t}"`);
    }
    // Hai mã làm được tại chỗ phải có ô riêng, không chỉ được nhắc tên.
    expect(ma).toMatch(/chua-co-dong-y-nguoi-giam-ho"\) && moTa && \(\s*\n\s*<XinDongY/);
    expect(ma).toMatch(/chua-co-dong-y-cua-tre"\) && moTa && con && \(\s*\n\s*<HoiCon/);
  });

  it("hết lượt cũng nói, và nói rõ phần luyện tập không bị ảnh hưởng", () => {
    /**
     * Hết lượt chụp KHÔNG được đọc thành "hết lượt học". Hạn mức chỉ chạm vào
     * việc xử lý trang ảnh; lịch sử học và phần luyện tập giữ nguyên — cùng một
     * nguyên tắc với KHOA_LICH_SU_KHI_HET_HAN ở domain/thue-bao.ts.
     */
    const iNut = ma.indexOf('Tôi đã che xong, gửi đi');
    const sauNut = ma.slice(iNut, iNut + 3600);
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

  it("việc CUỐI cùng — hỏi chính con — cũng làm được tại chỗ, không đẩy đi trang khác", () => {
    /**
     * Đây là chỗ bản trước bỏ dở, và nó là chỗ tệ nhất để bỏ dở.
     *
     * XinDongY gỡ xong phần của người lớn, nhưng với bạn từ 7 tuổi thì việc
     * CUỐI CÙNG là sự đồng ý của chính em (CR-05) — và đó lại đúng là việc duy
     * nhất còn phải đi sang trang khác. Phụ huynh gỡ ba bước rồi vấp ở bước
     * thứ tư, sang trang kia lại phải tự dò xem câu hỏi nào ứng với việc mình
     * đang làm dở. Chỗ tắc cuối cùng mà vẫn là ngõ cụt thì ba bước trước gần
     * như vô nghĩa.
     *
     * Không nới lỏng gì: cùng `hanhDongConDongY`, cùng câu `hoiCon`, cùng ghi
     * nguoiDongY "tre-em" kèm childId như trang Người đại diện. Đổi CHỖ hỏi,
     * không đổi ai trả lời.
     */
    expect(ma).toMatch(/\{vuongGi\.some\(\(v\) => v\.ma === "chua-co-dong-y-cua-tre"\)/);
    expect(ma).toMatch(/<HoiCon childId=\{con\.id\}/);
    const i = ma.indexOf("function HoiCon");
    expect(i).toBeGreaterThan(-1);
    const than = ma.slice(i, i + 1400);
    // Câu hỏi phải là bản viết cho trẻ tự đọc, không phải câu của người lớn.
    expect(than).toMatch(/\{hoiCon\}/);
    // Và phải từ chối được — một sự đồng ý không từ chối được thì không phải
    // sự đồng ý.
    expect(than).toMatch(/con nói không cũng được/);
    expect(than).not.toMatch(/defaultChecked/);
  });

  it("con trả lời xong thì trang chụp vẽ lại", () => {
    // Đúng cái bẫy đã sập một lần với hanhDongDoiDongY: bấm xong mà nút vẫn xám
    // thì người ta tưởng nút hỏng.
    const act = readFileSync("src/app/phu-huynh/actions.ts", "utf8");
    const i = act.indexOf("export async function hanhDongConDongY");
    expect(i).toBeGreaterThan(-1);
    expect(act.slice(i, i + 900)).toMatch(/revalidatePath\("\/phu-huynh\/chup"\)/);
  });

  it("chỉ chỉ đường khi việc ấy THẬT SỰ ở trang khác", () => {
    /**
     * Hai việc nay làm được tại chỗ. In thêm "mở mục Quyền riêng tư" bên dưới
     * chính cái nút vừa đặt xuống là chỉ đường ĐI KHỎI nó — phụ huynh nghe lời
     * thì mất đúng một vòng mà bản sửa này sinh ra để bỏ.
     *
     * Ngược lại, khai tháng năm sinh và ghi người đại diện thì thật sự ở trang
     * khác, và giấu đường dẫn đi mới là bỏ người ta giữa đường.
     */
    // Không còn đường dẫn sang Quyền riêng tư ở BẤT KỲ đâu trên trang chụp:
    // cả khối nhắc trước lẫn khối cạnh nút.
    expect(ma).not.toMatch(/quyen-rieng-tu/);
    // Và luật chỉ đường nằm đúng MỘT chỗ, dùng cho cả hai khối.
    expect(ma).toMatch(/function ChiDuong/);
    expect(ma.match(/<ChiDuong vuongGi=\{vuongGi\} \/>/g) ?? []).toHaveLength(2);
    const i = ma.indexOf("function ChiDuong");
    expect(ma.slice(i, i + 500)).toMatch(
      /chua-khai-thang-nam-sinh"[\s\S]{0,120}?chua-co-nguoi-giam-ho"/,
    );
  });

  it("câu 'thiếu gì' tách khỏi câu 'đi đâu mà làm', và API vẫn nhận đủ cả hai", () => {
    /**
     * Một nguồn, hai chỗ dùng. Trang chụp lấy phần "thiếu gì" vì nó có nút
     * ngay đó; API xử lý ảnh ghép cả hai, vì lúc ấy phụ huynh không đứng trên
     * trang nào có nút để bấm — bỏ phần chỉ đường là bỏ họ giữa đường.
     *
     * Không chép câu chữ sang chỗ thứ hai: hai bản sao thì có ngày lệch nhau.
     */
    const ng = readFileSync("src/lib/privacy/nguoi-giam-ho.ts", "utf8");
    expect(ng).toMatch(/export const DI_DAU_MA_LAM: Record<ThieuGi, string>/);
    expect(ng).toMatch(
      /noiGiVoiPhuHuynh:\s*\n?\s*thieu\.length > 0 \? `\$\{NOI_GI_KHI_THIEU\[thieu\[0\]\]\} \$\{DI_DAU_MA_LAM\[thieu\[0\]\]\}` : null/,
    );
    // NOI_GI_KHI_THIEU nay chỉ nói việc, không chỉ đường nữa.
    const i = ng.indexOf("export const NOI_GI_KHI_THIEU");
    const j = ng.indexOf("export const DI_DAU_MA_LAM");
    expect(ng.slice(i, j)).not.toMatch(/mục Quyền riêng tư|mục Người đại diện/);
  });

  it("ba điều kiện khóa nút đều có chỗ nói ra", () => {
    // dangXuLy tự nói bằng chữ trên nút ("Đang xử lý…"); hai điều kiện còn lại
    // phải có khối giải thích riêng.
    expect(ma).toMatch(/disabled=\{dangXuLy \|\| !daBat \|\| hetLuot\}/);
    expect(ma).toMatch(/\{!daBat && \(/);
    expect(ma).toMatch(/\{daBat && hetLuot && \(/);
  });
});
