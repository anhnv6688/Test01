import type { DangBaiLam, MaDang } from "@/lib/domain/cham-bai/dang-bai-lam";
import { MOI_MA_DANG } from "@/lib/domain/cham-bai/dang-bai-lam";
import type { NhanBoAnh, NhanMotAnh } from "./nhan";

/**
 * Phần logic của việc gắn nhãn bộ ảnh đo — không dính React, không dính đĩa.
 *
 * Tách ra khỏi giao diện vì hai lý do. Một, để kiểm thử được trong Node: những
 * ràng buộc ở đây (tên tệp an toàn, nhãn rỗng đúng khuôn, đếm còn thiếu bao
 * nhiêu) là chỗ dễ sai mà lại không nhìn thấy bằng mắt. Hai, vì trang gắn nhãn
 * là công cụ cục bộ và có thể sẽ được thay bằng một công cụ khác; phần quyết
 * định nhãn hợp lệ hay không thì không nên đi theo công cụ đó.
 *
 * Nhắc lại nguyên tắc ở nhan.ts, vì đây chính là chỗ người ta sẽ phá nó: nhãn
 * ghi NHỮNG GÌ TRẺ ĐÃ VIẾT, không phải đáp án đúng. Trang gắn nhãn có hiện kết
 * luận của bộ chấm, nhưng hiện để người gắn nhãn ĐỐI CHIẾU với dấu mực đỏ của
 * cô giáo trên chính trang vở đó, không phải để sửa nhãn cho thành đúng.
 */

export interface MoTaDang {
  ten: string;
  /** Nhìn thấy gì trên giấy thì chọn dạng này. */
  nhanBiet: string;
}

export const MO_TA_DANG: Record<MaDang, MoTaDang> = {
  "cot-doc": {
    ten: "Đặt tính cột dọc",
    nhanBiet: "Hai số xếp chồng, có gạch ngang dưới, kết quả viết bên dưới",
  },
  "hang-ngang": {
    ten: "Tính hàng ngang",
    nhanBiet: "Phép tính viết một dòng, có dấu bằng, trẻ viết kết quả sau dấu bằng",
  },
  "dien-so": {
    ten: "Điền số vào chỗ trống",
    nhanBiet: "Có ô trống, dấu chấm chấm hoặc dấu hỏi trong biểu thức",
  },
  "so-sanh": {
    ten: "So sánh, điền dấu",
    nhanBiet: "Hai vế cách nhau bởi ô trống, trẻ điền >, < hoặc =",
  },
  "trac-nghiem": {
    ten: "Trắc nghiệm khoanh đáp án",
    nhanBiet: "Có các lựa chọn A, B, C, D và trẻ khoanh một cái",
  },
  "bai-giai-loi-van": {
    ten: "Bài giải có lời văn",
    nhanBiet: "Có đề bằng lời, trẻ viết câu lời giải, phép tính rồi đáp số",
  },
  "doi-don-vi": {
    ten: "Đổi đơn vị đo",
    nhanBiet: "Đổi cm sang m, kg sang g, lít… có đơn vị ở cả hai vế",
  },
  "dem-hinh": {
    ten: "Đếm hình, đếm đồ vật",
    nhanBiet: "Hỏi có bao nhiêu hình, bao nhiêu đồ vật; trẻ viết một con số",
  },
  "xem-gio": {
    ten: "Xem giờ đồng hồ kim",
    nhanBiet: "Có hình đồng hồ, trẻ viết giờ và phút",
  },
  "noi-ghep": {
    ten: "Nối hai cột",
    nhanBiet: "Hai cột, trẻ kẻ đường nối các cặp với nhau",
  },
  "chua-nhan-dang": {
    ten: "Chưa xếp được vào dạng nào",
    nhanBiet:
      "Đọc được chữ nhưng không khớp mười dạng trên. Cứ chọn cái này, đừng ép vào dạng gần đúng — ép vào dạng sai làm hỏng số đo theo dạng.",
  },
};

/**
 * Một bài rỗng đúng khuôn của dạng được chọn.
 *
 * Câu `switch` có kiểm `never` ở cuối, nên thêm một dạng mới vào kho chấm mà
 * quên khai ở đây là trình biên dịch báo lỗi ngay, chứ không phải tới lúc
 * người gắn nhãn bấm vào một nút không làm gì cả.
 */
export function baiTrong(dang: MaDang): DangBaiLam {
  switch (dang) {
    case "cot-doc":
      return { dang, soA: 0, soB: 0, phep: "+", chuSoTre: [] };
    case "hang-ngang":
      return { dang, veTrai: "", ketQuaTre: null };
    case "dien-so":
      return { dang, bieuThuc: "", soTre: null };
    case "so-sanh":
      return { dang, veTrai: "", vePhai: "", dauTre: null };
    case "trac-nghiem":
      return { dang, luaChon: ["", "", "", ""], chonTre: null, dapAnDung: null };
    case "bai-giai-loi-van":
      return { dang, deBai: null, cauLoiGiai: null, phepTinh: null, dapSo: null };
    case "doi-don-vi":
      return { dang, soNguon: 0, donViNguon: "cm", donViDich: "m", ketQuaTre: null };
    case "dem-hinh":
      return { dang, soThat: null, ketQuaTre: null };
    case "xem-gio":
      return { dang, gioThat: null, phutThat: null, gioTre: null, phutTre: null };
    case "noi-ghep":
      return { dang, capTre: [], capDung: null };
    case "chua-nhan-dang":
      return { dang, docDuoc: "", ghiChu: null };
    default: {
      const _het: never = dang;
      throw new Error(`Chưa khai nhãn rỗng cho dạng ${String(_het)}`);
    }
  }
}

export const DUOI_ANH_NHAN = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

/**
 * Tên tệp có an toàn để ghép vào đường dẫn không.
 *
 * Trang gắn nhãn nhận tên tệp từ trình duyệt rồi đọc tệp đó trên đĩa. Nếu
 * không chặn thì một tên như `../../.env` sẽ đọc được thứ khác hẳn. Công cụ này
 * chỉ chạy ở máy người gắn nhãn, nhưng "chỉ chạy ở máy mình" là lý do người ta
 * hay viện ra ngay trước khi một công cụ nội bộ chạy ở chỗ khác.
 *
 * Chặn theo hình dạng tên, KHÔNG chặn bằng cách so sánh đường dẫn sau khi ghép:
 * so sánh sau khi ghép còn phải tính tới liên kết mềm và chữ hoa chữ thường của
 * từng hệ tệp, mà chỗ này không cần tới sự linh hoạt đó.
 */
export function laTenAnhHopLe(ten: string): boolean {
  if (!ten || ten.length > 255) return false;
  if (ten.includes("/") || ten.includes("\\") || ten.includes("\0")) return false;
  if (ten === "." || ten === ".." || ten.startsWith(".")) return false;
  return DUOI_ANH_NHAN.some((d) => ten.toLowerCase().endsWith(d));
}

/** Lọc và sắp xếp danh sách tệp trong thư mục ảnh. */
export function locTenAnh(tep: string[]): string[] {
  return tep
    .filter(laTenAnhHopLe)
    .sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
}

export function boNhanRong(nguoiGanNhan: string): NhanBoAnh {
  return {
    moTa: "Bộ ảnh đo — gắn nhãn bằng trang /gan-nhan",
    nguoiGanNhan,
    ganNhanLuc: new Date().toISOString(),
    anh: [],
  };
}

/** Thay nhãn của một ảnh, giữ nguyên thứ tự; chưa có thì thêm vào cuối. */
export function gopNhanMotAnh(bo: NhanBoAnh, moi: NhanMotAnh): NhanBoAnh {
  const i = bo.anh.findIndex((a) => a.tep === moi.tep);
  const anh = i === -1 ? [...bo.anh, moi] : bo.anh.map((a, j) => (j === i ? moi : a));
  return { ...bo, ganNhanLuc: new Date().toISOString(), anh };
}

export function xoaNhanMotAnh(bo: NhanBoAnh, tep: string): NhanBoAnh {
  return { ...bo, anh: bo.anh.filter((a) => a.tep !== tep) };
}

export interface TienDo {
  tongAnh: number;
  daGanNhan: number;
  conThieu: string[];
  /** Nhãn có mà tệp ảnh không còn trên đĩa — bộ đo sẽ dừng vì thiếu ảnh. */
  nhanMoCoi: string[];
  /** Mỗi dạng bài đã có bao nhiêu ví dụ. */
  theoDang: Record<MaDang, number>;
}

/**
 * Đếm xem còn thiếu gì, và quan trọng hơn là dạng nào còn trống.
 *
 * Độ phủ theo dạng mới là thứ quyết định bộ đo có nói được gì hay không. Một bộ
 * trăm ảnh mà toàn cột dọc thì tỷ lệ tổng trông rất đẹp và không trả lời được
 * câu hỏi nào — trong khi dạng bài giải có lời văn, dạng chiếm 6 trên 10 điểm
 * của đề lớp 2, có thể đang hỏng hoàn toàn mà không ai biết.
 */
export function tienDoGanNhan(bo: NhanBoAnh, tepTrenDia: string[]): TienDo {
  const coTrenDia = new Set(tepTrenDia);
  const daNhan = new Set(bo.anh.map((a) => a.tep));
  const theoDang = Object.fromEntries(MOI_MA_DANG.map((d) => [d, 0])) as Record<MaDang, number>;
  for (const a of bo.anh) {
    for (const b of a.cacBai ?? []) theoDang[b.dang]++;
  }
  return {
    tongAnh: tepTrenDia.length,
    daGanNhan: tepTrenDia.filter((t) => daNhan.has(t)).length,
    conThieu: tepTrenDia.filter((t) => !daNhan.has(t)),
    nhanMoCoi: bo.anh.map((a) => a.tep).filter((t) => !coTrenDia.has(t)),
    theoDang,
  };
}

/**
 * Chuyển dòng kết quả của phép tính cột dọc giữa cách người gõ và cách máy lưu.
 *
 * Người gắn nhãn nhìn trang giấy và gõ từ TRÁI sang PHẢI, vì đó là cách mắt đọc
 * một con số. Khuôn `CotDoc.chuSoTre` lại lưu từ PHẢI sang TRÁI, vì bộ chấm cần
 * so từng hàng đơn vị, chục, trăm — mà hàng đơn vị luôn là chữ số cuối cùng,
 * bất kể trẻ viết mấy chữ số.
 *
 * Bắt người gõ tự đảo là chắc chắn có ngày gõ ngược mà không ai biết: "75" và
 * "57" đều là số hợp lệ, nên không có cách nào phát hiện từ dữ liệu. Vì vậy
 * việc đảo nằm ở đây, có kiểm thử, và giao diện nói rõ là gõ từ trái sang phải.
 *
 * Dấu chấm, gạch dưới hoặc khoảng trắng nghĩa là ô đó trẻ bỏ trống — khác hẳn
 * với việc trẻ viết số 0.
 */
const KY_HIEU_O_TRONG = [".", "_", " ", "-"];

export function chuSoTreTuChuoi(s: string): (number | null)[] {
  const ra: (number | null)[] = [];
  for (const c of s.trim()) {
    if (KY_HIEU_O_TRONG.includes(c)) ra.push(null);
    else if (c >= "0" && c <= "9") ra.push(Number(c));
    // Ký tự lạ thì bỏ qua, không ném lỗi: người đang gõ dở một ô không nên bị
    // giao diện chặn lại giữa chừng.
  }
  return ra.reverse();
}

export function chuoiTuChuSoTre(chuSo: (number | null)[]): string {
  return [...chuSo].reverse().map((c) => (c === null ? "." : String(c))).join("");
}
