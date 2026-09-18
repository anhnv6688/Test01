import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";
import type { LoiGiang, MucChiTiet } from "@/lib/domain/teaching";
import type { GoiGuiDi } from "@/lib/privacy/envelope";
import {
  GIAI_THICH_LOI, tienKiemChatLuong,
  type ChatLuongAnh, type ChiPhiLanGoi, type KetQuaXuLy, type NhaCungCapXuLyAnh,
} from "./provider";
import {
  BaiSchema, DeBaiSchema, NHAC_CHAM_BAI, NHAC_DOC_DE, TrangSchema, chuyenDoi, xepDang,
} from "./luoc-do";
import * as z from "zod/v4";

/**
 * Nhà cung cấp cho bất kỳ điểm cuối nào nói giao thức OpenAI.
 *
 * Vì sao có tệp này: RR-08 nói dự án không được phụ thuộc một nhà cung cấp duy
 * nhất, và câu hỏi cụ thể đang cần trả lời bằng số là "Qwen3-VL tự dựng đọc vở
 * ô ly của trẻ Việt Nam có đủ tốt không". Gần như mọi cách phục vụ mô hình mở —
 * vLLM, SGLang, Ollama, LM Studio, và các sàn cho thuê — đều bày ra đúng giao
 * thức này, nên MỘT lớp cài đặt phủ được tất cả.
 *
 * Dùng fetch trần, không thêm SDK. Phần cần tới chỉ là một lời gọi POST và một
 * lược đồ JSON; kéo thêm một gói phụ thuộc vào cây để tiết kiệm hai chục dòng
 * là đổi sai chiều.
 *
 * Lời nhắc và lược đồ lấy nguyên từ ./luoc-do, không viết lại. Đây là điều kiện
 * để bảng so sánh có nghĩa: hai mô hình nhận hai lời nhắc khác nhau thì thứ đo
 * được là lời nhắc, và nó vẫn ra một bảng số trông rất thuyết phục.
 */

/**
 * Điểm cuối này có làm ảnh rời khỏi máy chủ không.
 *
 * Đây là câu hỏi quan trọng nhất của cả tệp, nên nó là một hàm có tên chứ không
 * phải một điều kiện viết lẫn vào chỗ khác.
 *
 * Tự dựng mô hình trên chính máy mình là lý do lớn nhất để đi đường này — lớn
 * hơn cả tiền: ảnh vở của trẻ không rời khỏi máy thì Nghị định 53/2022 về lưu
 * trữ dữ liệu trong nước không còn là vấn đề, và ba cờ DPA cũng không còn cần
 * cho khâu phiên âm. Nhưng điều đó CHỈ đúng khi điểm cuối thật sự nằm ở máy
 * này. Trỏ cùng một lớp cài đặt sang một sàn cho thuê ở nước ngoài thì ảnh đi
 * ra ngoài y như gọi API thường, mà mã nguồn thì trông hệt nhau.
 *
 * Vì vậy: chỉ những địa chỉ vòng lặp nội bộ mới được coi là không gửi ra ngoài.
 * Tên máy trong mạng LAN cũng KHÔNG được tính — máy bên cạnh vẫn là một máy
 * khác, và người soát tuân thủ hỏi "ảnh có rời khỏi máy chủ không" thì câu trả
 * lời phải là sự thật kỹ thuật, không phải ý định của người cấu hình.
 */
export function diemCuoiNamTaiCho(diemCuoi: string): boolean {
  let u: URL;
  try {
    u = new URL(diemCuoi);
  } catch {
    return false;
  }
  return u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]"
    || u.hostname === "::1";
}

export interface CauHinhTuongThich {
  /** Tên hiển thị trong báo cáo so sánh. */
  ten: string;
  /** Ví dụ http://127.0.0.1:8000/v1 khi chạy vLLM tại chỗ. */
  diemCuoi: string;
  /** Tên mô hình như máy chủ đó gọi, ví dụ Qwen/Qwen3-VL-8B-Instruct. */
  model: string;
  /** Khóa API. Máy tự dựng thường không cần, để trống cũng chạy. */
  khoa?: string;
  /** Mili giây chờ tối đa. Mô hình tự dựng trên máy yếu có thể rất chậm. */
  hetGioMs?: number;
}

interface TraLoiOpenAI {
  choices?: { message?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  model?: string;
}

/**
 * Bóc JSON ra khỏi câu trả lời.
 *
 * Mô hình mở hay bọc JSON trong khối ```json dù lược đồ đã yêu cầu JSON thuần,
 * và cũng hay thêm một câu dẫn trước. Bóc ở đây chứ không siết lời nhắc để ép
 * chúng thôi làm vậy: siết lời nhắc là đổi lời nhắc, mà lời nhắc phải giống hệt
 * nhau giữa các mô hình thì bảng so sánh mới có nghĩa.
 */
export function bocJson(raw: string): unknown {
  const trong = raw.trim();
  const khoi = trong.match(/```(?:json)?\s*([\s\S]*?)```/);
  const than = khoi ? khoi[1] : trong;
  const dau = than.indexOf("{");
  const cuoi = than.lastIndexOf("}");
  if (dau === -1 || cuoi <= dau) throw new Error("không tìm thấy JSON trong câu trả lời");
  return JSON.parse(than.slice(dau, cuoi + 1));
}

export class NhaCungCapTuongThichOpenAI implements NhaCungCapXuLyAnh {
  ten: string;
  /**
   * Thỏa thuận xử lý dữ liệu.
   *
   * Điểm cuối nằm tại chỗ thì không có bên thứ ba nào để mà ký: ảnh không rời
   * khỏi máy. Đánh dấu daKy là true ở đây KHÔNG phải mẹo lách CR-03 — nó mô tả
   * đúng sự thật, và `diemCuoiNamTaiCho` ở trên là chỗ quyết định sự thật ấy.
   *
   * Điểm cuối ở xa thì ngược lại: có bên thứ ba, nên phải khai đủ ba cờ DPA
   * giống hệt nhà cung cấp thật, và hàm dựng dưới đây từ chối nếu thiếu.
   */
  thoaThuan: NhaCungCapXuLyAnh["thoaThuan"];
  private ch: CauHinhTuongThich;
  private taiCho: boolean;

  constructor(ch: CauHinhTuongThich) {
    this.ch = ch;
    this.ten = ch.ten;
    this.taiCho = diemCuoiNamTaiCho(ch.diemCuoi);

    if (this.taiCho) {
      this.thoaThuan = { daKy: true, camDungDeHuanLuyen: true, camLuuGiu: true, ngayKy: null };
    } else {
      const daKy = process.env.OLY_DPA_DA_KY === "true";
      const camHuanLuyen = process.env.OLY_DPA_CAM_HUAN_LUYEN === "true";
      const camLuuGiu = process.env.OLY_DPA_CAM_LUU_GIU === "true";
      if (!daKy || !camHuanLuyen || !camLuuGiu) {
        throw new Error(
          `Điểm cuối ${ch.diemCuoi} nằm NGOÀI máy này, nên ảnh sẽ rời khỏi máy chủ. ` +
            "Cần bật đủ ba cờ xác nhận đã ký thỏa thuận xử lý dữ liệu (CR-03, CR-16), " +
            "hoặc trỏ về một điểm cuối chạy tại chỗ.",
        );
      }
      this.thoaThuan = {
        daKy, camDungDeHuanLuyen: camHuanLuyen, camLuuGiu,
        ngayKy: process.env.OLY_DPA_NGAY_KY ?? null,
      };
    }
  }

  /** Ảnh gửi tới điểm cuối này có rời khỏi máy chủ không. */
  get guiRaNgoai(): boolean {
    return !this.taiCho;
  }

  /**
   * Tầng 2 để trống có chủ ý.
   *
   * Soạn lời giảng là chỗ DUY NHẤT trong sản phẩm mà một mô hình tự do viết nội
   * dung đến tay người dùng, và nó phải qua được NT-07 — không một nhận định
   * nào về đứa trẻ. Đó là việc cần đo riêng, bằng bộ đo riêng, trước khi giao
   * cho một mô hình mới. Trả null nghĩa là "không soạn được", và luồng đã có
   * sẵn đường xử lý: nói thẳng với phụ huynh và không trừ lượt.
   *
   * Đừng nối tạm vào đây cho đủ bộ. Một lời giảng sai thì phụ huynh đọc cho con
   * nghe, còn một lần phiên âm sai thì bộ chấm bắt được.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async soanLoiGiang(deBai: string, muc: MucChiTiet): Promise<LoiGiang | null> {
    return null;
  }

  async xuLy(goi: GoiGuiDi, chatLuong: ChatLuongAnh): Promise<KetQuaXuLy> {
    const loiSom = tienKiemChatLuong(chatLuong);
    if (loiSom) {
      return { ok: false, loi: { ma: loiSom, noiGiVoiPhuHuynh: GIAI_THICH_LOI[loiSom] } };
    }

    const docDe = goi.loaiViec === "doc-de-bai";
    const nhac = docDe ? NHAC_DOC_DE : NHAC_CHAM_BAI;
    const luocDo = docDe ? DeBaiSchema : TrangSchema;
    const batDau = Date.now();

    let tra: TraLoiOpenAI;
    try {
      const res = await fetch(`${this.ch.diemCuoi.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.ch.khoa ? { Authorization: `Bearer ${this.ch.khoa}` } : {}),
        },
        signal: AbortSignal.timeout(this.ch.hetGioMs ?? 180_000),
        body: JSON.stringify({
          model: this.ch.model,
          messages: [
            { role: "system", content: nhac },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${goi.anhBase64}` } },
                { type: "text", text: `Lớp ${goi.lop}, học kỳ ${goi.hocKy}. Trả về đúng một đối tượng JSON theo lược đồ.` },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "trang", schema: z.toJSONSchema(luocDo), strict: true },
          },
          temperature: 0,
        }),
      });
      if (!res.ok) throw new Error(`máy chủ trả ${res.status}`);
      tra = (await res.json()) as TraLoiOpenAI;
    } catch (e) {
      // Không đoán mã lỗi ảnh khi lỗi là lỗi MẠNG: nói "ảnh mờ" trong khi máy
      // chủ sập là dạy phụ huynh chụp lại một tấm ảnh vốn không có vấn đề gì.
      throw new Error(`${this.ten}: không gọi được điểm cuối — ${(e as Error).message}`);
    }

    const chiPhi: ChiPhiLanGoi = {
      tokenVaoMoi: tra.usage?.prompt_tokens ?? 0,
      tokenVaoTuDem: 0,
      tokenRa: tra.usage?.completion_tokens ?? 0,
      thoiGianMs: Date.now() - batDau,
      model: tra.model ?? this.ch.model,
    };

    const noiDung = tra.choices?.[0]?.message?.content ?? "";
    const kq = luocDo.safeParse(bocJson(noiDung));
    if (!kq.success) {
      // Mô hình trả về thứ không khớp lược đồ là một KẾT QUẢ của phép đo, không
      // phải một sự cố cần giấu. Ném ra kèm nguyên văn để bảng so sánh ghi lại.
      throw new Error(`${this.ten}: câu trả lời không khớp lược đồ — ${kq.error.message}`);
    }

    const d = kq.data;
    if (!d.docDuocAnh) {
      const ma = d.lyDoKhongDoc ?? "khong-thay-chu";
      return { ok: false, loi: { ma, noiGiVoiPhuHuynh: GIAI_THICH_LOI[ma] }, chiPhi };
    }

    if (docDe) {
      const de = d as z.infer<typeof DeBaiSchema>;
      return {
        ok: true,
        chiPhi,
        ketQua: {
          loai: "doc-de-bai",
          deBai: de.deBai,
          de: xepDang(de),
          cacSo: de.cacSo,
          nghiNgo: de.nghiNgo,
        },
      };
    }

    const trang = d as z.infer<typeof TrangSchema>;
    const cacBai: DangBaiLam[] = trang.cacBai.map((b) => chuyenDoi(b as z.infer<typeof BaiSchema>));
    return {
      ok: true,
      chiPhi,
      ketQua: {
        loai: "cham-bai-lam",
        cacBai,
        // Dựng y hệt claude.ts: từ docDuocThoTruoc, nhãn "dòng N". Bản đầu ở
        // đây tự ghép lại từ cacBai và đánh nhãn "bài N" — trông cũng hợp lý,
        // nhưng khi ấy hai cột của bảng so sánh chứa hai thứ khác nhau, và
        // phần lệch sẽ bị đọc thành lệch giữa hai MÔ HÌNH.
        buocDocDuoc: trang.docDuocThoTruoc.map((noiDung, i) => ({
          nhan: `dòng ${i + 1}`,
          noiDung,
        })),
      },
    };
  }
}
