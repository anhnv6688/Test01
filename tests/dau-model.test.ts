import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { bocJson, diemCuoiNamTaiCho } from "@/lib/vision/openai-tuong-thich";
import { soSanh, traiBai, tyLeDongThuan, type KetQuaMotBen } from "@/lib/do-anh/dau-model";
import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";

const khongChuThich = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("ảnh có rời khỏi máy này không — câu hỏi phải trả lời bằng sự thật kỹ thuật", () => {
  it("chỉ địa chỉ vòng lặp nội bộ mới tính là tại chỗ", () => {
    for (const u of ["http://localhost:8000/v1", "http://127.0.0.1:8000/v1", "http://[::1]:8000/v1"]) {
      expect(diemCuoiNamTaiCho(u), u).toBe(true);
    }
  });

  it("máy trong mạng LAN KHÔNG tính là tại chỗ", () => {
    /**
     * Máy bên cạnh vẫn là một máy khác. Người soát tuân thủ hỏi "ảnh có rời
     * khỏi máy chủ không" thì câu trả lời phải là sự thật kỹ thuật, không phải
     * ý định của người cấu hình — và "máy kia cũng là máy của mình" là ý định.
     */
    for (const u of ["http://192.168.1.50:8000/v1", "http://may-gpu.noi-bo:8000/v1",
                     "https://api.mot-san-nao-do.com/v1", "khong-phai-url"]) {
      expect(diemCuoiNamTaiCho(u), u).toBe(false);
    }
  });

  it("điểm cuối ở XA mà chưa đủ ba cờ DPA thì từ chối dựng", async () => {
    const { NhaCungCapTuongThichOpenAI } = await import("@/lib/vision/openai-tuong-thich");
    for (const c of ["OLY_DPA_DA_KY", "OLY_DPA_CAM_HUAN_LUYEN", "OLY_DPA_CAM_LUU_GIU"]) {
      delete (process.env as Record<string, string | undefined>)[c];
    }
    expect(() => new NhaCungCapTuongThichOpenAI({
      ten: "xa", diemCuoi: "https://api.mot-san-nao-do.com/v1", model: "m",
    })).toThrow(/rời khỏi máy chủ/);
  });

  it("điểm cuối TẠI CHỖ thì chạy được mà không cần cờ DPA nào", async () => {
    /**
     * Đây là cả lý do đi đường tự dựng, và nó lớn hơn chuyện tiền: ảnh không
     * rời khỏi máy thì Nghị định 53/2022 không còn là vấn đề cho khâu phiên âm,
     * và cũng không có bên thứ ba nào để mà ký thỏa thuận.
     *
     * Ghi daKy = true ở đây KHÔNG phải mẹo lách CR-03 — nó mô tả đúng sự thật.
     */
    const { NhaCungCapTuongThichOpenAI } = await import("@/lib/vision/openai-tuong-thich");
    const n = new NhaCungCapTuongThichOpenAI({
      ten: "tai-cho", diemCuoi: "http://127.0.0.1:8000/v1", model: "qwen",
    });
    expect(n.guiRaNgoai).toBe(false);
    expect(n.thoaThuan.daKy).toBe(true);
  });

  it("KHÔNG cắm vào luồng phục vụ, để anhCoGuiRaNgoaiKhong() không nói dối", () => {
    /**
     * `anhCoGuiRaNgoaiKhong()` ở chon-nha-cung-cap.ts là chỗ DUY NHẤT trả lời
     * câu "ảnh chụp trên máy này có thật sự rời đi không", và nó đang tính theo
     * khóa API của Anthropic cùng ba cờ DPA.
     *
     * Cắm nhà cung cấp tương thích vào luồng phục vụ mà không sửa hàm ấy thì nó
     * sẽ trả lời "không gửi đi" trong khi ảnh đang bay sang một điểm cuối ở xa.
     * Bên nói "không gửi đi" là bên người ta tin, nên nói sai ở đó nặng hơn hẳn
     * một lỗi thường.
     *
     * Đấu model là công cụ ĐO, chạy bằng tay, nên nó dựng thẳng nhà cung cấp
     * cho riêng nó. Ngày nào muốn đưa vào phục vụ thật thì bài này đỏ, và người
     * sửa sẽ đọc được đúng lý do ngay tại đây.
     */
    const chon = khongChuThich(readFileSync("src/lib/vision/chon-nha-cung-cap.ts", "utf8"));
    expect(chon).not.toMatch(/openai-tuong-thich|NhaCungCapTuongThichOpenAI/);
  });
});

describe("mọi mô hình phải nhận CÙNG một lời nhắc và CÙNG một lược đồ", () => {
  it("nhà cung cấp tương thích không tự khai lời nhắc riêng", () => {
    /**
     * Hai mô hình nhận hai lời nhắc khác nhau thì thứ đo được là LỜI NHẮC, chứ
     * không phải mô hình — và nó vẫn ra một bảng số trông rất thuyết phục, nên
     * cái sai ấy không tự lộ ra. Đây là lý do luoc-do.ts tồn tại.
     */
    const ma = khongChuThich(readFileSync("src/lib/vision/openai-tuong-thich.ts", "utf8"));
    expect(ma).toMatch(/NHAC_CHAM_BAI, NHAC_DOC_DE|NHAC_DOC_DE, |from "\.\/luoc-do"/);
    // Không có chuỗi lời nhắc nào tự viết trong tệp này.
    expect(ma).not.toMatch(/Bạn đọc ảnh chụp/);
  });

  it("luoc-do.ts không kéo theo SDK của nhà cung cấp nào", () => {
    // chon-nha-cung-cap nạp muộn claude.ts để môi trường không có khóa khỏi
    // phải tải gói nặng. Chỗ dùng chung mà kéo một SDK thì ràng buộc đó gãy.
    const ma = readFileSync("src/lib/vision/luoc-do.ts", "utf8");
    expect(ma).not.toMatch(/@anthropic-ai|from "openai"/);
  });

  it("tầng 2 để trống có chủ ý, trả null chứ không nối tạm", async () => {
    /**
     * Soạn lời giảng là chỗ duy nhất một mô hình tự do viết nội dung đến tay
     * người dùng, và nó phải qua NT-07. Đó là việc cần đo riêng trước khi giao
     * cho một mô hình mới: lời giảng sai thì phụ huynh đọc cho con nghe, còn
     * phiên âm sai thì bộ chấm bắt được.
     */
    const { NhaCungCapTuongThichOpenAI } = await import("@/lib/vision/openai-tuong-thich");
    const n = new NhaCungCapTuongThichOpenAI({
      ten: "t", diemCuoi: "http://127.0.0.1:8000/v1", model: "qwen",
    });
    expect(await n.soanLoiGiang("1 + 1 = ?", "giang-tu-dau")).toBeNull();
  });
});

describe("bóc JSON ra khỏi câu trả lời", () => {
  it("chịu được khối mã, chữ dẫn trước, và JSON trần", () => {
    // Mô hình mở hay bọc JSON dù lược đồ đã đòi JSON thuần. Bóc ở đây chứ không
    // siết lời nhắc — siết lời nhắc là làm lời nhắc khác nhau giữa các bên.
    const mong = { a: 1 };
    expect(bocJson('{"a":1}')).toEqual(mong);
    expect(bocJson('```json\n{"a":1}\n```')).toEqual(mong);
    expect(bocJson('```\n{"a":1}\n```')).toEqual(mong);
    expect(bocJson('Đây là kết quả:\n{"a":1}')).toEqual(mong);
  });

  it("không có JSON thì ném lỗi, không trả về đối tượng rỗng", () => {
    // Trả {} sẽ khiến lược đồ báo thiếu trường, và người đọc đi tìm lỗi ở chỗ
    // sai. Nói thẳng "không tìm thấy JSON" thì ngắn hơn một buổi dò.
    expect(() => bocJson("tôi không chắc lắm")).toThrow(/không tìm thấy JSON/);
  });
});

const baiRong: DangBaiLam = { dang: "chua-nhan-dang", docDuoc: "x", ghiChu: "y" };
const ben = (ten: string, cacBai: DangBaiLam[]): KetQuaMotBen => ({
  ten, hong: null, chiPhi: null,
  ketQua: { ok: true, ketQua: { loai: "cham-bai-lam", cacBai, buocDocDuoc: [] } },
});

describe("so nhiều mô hình trên cùng một ảnh", () => {
  it("trải bài theo từng TRƯỜNG, không so bằng cả đối tượng", () => {
    /**
     * Hai mô hình đọc giống hệt nhau trừ đúng một chữ số là một thông tin hoàn
     * toàn khác với "đọc ra hai bài khác nhau". So bằng đối tượng gộp cả hai
     * thành "khác", và chỗ lệch một chữ số — thứ khó thấy nhất — biến mất.
     */
    const o = traiBai({ dang: "cot-doc", soA: 47, soB: 28, phep: "+", chuSoTre: [5, 7] } as DangBaiLam);
    expect(o.dang).toBe("cot-doc");
    expect(o.soA).toBe("47");
    expect(o.chuSoTre).toBe("[5,7]");
  });

  it("đồng thuận hết thì không có ô bất đồng nào", () => {
    const bc = soSanh([ben("a", [baiRong]), ben("b", [baiRong])]);
    expect(bc.batDong).toEqual([]);
    expect(tyLeDongThuan(bc)).toBe(1);
    expect(bc.lechSoBai).toBe(false);
  });

  it("nêu đúng ô lệch, kèm mỗi bên đọc ra gì", () => {
    const bc = soSanh([
      ben("a", [{ ...baiRong, docDuoc: "65" }]),
      ben("b", [{ ...baiRong, docDuoc: "55" }]),
    ]);
    const o = bc.batDong.find((x) => x.truong === "docDuoc")!;
    expect(o.viTri).toBe(1);
    expect(o.theoBen).toEqual({ a: "65", b: "55" });
  });

  it("lệch SỐ BÀI được nêu riêng, không nhấn chìm lệch một con số", () => {
    /**
     * Bên đọc thiếu hẳn một bài mà tính thành "bất đồng ở mọi ô của bài đó" thì
     * danh sách bất đồng đầy ắp những dòng nói cùng một chuyện, và những ô lệch
     * một chữ số — thứ đáng đem đi gắn nhãn nhất — chìm nghỉm ở giữa.
     */
    const bc = soSanh([ben("a", [baiRong, baiRong]), ben("b", [baiRong])]);
    expect(bc.lechSoBai).toBe(true);
    expect(bc.soBaiNhieuNhat).toBe(2);
    // Bài 2 chỉ một bên có, nên không so — và không sinh ô bất đồng nào.
    expect(bc.batDong.filter((x) => x.viTri === 2)).toEqual([]);
  });

  it("một bên hỏng thì không so được, và nói rõ là chưa so được", () => {
    // Im lặng ở đây sẽ bị đọc thành "hai bên giống hệt nhau".
    const bc = soSanh([ben("a", [baiRong]), { ten: "b", ketQua: null, hong: "sập", chiPhi: null }]);
    expect(bc.soOSoDuoc).toBe(0);
    expect(tyLeDongThuan(bc)).toBeNull();
  });

  it("nói rõ ở chính mã nguồn rằng đồng thuận KHÔNG phải là đúng", () => {
    /**
     * Cám dỗ lớn nhất của công cụ này là lấy đồng thuận làm đáp án rồi chấm
     * điểm theo nó. Làm vậy là tự dựng một cái nhãn giả, và cái nhãn giả ấy sai
     * đúng ở những chỗ khó nhất — tức là những chỗ cần đo nhất.
     *
     * Bài này canh phần cảnh báo còn nguyên trong mã, vì người đọc báo cáo sau
     * này sẽ không đọc lại lịch sử trò chuyện.
     */
    const ma = readFileSync("src/lib/do-anh/dau-model.ts", "utf8");
    expect(ma).toMatch(/ĐỒNG THUẬN KHÔNG PHẢI LÀ ĐÚNG/);
    const cli = readFileSync("scripts/dau-model.mts", "utf8");
    expect(cli).toMatch(/KHÔNG nói mô hình nào đọc đúng hơn/);
  });
});
