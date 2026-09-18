import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { LoiGiang, MucChiTiet } from "@/lib/domain/teaching";
import type { GoiGuiDi } from "@/lib/privacy/envelope";
/*
 * Lời nhắc và lược đồ nhập từ ./luoc-do, KHÔNG khai lại ở đây.
 *
 * Chúng từng nằm ngay trong tệp này. Tách ra từ lúc có `npm run dau-model`:
 * lệnh ấy chạy cùng một ảnh qua nhiều mô hình, và phép so sánh chỉ có nghĩa khi
 * mọi bên nhận đúng cùng một lời nhắc, cùng một lược đồ. Giữ một bản sao ở đây
 * là mở đường cho ngày hai bản lệch nhau — và khi ấy bảng so sánh sẽ đo LỜI
 * NHẮC chứ không đo mô hình, mà vẫn ra một bảng số trông rất thuyết phục.
 */
import {
  DeBaiSchema, LoiGiangSchema, MUC_CONG_SUC, MUC_CONG_SUC_GIANG,
  NHAC_CHAM_BAI, NHAC_DOC_DE, NHAC_SOAN_GIANG, TrangSchema, chuyenDoi, xepDang,
} from "./luoc-do";
import {
  GIAI_THICH_LOI, tienKiemChatLuong,
  type ChatLuongAnh, type ChiPhiLanGoi, type KetQuaXuLy, type NhaCungCapXuLyAnh,
} from "./provider";

/** Gom số liệu dùng tài nguyên từ một lần trả lời của mô hình. */
function doChiPhi(
  usage: {
    input_tokens?: number | null;
    output_tokens?: number | null;
    cache_read_input_tokens?: number | null;
  } | undefined,
  model: string,
  batDau: number,
): ChiPhiLanGoi {
  return {
    tokenVaoMoi: usage?.input_tokens ?? 0,
    tokenVaoTuDem: usage?.cache_read_input_tokens ?? 0,
    tokenRa: usage?.output_tokens ?? 0,
    thoiGianMs: Date.now() - batDau,
    model,
  };
}

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
      const batDau = Date.now();
      const tra = await this.client.messages.parse({
        model: MODEL_DOC_ANH,
        max_tokens: 4096,
        thinking: { type: "adaptive" },
        // Lời nhắc hệ thống đứng trước và không đổi, nên luôn trúng bộ đệm.
        system: [{ type: "text", text: NHAC_DOC_DE, cache_control: { type: "ephemeral" } }],
        output_config: { effort: MUC_CONG_SUC, format: zodOutputFormat(DeBaiSchema) },
        messages: [{ role: "user", content: [anh, { type: "text", text: `Lớp ${goi.lop}.` }] }],
      });
      const chiPhi = doChiPhi(tra.usage, tra.model ?? MODEL_DOC_ANH, batDau);
      const kq = tra.parsed_output;
      if (!kq || !kq.docDuocAnh) {
        const ma = kq?.lyDoKhongDoc ?? "khong-thay-chu";
        return { ok: false, loi: { ma, noiGiVoiPhuHuynh: GIAI_THICH_LOI[ma] }, chiPhi };
      }
      return {
        ok: true,
        chiPhi,
        ketQua: {
          loai: "doc-de-bai",
          deBai: kq.deBai,
          de: xepDang(kq),
          cacSo: kq.cacSo,
          nghiNgo: kq.nghiNgo,
        },
      };
    }

    const batDau = Date.now();
    const tra = await this.client.messages.parse({
      model: MODEL_DOC_ANH,
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: NHAC_CHAM_BAI, cache_control: { type: "ephemeral" } }],
      output_config: { effort: MUC_CONG_SUC, format: zodOutputFormat(TrangSchema) },
      messages: [{ role: "user", content: [anh, { type: "text", text: `Lớp ${goi.lop}.` }] }],
    });

    const chiPhi = doChiPhi(tra.usage, tra.model ?? MODEL_DOC_ANH, batDau);
    const kq = tra.parsed_output;
    if (!kq || !kq.docDuocAnh) {
      const ma = kq?.lyDoKhongDoc ?? "khong-thay-chu";
      return { ok: false, loi: { ma, noiGiVoiPhuHuynh: GIAI_THICH_LOI[ma] }, chiPhi };
    }
    if (kq.cacBai.length === 0) {
      return {
        ok: false,
        loi: { ma: "khong-thay-chu", noiGiVoiPhuHuynh: GIAI_THICH_LOI["khong-thay-chu"] },
        chiPhi,
      };
    }

    return {
      ok: true,
      chiPhi,
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

/*
 * Xuất lại để chỗ đang nhập từ tệp này không phải đổi đường. Nguồn thật ở
 * ./luoc-do — đừng khai lại ở đây.
 */
export { chuyenDoi, xepDang } from "./luoc-do";
