/**
 * Các dạng bài làm mà Ô Ly đọc được từ ảnh trang vở.
 *
 * VM-08 đã được chủ đầu tư chốt ngày 13/9/2026: bản đầu tiên phải chấm được
 * MỌI dạng bài của chương trình lớp 1–2, không thu hẹp xuống vài dạng dễ nhận
 * dạng như phương án dự phòng của RR-10.
 *
 * Quyết định kiến trúc theo sau: bên xử lý ảnh chỉ làm đúng một việc là PHIÊN ÂM
 * những gì trẻ viết trên giấy thành dữ liệu có cấu trúc. Nó KHÔNG chấm. Việc
 * chấm do mã nguồn tất định ở thư mục này làm, vì ba lý do:
 *
 *   1. Đúng hơn. Máy đọc chữ tốt hơn người ở tốc độ, nhưng cộng trừ thì mã
 *      nguồn không bao giờ sai, còn mô hình ngôn ngữ thì có lúc sai.
 *   2. Giải thích được. BR-28 đòi chỉ ĐÚNG vị trí bước sai. Muốn vậy phải tính
 *      lại từng cột, không thể hỏi ý kiến rồi tin.
 *   3. Rẻ hơn và kiểm thử được. Phần chấm chạy trong bài kiểm thử với hàng nghìn
 *      ca mà không tốn một đồng nào và không cần mạng.
 *
 * Mỗi dạng dưới đây có một bộ chấm riêng trong sổ đăng ký, xem so-dang-ky.ts.
 */

/** Phép tính đặt theo cột dọc: 47 + 28. */
export interface CotDoc {
  dang: "cot-doc";
  soA: number;
  soB: number;
  phep: "+" | "-";
  /** Chữ số trẻ viết ở dòng kết quả, TỪ PHẢI SANG TRÁI. null là ô bỏ trống. */
  chuSoTre: (number | null)[];
}

/** Phép tính viết hàng ngang: 5 + 3 = 8. */
export interface HangNgang {
  dang: "hang-ngang";
  /** Vế trái đúng như trẻ chép, ví dụ "5 + 3" hoặc "12 - 4 + 2". */
  veTrai: string;
  /** Con số trẻ viết sau dấu bằng. null là bỏ trống. */
  ketQuaTre: number | null;
}

/** Điền số vào chỗ trống: 5 + ? = 8. */
export interface DienSo {
  dang: "dien-so";
  /** Biểu thức có đúng một dấu ? đánh dấu ô trống, ví dụ "5 + ? = 8". */
  bieuThuc: string;
  soTre: number | null;
}

/** So sánh: 45 ... 54, trẻ điền dấu. */
export interface SoSanh {
  dang: "so-sanh";
  veTrai: string;
  vePhai: string;
  dauTre: ">" | "<" | "=" | null;
}

/** Trắc nghiệm khoanh đáp án. */
export interface TracNghiem {
  dang: "trac-nghiem";
  /** Nội dung từng lựa chọn, theo thứ tự A, B, C, D. */
  luaChon: string[];
  /** Chỉ số lựa chọn trẻ khoanh. null là chưa khoanh, -1 là khoanh nhiều hơn một. */
  chonTre: number | null;
  /**
   * Chỉ số đáp án đúng, nếu xác định được từ chính đề trong ảnh.
   * Không xác định được thì để null và bộ chấm sẽ nói thẳng là chưa kết luận.
   */
  dapAnDung: number | null;
}

/**
 * Bài giải có lời văn: câu lời giải, phép tính, đáp số.
 *
 * Đây là dạng khó nhất và cũng là dạng chiếm 6 trên 10 điểm của đề lớp 2 theo
 * quan sát 6 của BRD, nên không thể bỏ qua.
 */
export interface BaiGiaiLoiVan {
  dang: "bai-giai-loi-van";
  /** Đề bài, nếu đọc được trên cùng trang. */
  deBai: string | null;
  /** Câu lời giải trẻ viết, ví dụ "Số quả cam còn lại là:". */
  cauLoiGiai: string | null;
  /** Phép tính trẻ viết, ví dụ "32 - 8 = 24". */
  phepTinh: string | null;
  /** Đáp số trẻ viết, ví dụ "24 quả". */
  dapSo: string | null;
}

/** Đổi đơn vị đo: 320 cm = ? m ? cm. */
export interface DoiDonVi {
  dang: "doi-don-vi";
  soNguon: number;
  donViNguon: "cm" | "dm" | "m" | "kg" | "g" | "l";
  donViDich: "cm" | "dm" | "m" | "kg" | "g" | "l";
  ketQuaTre: number | null;
}

/** Đếm hình, đếm đồ vật: một con số duy nhất. */
export interface DemHinh {
  dang: "dem-hinh";
  /** Số hình thật sự có trong đề, nếu đếm được từ ảnh. */
  soThat: number | null;
  ketQuaTre: number | null;
}

/** Xem giờ trên đồng hồ kim. */
export interface XemGio {
  dang: "xem-gio";
  /** Vị trí kim trong đề, nếu đọc được. */
  gioThat: number | null;
  phutThat: number | null;
  gioTre: number | null;
  phutTre: number | null;
}

/** Nối hai cột cho khớp nhau. */
export interface NoiGhep {
  dang: "noi-ghep";
  /** Các cặp trẻ đã nối: nhãn bên trái và nhãn bên phải. */
  capTre: { trai: string; phai: string }[];
  /** Đáp án đúng, nếu suy ra được từ đề. */
  capDung: { trai: string; phai: string }[] | null;
}

/**
 * Dạng Ô Ly đọc được chữ nhưng không xếp được vào khuôn nào đã biết.
 *
 * Dạng này BẮT BUỘC phải tồn tại. VM-08 đòi chấm mọi dạng bài, nhưng "mọi dạng"
 * của một chương trình có thật luôn rộng hơn danh sách mà đội phát triển nghĩ
 * ra được. Không có nhánh này thì một trang vở lạ sẽ hoặc bị chấm bừa, hoặc rơi
 * vào lỗi kỹ thuật — cả hai đều tệ hơn là nói thật với phụ huynh rằng Ô Ly đọc
 * được nhưng chưa dám kết luận.
 */
export interface ChuaNhanDang {
  dang: "chua-nhan-dang";
  /** Những gì đọc được, để phụ huynh tự đối chiếu. */
  docDuoc: string;
  ghiChu: string | null;
}

export type DangBaiLam =
  | CotDoc | HangNgang | DienSo | SoSanh | TracNghiem
  | BaiGiaiLoiVan | DoiDonVi | DemHinh | XemGio | NoiGhep | ChuaNhanDang;

export type MaDang = DangBaiLam["dang"];

/** Mọi mã dạng, dùng để kiểm thử rằng sổ đăng ký không bỏ sót dạng nào. */
export const MOI_MA_DANG: MaDang[] = [
  "cot-doc", "hang-ngang", "dien-so", "so-sanh", "trac-nghiem",
  "bai-giai-loi-van", "doi-don-vi", "dem-hinh", "xem-gio", "noi-ghep",
  "chua-nhan-dang",
];
