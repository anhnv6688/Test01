import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";
import type { DeDaDoc } from "@/lib/domain/giang-de-doc-duoc";
import type { LoiGiang, MucChiTiet } from "@/lib/domain/teaching";
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

/**
 * Hai mô hình cho hai việc khác hẳn nhau về bản chất.
 *
 * MODEL_DOC_ANH — phiên âm chữ viết tay thành dữ liệu có cấu trúc. Đây là việc
 * nhận dạng, làm trên MỌI trang ảnh, và là toàn bộ chi phí biến đổi của nhóm F.
 * Không cần mô hình đắt: phần khó của việc chấm không nằm ở đây mà nằm ở khâu
 * tính lại, mà khâu đó do mã nguồn tất định làm và không bao giờ sai.
 *
 * MODEL_SOAN_GIANG — soạn lời giảng cho phụ huynh khi đề là bài toán có lời
 * văn mà mã nguồn không giải được. Đây là việc cần hiểu ngữ cảnh và diễn đạt
 * sư phạm, nên dùng mô hình mạnh nhất. Nó chỉ chạy ở tầng 2, tức là phần nhỏ
 * trong tổng số trang, nên ảnh hưởng tới chi phí trung bình là có hạn.
 *
 * Cơ sở của cách chia này nằm ở src/lib/domain/mo-hinh-chi-phi.ts, chạy lại
 * được bằng `npm run chi-phi`.
 */
export const MODEL_DOC_ANH = process.env.OLY_MODEL_DOC_ANH ?? "claude-haiku-4-5";
export const MODEL_SOAN_GIANG = process.env.OLY_MODEL_SOAN_GIANG ?? "claude-opus-5";

/**
 * Mức công sức mô hình bỏ ra. Đây là chỗ đánh đổi chi phí rõ nhất của nhóm F,
 * nên nó nằm ở biến môi trường để đo được bằng số thật trước khi chốt — đúng
 * điều kiện ra mắt số 3 và yêu cầu BR-22.
 */
type MucCongSuc = "low" | "medium" | "high" | "xhigh" | "max";

const MUC_CONG_SUC = (process.env.OLY_MUC_CONG_SUC ?? "medium") as MucCongSuc;

/** Soạn lời giảng cần nghĩ kỹ hơn đọc chữ, và chỉ chạy ở tầng 2. */
const MUC_CONG_SUC_GIANG = (process.env.OLY_MUC_CONG_SUC_GIANG ?? "high") as MucCongSuc;

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

/**
 * Đề bài đọc từ ảnh.
 *
 * Trường `dang` quyết định đề đi vào tầng 1 hay tầng 2, tức là quyết định lần
 * chụp này có tốn tiền gọi mô hình đắt hay không. Vì vậy mô hình đọc ảnh được
 * yêu cầu xếp dạng một cách dè dặt: không chắc thì ghi "khac", và đề dạng có
 * cấu trúc thì phải chép lại biểu thức đủ để mã nguồn tính lại được.
 */
const DeBaiSchema = z.object({
  docDuocAnh: z.boolean(),
  lyDoKhongDoc: z.enum([
    "anh-toi-qua", "anh-mo", "anh-nghieng", "khong-thay-chu", "ngoai-pham-vi",
  ]).nullable(),
  deBai: z.string(),
  dang: z.enum(["phep-tinh", "dien-so", "so-sanh", "doi-don-vi", "loi-van", "khac"]),
  /** Với phép tính và điền số: biểu thức để mã nguồn tính lại. */
  bieuThuc: z.string().nullable(),
  /** Với so sánh: hai vế. */
  veTrai: z.string().nullable(),
  vePhai: z.string().nullable(),
  /** Với đổi đơn vị. */
  soNguon: z.number().nullable(),
  donViNguon: z.enum(DON_VI).nullable(),
  donViDich: z.enum(DON_VI).nullable(),
  cacSo: z.array(z.number()),
  /** Đề có dấu hiệu thiếu dữ kiện hoặc mâu thuẫn không (BR-18). */
  nghiNgo: z.string().nullable(),
});

/**
 * Lời giảng do mô hình soạn — tầng 2.
 *
 * Lược đồ cố ý bắt mỗi bước phải có câu hỏi con: BR-27 nói phụ huynh cần biết
 * NÓI VỚI CON thế nào, không cần một bài giải chuẩn mực. Một lược đồ chỉ có
 * các bước tính sẽ khiến mô hình trả về đúng thứ BR-27 cấm.
 */
const LoiGiangSchema = z.object({
  /** Mô hình có tự tin giảng được bài này không. Không thì nói thẳng. */
  giangDuoc: z.boolean(),
  lyDoKhongGiang: z.string().nullable(),
  yeuCauCanDat: z.string(),
  buoc: z.array(z.object({
    tieuDe: z.string(),
    lamGi: z.string(),
    hoiCon: z.string(),
  })),
  dapAn: z.number().nullable(),
  donVi: z.string().nullable(),
  choHaySai: z.array(z.string()),
  neuVanChuaHieu: z.string(),
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

Việc của bạn là chép lại đề bài thành văn bản và XẾP DẠNG cho nó. Bạn KHÔNG giải, KHÔNG đưa đáp án.

Xếp dạng thế nào:
- "phep-tinh": đề chỉ yêu cầu tính, ví dụ "Tính: 45 + 27" hoặc "Đặt tính rồi tính 82 - 39". Chép biểu thức vào bieuThuc, dạng "45 + 27".
- "dien-so": đề có chỗ trống cần điền số, ví dụ "5 + ... = 8". Chép vào bieuThuc, dùng dấu ? cho chỗ trống: "5 + ? = 8".
- "so-sanh": đề yêu cầu điền dấu lớn hơn, bé hơn hoặc bằng. Chép hai vế vào veTrai và vePhai.
- "doi-don-vi": đề yêu cầu đổi đơn vị đo, ví dụ "320 cm = ... m". Điền soNguon, donViNguon, donViDich.
- "loi-van": bài toán có lời văn, có tình huống và nhân vật.
- "khac": mọi thứ còn lại, hoặc khi bạn không chắc.

Quy tắc quan trọng: XẾP DẠNG DÈ DẶT. Chỉ chọn một dạng có cấu trúc khi bạn chép lại được biểu thức đủ chính xác để người khác tính lại ra đúng con số. Còn lại thì chọn "loi-van" hoặc "khac". Xếp nhầm một bài lời văn thành phép tính sẽ khiến hệ thống giảng sai cho một đứa trẻ.

Nếu đề có dấu hiệu thiếu dữ kiện hoặc mâu thuẫn, ghi điều đó vào trường nghiNgo. Đề trôi nổi trên mạng có thể sai; báo sớm còn hơn để người lớn giảng theo một đề sai.

Nếu ảnh quá tối, quá nhòe, quá nghiêng, không thấy chữ, hoặc là bài ngoài phạm vi lớp 1–2, hãy đặt docDuocAnh là false và nêu lý do.`;

/**
 * Lời nhắc cho tầng 2. Viết dài và cụ thể vì đây là chỗ duy nhất trong sản phẩm
 * mà một mô hình tự do soạn nội dung đến tay người dùng, nên ranh giới phải rõ.
 */
const NHAC_SOAN_GIANG = `Bạn giúp một phụ huynh Việt Nam giảng lại một bài Toán cho con đang học lớp 1 hoặc lớp 2.

Người đọc lời bạn viết là BỐ MẸ, không phải đứa trẻ, và cũng không phải giáo viên. Họ thương con nhưng không có chuyên môn sư phạm, và họ chỉ có khoảng ba mươi phút mỗi tối.

Viết bằng NGÔN NGỮ GIẢNG BÀI, không phải ngôn ngữ trình bày toán học. Phụ huynh cần biết NÓI VỚI CON THẾ NÀO, không cần một bài giải chuẩn mực.

Bắt buộc:
- Mỗi bước phải có một câu để HỎI CON, viết nguyên văn như lời nói, đặt trong trường hoiCon. Không được để trống.
- Nêu chỗ trẻ lứa tuổi này hay hiểu sai ở dạng bài đó, trong choHaySai.
- Bám cách dạy của sách giáo khoa hiện hành: nhìn hình hoặc sơ đồ trước, viết phép tính sau. Đừng dạy mẹo tắt của người lớn, vì cô giáo dạy kiểu khác thì trẻ sẽ rối.
- Dùng tên riêng và bối cảnh Việt Nam nếu cần ví dụ.

Tuyệt đối không:
- Không đưa ra bất kỳ nhận định nào về tâm lý, sức khỏe, năng lực hay sự phát triển của đứa trẻ. Không dùng các từ như tăng động, giảm chú ý, rối loạn, chậm phát triển, chẩn đoán. Bạn chỉ nhìn thấy một bài toán, bạn không biết gì về đứa trẻ đó.
- Không bảo phụ huynh đọc đáp án cho con chép.

Nếu bạn không chắc mình hiểu đúng đề, hãy đặt giangDuoc là false và nói rõ vì sao. Thà nói không biết còn hơn giảng sai cho một đứa trẻ bảy tuổi.`;

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

  soanLoiGiang(deBai: string, muc: MucChiTiet): Promise<LoiGiang | null> {
    return soanLoiGiangBangMay(deBai, muc, this.client);
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
          de: xepDang(kq),
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

type DePhang = z.infer<typeof DeBaiSchema>;

/**
 * Ghép đề phẳng về đúng dạng, và HẠ CẤP khi thiếu dữ liệu.
 *
 * Mô hình bảo đây là phép tính nhưng không chép được biểu thức thì đề rơi
 * xuống "khac" chứ không được coi là phép tính rỗng. Hạ cấp là an toàn: nó chỉ
 * đẩy đề sang tầng 2, tốn thêm tiền chứ không giảng sai.
 */
export function xepDang(d: DePhang): DeDaDoc {
  switch (d.dang) {
    case "phep-tinh":
      return d.bieuThuc ? { dang: "phep-tinh", bieuThuc: d.bieuThuc } : { dang: "khac", noiDung: d.deBai };
    case "dien-so":
      return d.bieuThuc ? { dang: "dien-so", bieuThuc: d.bieuThuc } : { dang: "khac", noiDung: d.deBai };
    case "so-sanh":
      return d.veTrai && d.vePhai
        ? { dang: "so-sanh", veTrai: d.veTrai, vePhai: d.vePhai }
        : { dang: "khac", noiDung: d.deBai };
    case "doi-don-vi":
      return d.soNguon !== null && d.donViNguon && d.donViDich
        ? { dang: "doi-don-vi", soNguon: d.soNguon, donViNguon: d.donViNguon, donViDich: d.donViDich }
        : { dang: "khac", noiDung: d.deBai };
    case "loi-van":
      return { dang: "loi-van", noiDung: d.deBai };
    default:
      return { dang: "khac", noiDung: d.deBai };
  }
}

/**
 * Tầng 2 — nhờ mô hình mạnh soạn lời giảng.
 *
 * Chỉ gọi khi mã nguồn không giải được đề, và chỉ khi phụ huynh đã bật mục đích
 * "soạn lời giảng" trong phần Quyền riêng tư (BR-37). Đây là lần gọi đắt nhất
 * trong toàn sản phẩm, nên nơi gọi nó phải đếm được — xem route xử lý ảnh.
 *
 * Lưu ý về dữ liệu cá nhân: hàm này nhận NỘI DUNG ĐỀ đã đọc ra thành chữ, chứ
 * không nhận ảnh và không nhận bất kỳ mã định danh nào. Không có gì ở đây truy
 * ngược được về hộ gia đình.
 */
export async function soanLoiGiangBangMay(
  deBai: string,
  muc: MucChiTiet,
  client = new Anthropic(),
): Promise<LoiGiang | null> {
  const doDai =
    muc === "nhac-lai"
      ? "Phụ huynh này chỉ cần được nhắc lại cách làm, nên viết gọn trong một hoặc hai bước."
      : "Phụ huynh này cần được giảng từ đầu, nên viết đủ các bước, khoảng ba đến năm bước.";

  const tra = await client.messages.parse({
    model: MODEL_SOAN_GIANG,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: [{ type: "text", text: NHAC_SOAN_GIANG, cache_control: { type: "ephemeral" } }],
    output_config: { effort: MUC_CONG_SUC_GIANG, format: zodOutputFormat(LoiGiangSchema) },
    messages: [{ role: "user", content: `Đề bài:\n\n${deBai}\n\n${doDai}` }],
  });

  const kq = tra.parsed_output;
  if (!kq || !kq.giangDuoc || kq.buoc.length === 0) return null;

  return {
    mucChiTiet: muc,
    deBai,
    yeuCauCanDat: kq.yeuCauCanDat,
    buoc: kq.buoc,
    // Đáp án có thể null khi mô hình không tự tin; giao diện xử lý được.
    dapAn: kq.dapAn ?? Number.NaN,
    donVi: kq.donVi ?? undefined,
    choHaySai: kq.choHaySai.length > 0
      ? kq.choHaySai
      : ["Dạng này chưa ghi nhận lỗi phổ biến nào; anh chị để ý xem con vướng ở bước nào."],
    neuVanChuaHieu: kq.neuVanChuaHieu,
    // BR-25 và CR-07: nội dung do máy tạo phải gắn nhãn hiển thị.
    nhanMay:
      "Phần lời giảng này do trí tuệ nhân tạo soạn riêng cho bài anh chị vừa chụp, chưa qua giáo viên duyệt. Anh chị đọc qua trước khi giảng cho con.",
  };
}
