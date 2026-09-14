import { tinhBieuThuc } from "./cham-bai/bieu-thuc";
import { TRAP_BY_ID } from "./traps";
import type { LoiGiang, MucChiTiet } from "./teaching";

/**
 * Giảng đúng cái đề trong ảnh của phụ huynh.
 *
 * Phân biệt với src/lib/domain/teaching.ts: tệp kia soạn lời giảng cho một bài
 * SINH RA TỪ KHO khuôn dạng của Ô Ly, nên nó biết trước mọi tham số. Tệp này
 * soạn lời giảng cho một đề LẠ vừa đọc từ ảnh, mà Ô Ly không dựng ra và không
 * kiểm soát được nội dung.
 *
 * Hai tầng, và ranh giới giữa chúng quyết định phần lớn chi phí biến đổi của
 * nhóm F:
 *
 *   Tầng 1 — đề có cấu trúc mà mã nguồn giải được (phép tính, điền số, so sánh,
 *            đổi đơn vị). Đáp án tính tất định, lời giảng lắp từ khuôn có sẵn.
 *            KHÔNG gọi mô hình nào, chi phí bằng không.
 *
 *   Tầng 2 — bài toán có lời văn, hoặc dạng mã nguồn không giải được. Phải nhờ
 *            mô hình soạn, và đây là chỗ duy nhất trong toàn sản phẩm mà một mô
 *            hình đắt tiền được gọi. Xem src/lib/vision/claude.ts.
 *
 * Vì sao tách bạch đến mức này: một hộ chụp đề "45 + 27" mà Ô Ly đi giảng
 * "38 + 24" thì còn tệ hơn là không giảng gì. Lời giảng phải bám đúng con số
 * trên trang giấy của con họ.
 */

/** Đề đã đọc từ ảnh, đã xếp thành dạng. */
export type DeDaDoc =
  | { dang: "phep-tinh"; bieuThuc: string }
  | { dang: "dien-so"; bieuThuc: string }
  | { dang: "so-sanh"; veTrai: string; vePhai: string }
  | { dang: "doi-don-vi"; soNguon: number; donViNguon: DonVi; donViDich: DonVi }
  | { dang: "loi-van"; noiDung: string }
  | { dang: "khac"; noiDung: string };

export type DonVi = "cm" | "dm" | "m" | "kg" | "g" | "l";

const QUY_DOI: Record<DonVi, { nhom: string; heSo: number }> = {
  cm: { nhom: "do-dai", heSo: 1 },
  dm: { nhom: "do-dai", heSo: 10 },
  m: { nhom: "do-dai", heSo: 100 },
  g: { nhom: "khoi-luong", heSo: 1 },
  kg: { nhom: "khoi-luong", heSo: 1000 },
  l: { nhom: "dung-tich", heSo: 1 },
};

export interface KetQuaGiai {
  dapAn: number;
  /** Đáp án viết bằng chữ, khi đáp án không phải một con số. */
  dapAnChu?: string;
  donVi?: string;
  /** Các bước tính, viết cho người lớn tự kiểm lại. */
  buocTinh: string[];
  /** Bẫy mà dạng đề này hay gài. */
  trapId: string | null;
}

/**
 * Giải đề bằng mã nguồn tất định. Trả về null nghĩa là tầng 1 không kham được
 * và phải chuyển sang tầng 2 — không phải nghĩa là đề sai.
 */
export function giaiDeTatDinh(de: DeDaDoc): KetQuaGiai | null {
  switch (de.dang) {
    case "phep-tinh": {
      const kq = tinhBieuThuc(de.bieuThuc);
      if (kq === null || !Number.isInteger(kq)) return null;
      return {
        dapAn: kq,
        buocTinh: [`${de.bieuThuc} = ${kq}`],
        trapId: coNhoHoacMuon(de.bieuThuc) ? "BAY-QUEN-NHO" : null,
      };
    }

    case "dien-so": {
      const bt = de.bieuThuc;
      if ((bt.match(/\?/g) ?? []).length !== 1 || !bt.includes("=")) return null;
      let dapAn: number | null = null;
      let soNghiem = 0;
      for (let thu = 0; thu <= 1000; thu++) {
        const [trai, phai] = bt.replace("?", String(thu)).split("=");
        const vt = tinhBieuThuc(trai);
        const vp = tinhBieuThuc(phai);
        if (vt !== null && vp !== null && vt === vp) {
          soNghiem += 1;
          if (dapAn === null) dapAn = thu;
          if (soNghiem > 1) return null;
        }
      }
      if (dapAn === null) return null;
      return {
        dapAn,
        buocTinh: [`Điền ${dapAn} vào chỗ trống thì hai vế bằng nhau.`],
        trapId: null,
      };
    }

    case "so-sanh": {
      const t = tinhBieuThuc(de.veTrai);
      const p = tinhBieuThuc(de.vePhai);
      if (t === null || p === null) return null;
      const dau = t > p ? ">" : t < p ? "<" : "=";
      return {
        // Quy ước nội bộ: 1 là lớn hơn, 0 là bằng, -1 là bé hơn. Con số này
        // không bao giờ hiện ra cho phụ huynh — dapAnChu mới là thứ hiện.
        dapAn: t > p ? 1 : t < p ? -1 : 0,
        dapAnChu: `dấu ${dau}`,
        buocTinh: [`Vế trái bằng ${t}, vế phải bằng ${p}, nên điền dấu ${dau}.`],
        trapId: null,
      };
    }

    case "doi-don-vi": {
      const n = QUY_DOI[de.donViNguon];
      const d = QUY_DOI[de.donViDich];
      if (!n || !d || n.nhom !== d.nhom) return null;
      const kq = (de.soNguon * n.heSo) / d.heSo;
      if (!Number.isInteger(kq)) return null;
      return {
        dapAn: kq,
        donVi: de.donViDich,
        buocTinh: [
          `1 ${de.donViDich} bằng ${d.heSo / n.heSo} ${de.donViNguon}.`,
          `${de.soNguon} ${de.donViNguon} bằng ${kq} ${de.donViDich}.`,
        ],
        trapId: "BAY-DON-VI",
      };
    }

    default:
      return null;
  }
}

/** Phép cộng trừ có nhớ hoặc có mượn không — để biết có nên nhắc bẫy quên nhớ. */
function coNhoHoacMuon(bieuThuc: string): boolean {
  const m = bieuThuc.match(/(\d+)\s*([+\-−])\s*(\d+)/);
  if (!m) return false;
  const [a, phep, b] = [Number(m[1]), m[2], Number(m[3])];
  if (a < 10 || b < 10) return false;
  return phep === "+" ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
}

const TEN_DANG: Record<DeDaDoc["dang"], string> = {
  "phep-tinh": "Phép tính",
  "dien-so": "Điền số vào chỗ trống",
  "so-sanh": "So sánh",
  "doi-don-vi": "Đổi đơn vị đo",
  "loi-van": "Bài toán có lời văn",
  khac: "Dạng chưa nhận ra",
};

/**
 * Lời giảng tầng 1: lắp từ khuôn có sẵn, không gọi mô hình nào.
 *
 * Vẫn bám đúng BR-27 — viết bằng ngôn ngữ giảng bài, mỗi bước có câu để hỏi
 * con — và BR-33 với hai mức chi tiết.
 */
export function soanLoiGiangTatDinh(
  de: DeDaDoc,
  giai: KetQuaGiai,
  muc: MucChiTiet,
  deBaiNguyenVan: string,
): LoiGiang {
  const trap = giai.trapId ? TRAP_BY_ID.get(giai.trapId) : null;
  const choHaySai = trap
    ? [trap.parentNote]
    : ["Dạng này chưa ghi nhận lỗi phổ biến nào; anh chị để ý xem con vướng ở bước nào."];

  const buocDau = {
    tieuDe: "Bước 1 — Cho con đọc lại đề và nói xem đề hỏi gì",
    lamGi:
      "Đừng giảng vội. Cho con đọc to đề một lần, rồi hỏi con đề đang hỏi cái gì. Rất nhiều câu sai chết ở đây chứ không chết ở phép tính.",
    hoiCon: "Đề này hỏi con cái gì nhỉ, con nói lại cho mẹ nghe bằng lời của con?",
  };

  const buocKiemTra = {
    tieuDe: "Bước cuối — Cho con kiểm tra lại đáp số",
    lamGi:
      "Đừng tự tay chữa. Hỏi con xem đáp số vừa ra có hợp lý không, và có đúng đơn vị mà đề hỏi không.",
    hoiCon: "Con đọc lại đáp số của con, xem đã đúng cái mà đề hỏi chưa?",
  };

  const buocCachLam = {
    tieuDe: `Bước 2 — ${tieuDeCachLam(de)}`,
    lamGi: giai.buocTinh.join(" "),
    hoiCon: cauHoiDan(de, trap?.parentQuestion),
  };

  return {
    mucChiTiet: muc,
    deBai: deBaiNguyenVan,
    yeuCauCanDat: TEN_DANG[de.dang],
    buoc: muc === "nhac-lai" ? [buocCachLam] : [buocDau, buocCachLam, buocKiemTra],
    dapAn: giai.dapAn,
    dapAnChu: giai.dapAnChu,
    donVi: giai.donVi,
    choHaySai,
    neuVanChuaHieu:
      "Nếu con vẫn chưa hiểu, anh chị đừng giảng lại lần hai bằng cùng một cách. Hãy lấy đúng dạng bài này nhưng đổi thành con số nhỏ hơn, cho con làm được một lần đã, rồi mới quay lại bài gốc.",
    // Tầng 1 không có máy tham gia soạn, nên không thuộc diện phải gắn nhãn.
    nhanMay: null,
  };
}

function tieuDeCachLam(de: DeDaDoc): string {
  switch (de.dang) {
    case "phep-tinh": return "Cho con đặt tính ra nháp rồi tính từng cột";
    case "dien-so": return "Cho con thử vài số rồi tự tìm ra số cần điền";
    case "so-sanh": return "Cho con tính từng vế trước, rồi mới điền dấu";
    case "doi-don-vi": return "Cho con nhắc lại quan hệ giữa hai đơn vị";
    default: return "Cách làm";
  }
}

function cauHoiDan(de: DeDaDoc, cauCuaBay?: string): string {
  if (cauCuaBay) return cauCuaBay;
  switch (de.dang) {
    case "dien-so": return "Phải thêm bao nhiêu nữa thì hai bên bằng nhau hả con?";
    case "so-sanh": return "Bên nào nhiều hơn hả con, con chỉ cho mẹ xem?";
    default: return "Con làm bước đầu tiên thế nào, con nói cho mẹ nghe?";
  }
}
