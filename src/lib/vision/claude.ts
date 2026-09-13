import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";
import type { GoiGuiDi } from "@/lib/privacy/envelope";
import {
  GIAI_THICH_LOI, tienKiemChatLuong,
  type ChatLuongAnh, type KetQuaXuLy, type NhaCungCapXuLyAnh,
} from "./provider";

/**
 * Nhà cung cấp xử lý ảnh thật, dùng mô hình đọc ảnh của Anthropic.
 *
 * Nguyên tắc lớn nhất của tệp này, và cũng là lý do nó tồn tại tách khỏi phần
 * chấm: MÔ HÌNH CHỈ PHIÊN ÂM, KHÔNG CHẤM. Lời nhắc hệ thống bên dưới nói rõ
 * điều đó, lược đồ đầu ra không có chỗ nào để ghi đúng hay sai, và phần chấm
 * nằm ở src/lib/domain/cham-bai với mã tất định.
 *
 * Ba lý do cho ranh giới này, xếp theo thứ tự quan trọng:
 *
 *   1. Đúng hơn. Đọc chữ viết tay là việc mô hình làm tốt hơn hẳn mã nguồn;
 *      cộng trừ có nhớ là việc mã nguồn không bao giờ sai còn mô hình thì có
 *      lúc sai. Giao mỗi bên đúng việc của mình.
 *   2. Giải thích được. BR-28 đòi chỉ ĐÚNG vị trí bước sai. Muốn vậy phải tính
 *      lại từng cột, chứ không phải hỏi ý kiến rồi tin.
 *   3. Kiểm thử được và rẻ. Toàn bộ phần chẩn đoán chạy trong bài kiểm thử với
 *      hàng nghìn ca mà không tốn đồng nào và không cần mạng.
 *
 * Về dữ liệu cá nhân: hàm xuLy nhận đúng một GoiGuiDi đã qua danh sách trắng
 * của BR-34, nên không có đường nào để mã định danh lọt ra ngoài từ đây.
 */

/** Mô hình dùng để đọc ảnh. Đổi bằng biến môi trường, không phải sửa mã. */
export const MODEL_DOC_ANH = process.env.OLY_MODEL_DOC_ANH ?? "claude-opus-5";

/**
 * Mức công sức mô hình bỏ ra. Đây là chỗ đánh đổi chi phí rõ nhất của nhóm F,
 * nên nó nằm ở biến môi trường để đo được bằng số thật trước khi chốt — đúng
 * điều kiện ra mắt số 3 và yêu cầu BR-22.
 */
const MUC_CONG_SUC = (process.env.OLY_MUC_CONG_SUC ?? "medium") as
  "low" | "medium" | "high" | "xhigh" | "max";

const DON_VI = ["cm", "dm", "m", "kg", "g", "l"] as const;

/**
 * Lược đồ đầu ra, cố ý viết PHẲNG thay vì dùng hợp kiểu phân biệt.
 *
 * Lý do: lược đồ phẳng dịch sang JSON Schema thành một đối tượng duy nhất, là
 * dạng mà chế độ đầu ra có cấu trúc xử lý chắc chắn nhất. Phần ghép về đúng
 * kiểu DangBaiLam làm ở hàm chuyenDoi bên dưới, nơi thiếu trường bắt buộc thì
 * rơi về dạng "chưa nhận dạng" chứ không ném lỗi giữa lúc phụ huynh đang đợi.
 *
 * Không có trường nào tên là dung, correct, diem hay đại loại. Đó là chủ ý.
 */
const BaiSchema = z.object({
  dang: z.enum([
    "cot-doc", "hang-ngang", "dien-so", "so-sanh", "trac-nghiem",
    "bai-giai-loi-van", "doi-don-vi", "dem-hinh", "xem-gio", "noi-ghep",
    "chua-nhan-dang",
  ]),
  soA: z.number().nullable(),
  soB: z.number().nullable(),
  phep: z.enum(["+", "-"]).nullable(),
  chuSoTre: z.array(z.number().nullable()).nullable(),
  veTrai: z.string().nullable(),
  vePhai: z.string().nullable(),
  ketQuaTre: z.number().nullable(),
  bieuThuc: z.string().nullable(),
  soTre: z.number().nullable(),
  dauTre: z.enum([">", "<", "="]).nullable(),
  luaChon: z.array(z.string()).nullable(),
  chonTre: z.number().nullable(),
  dapAnDung: z.number().nullable(),
  deBai: z.string().nullable(),
  cauLoiGiai: z.string().nullable(),
  phepTinh: z.string().nullable(),
  dapSo: z.string().nullable(),
  soNguon: z.number().nullable(),
  donViNguon: z.enum(DON_VI).nullable(),
  donViDich: z.enum(DON_VI).nullable(),
  soThat: z.number().nullable(),
  gioThat: z.number().nullable(),
  phutThat: z.number().nullable(),
  gioTre: z.number().nullable(),
  phutTre: z.number().nullable(),
  capTre: z.array(z.object({ trai: z.string(), phai: z.string() })).nullable(),
  capDung: z.array(z.object({ trai: z.string(), phai: z.string() })).nullable(),
  docDuoc: z.string().nullable(),
  ghiChu: z.string().nullable(),
});

const TrangSchema = z.object({
  /** Ảnh có đọc được không, và nếu không thì vì sao. */
  docDuocAnh: z.boolean(),
  lyDoKhongDoc: z.enum([
    "anh-toi-qua", "anh-mo", "anh-nghieng", "khong-thay-chu", "ngoai-pham-vi",
  ]).nullable(),
  /** Các bài trên trang, theo thứ tự từ trên xuống. */
  cacBai: z.array(BaiSchema),
  /** Nguyên văn những dòng đọc được, để phụ huynh tự đối chiếu. */
  docDuocThoTruoc: z.array(z.string()),
});

const DeBaiSchema = z.object({
  docDuocAnh: z.boolean(),
  lyDoKhongDoc: z.enum([
    "anh-toi-qua", "anh-mo", "anh-nghieng", "khong-thay-chu", "ngoai-pham-vi",
  ]).nullable(),
  deBai: z.string(),
  cacSo: z.array(z.number()),
  /** Đề có dấu hiệu thiếu dữ kiện hoặc mâu thuẫn không (BR-18). */
  nghiNgo: z.string().nullable(),
});

/**
 * Lời nhắc hệ thống. Để nguyên một chỗ và không chèn gì thay đổi theo từng lần
 * gọi, để phần này luôn trúng bộ đệm lời nhắc và chỉ tốn khoảng một phần mười
 * chi phí từ lần gọi thứ hai trở đi.
 */
const NHAC_CHAM_BAI = `Bạn đọc ảnh chụp một trang vở ô ly của học sinh tiểu học Việt Nam lớp 1 hoặc lớp 2.

VIỆC DUY NHẤT CỦA BẠN LÀ PHIÊN ÂM. Bạn tuyệt đối KHÔNG chấm điểm, KHÔNG nhận xét đúng sai, KHÔNG sửa bài. Một hệ thống khác sẽ chấm bằng cách tính lại; việc của bạn là chép lại trung thực những gì có trên giấy.

Quy tắc:
- Chép đúng những gì trẻ VIẾT, kể cả khi bạn thấy rõ là sai. Trẻ viết 47 + 28 = 65 thì bạn ghi đúng 65.
- Ô trẻ bỏ trống thì ghi null, không đoán.
- Chữ số trong phép tính cột dọc ghi TỪ PHẢI SANG TRÁI: kết quả 65 ghi thành [5, 6].
- Trẻ viết dấu nhân là x và dấu chia là dấu hai chấm, giữ nguyên như vậy.
- Mỗi bài trên trang là một phần tử, theo thứ tự từ trên xuống dưới.
- Không chắc bài thuộc dạng nào thì dùng dang là "chua-nhan-dang" và ghi nguyên văn vào docDuoc. Đoán bừa một dạng tệ hơn nhiều so với nhận là chưa biết.
- Trường nào không thuộc dạng của bài thì để null.
- Nếu trang có phần chữ không phải bài toán, ví dụ lời phê của cô giáo hay ghi chú của gia đình, thì BỎ QUA, không chép lại.

Nếu ảnh quá tối, quá nhòe, quá nghiêng, không thấy chữ, hoặc là bài ngoài phạm vi lớp 1–2, hãy đặt docDuocAnh là false và nêu lý do.`;

const NHAC_DOC_DE = `Bạn đọc ảnh chụp một đề bài Toán tiểu học Việt Nam lớp 1 hoặc lớp 2.

Việc của bạn là chép lại đề bài thành văn bản, KHÔNG giải, KHÔNG đưa đáp án.

Nếu đề có dấu hiệu thiếu dữ kiện hoặc mâu thuẫn, ghi điều đó vào trường nghiNgo. Đề trôi nổi trên mạng có thể sai; báo sớm còn hơn để người lớn giảng theo một đề sai.

Nếu ảnh quá tối, quá nhòe, quá nghiêng, không thấy chữ, hoặc là bài ngoài phạm vi lớp 1–2, hãy đặt docDuocAnh là false và nêu lý do.`;

export class ThieuThoaThuanError extends Error {
  constructor() {
    super(
      "Chưa bật cờ xác nhận đã ký thỏa thuận xử lý dữ liệu với nhà cung cấp. " +
        "CR-03 và CR-16 yêu cầu ký trước khi xử lý dữ liệu thật.",
    );
    this.name = "ThieuThoaThuanError";
  }
}

export class NhaCungCapClaude implements NhaCungCapXuLyAnh {
  ten = "Anthropic Claude";
  thoaThuan: NhaCungCapXuLyAnh["thoaThuan"];
  private client: Anthropic;

  /**
   * Cổng chặn tuân thủ.
   *
   * CR-03 và CR-16 đòi ký thỏa thuận xử lý dữ liệu, có điều khoản không lưu giữ
   * và không dùng để huấn luyện, TRƯỚC khi xử lý dữ liệu thật. Đây là nghĩa vụ
   * của tổ chức chứ không phải của phần mềm, nhưng phần mềm hoàn toàn có thể từ
   * chối chạy khi nghĩa vụ đó chưa xong — và từ chối ồn ào lúc khởi động thì
   * tốt hơn nhiều so với phát hiện khi bị kiểm tra.
   */
  constructor() {
    const daKy = process.env.OLY_DPA_DA_KY === "true";
    const camHuanLuyen = process.env.OLY_DPA_CAM_HUAN_LUYEN === "true";
    const camLuuGiu = process.env.OLY_DPA_CAM_LUU_GIU === "true";
    if (!daKy || !camHuanLuyen || !camLuuGiu) throw new ThieuThoaThuanError();

    this.thoaThuan = {
      daKy,
      camDungDeHuanLuyen: camHuanLuyen,
      camLuuGiu,
      ngayKy: process.env.OLY_DPA_NGAY_KY ?? null,
    };
    this.client = new Anthropic();
  }

  async xuLy(goi: GoiGuiDi, chatLuong: ChatLuongAnh): Promise<KetQuaXuLy> {
    // Chặn sớm ở máy khách: ảnh hỏng rõ ràng thì không gửi đi, vừa đỡ tiền vừa
    // trả lời phụ huynh nhanh hơn (BR-19, BR-31).
    const loiSom = tienKiemChatLuong(chatLuong);
    if (loiSom) {
      return { ok: false, loi: { ma: loiSom, noiGiVoiPhuHuynh: GIAI_THICH_LOI[loiSom] } };
    }

    const anh = {
      type: "image" as const,
      source: { type: "base64" as const, media_type: "image/jpeg" as const, data: goi.anhBase64 },
    };

    if (goi.loaiViec === "doc-de-bai") {
      const tra = await this.client.messages.parse({
        model: MODEL_DOC_ANH,
        max_tokens: 4096,
        thinking: { type: "adaptive" },
        // Lời nhắc hệ thống đứng trước và không đổi, nên luôn trúng bộ đệm.
        system: [{ type: "text", text: NHAC_DOC_DE, cache_control: { type: "ephemeral" } }],
        output_config: { effort: MUC_CONG_SUC, format: zodOutputFormat(DeBaiSchema) },
        messages: [{ role: "user", content: [anh, { type: "text", text: `Lớp ${goi.lop}.` }] }],
      });
      const kq = tra.parsed_output;
      if (!kq || !kq.docDuocAnh) {
        const ma = kq?.lyDoKhongDoc ?? "khong-thay-chu";
        return { ok: false, loi: { ma, noiGiVoiPhuHuynh: GIAI_THICH_LOI[ma] } };
      }
      return {
        ok: true,
        ketQua: {
          loai: "doc-de-bai",
          deBai: kq.deBai,
          // Việc khớp về khuôn dạng nào là của kho nội dung, không phải của mô hình.
          khuonDangKhop: null,
          cacSo: kq.cacSo,
          nghiNgo: kq.nghiNgo,
        },
      };
    }

    const tra = await this.client.messages.parse({
      model: MODEL_DOC_ANH,
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: NHAC_CHAM_BAI, cache_control: { type: "ephemeral" } }],
      output_config: { effort: MUC_CONG_SUC, format: zodOutputFormat(TrangSchema) },
      messages: [{ role: "user", content: [anh, { type: "text", text: `Lớp ${goi.lop}.` }] }],
    });

    const kq = tra.parsed_output;
    if (!kq || !kq.docDuocAnh) {
      const ma = kq?.lyDoKhongDoc ?? "khong-thay-chu";
      return { ok: false, loi: { ma, noiGiVoiPhuHuynh: GIAI_THICH_LOI[ma] } };
    }
    if (kq.cacBai.length === 0) {
      return {
        ok: false,
        loi: { ma: "khong-thay-chu", noiGiVoiPhuHuynh: GIAI_THICH_LOI["khong-thay-chu"] },
      };
    }

    return {
      ok: true,
      ketQua: {
        loai: "cham-bai-lam",
        cacBai: kq.cacBai.map(chuyenDoi),
        buocDocDuoc: kq.docDuocThoTruoc.map((noiDung, i) => ({
          nhan: `dòng ${i + 1}`,
          noiDung,
        })),
      },
    };
  }
}

type BaiPhang = z.infer<typeof BaiSchema>;

/**
 * Ghép dữ liệu phẳng về đúng kiểu của từng dạng.
 *
 * Thiếu trường bắt buộc thì rơi về "chưa nhận dạng" chứ không ném lỗi: phụ
 * huynh đang đứng chờ trước màn hình, và một câu "Ô Ly đọc được nhưng chưa dám
 * kết luận" tử tế hơn nhiều so với một màn hình lỗi kỹ thuật.
 */
export function chuyenDoi(b: BaiPhang): DangBaiLam {
  const chuaNhanDang = (viSao: string): DangBaiLam => ({
    dang: "chua-nhan-dang",
    docDuoc: b.docDuoc ?? b.phepTinh ?? b.veTrai ?? b.bieuThuc ?? "(không đọc được nội dung)",
    ghiChu: viSao,
  });

  switch (b.dang) {
    case "cot-doc":
      if (b.soA === null || b.soB === null || b.phep === null || b.chuSoTre === null) {
        return chuaNhanDang("Thiếu số hạng hoặc dòng kết quả của phép tính cột dọc.");
      }
      return { dang: "cot-doc", soA: b.soA, soB: b.soB, phep: b.phep, chuSoTre: b.chuSoTre };

    case "hang-ngang":
      if (b.veTrai === null) return chuaNhanDang("Không đọc được vế trái của phép tính.");
      return { dang: "hang-ngang", veTrai: b.veTrai, ketQuaTre: b.ketQuaTre };

    case "dien-so":
      if (b.bieuThuc === null) return chuaNhanDang("Không đọc được biểu thức có chỗ trống.");
      return { dang: "dien-so", bieuThuc: b.bieuThuc, soTre: b.soTre };

    case "so-sanh":
      if (b.veTrai === null || b.vePhai === null) {
        return chuaNhanDang("Không đọc được đủ hai vế của bài so sánh.");
      }
      return { dang: "so-sanh", veTrai: b.veTrai, vePhai: b.vePhai, dauTre: b.dauTre };

    case "trac-nghiem":
      if (b.luaChon === null || b.luaChon.length === 0) {
        return chuaNhanDang("Không đọc được các lựa chọn của câu trắc nghiệm.");
      }
      return {
        dang: "trac-nghiem", luaChon: b.luaChon, chonTre: b.chonTre, dapAnDung: b.dapAnDung,
      };

    case "bai-giai-loi-van":
      return {
        dang: "bai-giai-loi-van",
        deBai: b.deBai,
        cauLoiGiai: b.cauLoiGiai,
        phepTinh: b.phepTinh,
        dapSo: b.dapSo,
      };

    case "doi-don-vi":
      if (b.soNguon === null || b.donViNguon === null || b.donViDich === null) {
        return chuaNhanDang("Không đọc được đủ hai đơn vị của bài đổi đơn vị.");
      }
      return {
        dang: "doi-don-vi",
        soNguon: b.soNguon,
        donViNguon: b.donViNguon,
        donViDich: b.donViDich,
        ketQuaTre: b.ketQuaTre,
      };

    case "dem-hinh":
      return { dang: "dem-hinh", soThat: b.soThat, ketQuaTre: b.ketQuaTre };

    case "xem-gio":
      return {
        dang: "xem-gio",
        gioThat: b.gioThat,
        phutThat: b.phutThat,
        gioTre: b.gioTre,
        phutTre: b.phutTre,
      };

    case "noi-ghep":
      return { dang: "noi-ghep", capTre: b.capTre ?? [], capDung: b.capDung };

    case "chua-nhan-dang":
      return chuaNhanDang(b.ghiChu ?? "Mô hình không xếp được bài này vào dạng nào.");
  }
}
