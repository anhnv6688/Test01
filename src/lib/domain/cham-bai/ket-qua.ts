import type { MaDang } from "./dang-bai-lam";

/**
 * Kết quả chấm, chung cho mọi dạng bài.
 *
 * Ba trường dưới đây là phần quan trọng nhất của cả mô-đun chấm, và cả ba đều
 * sinh ra từ yêu cầu nghiệp vụ chứ không từ nhu cầu kỹ thuật:
 *
 *   dung = null      Ô Ly đọc được nhưng KHÔNG kết luận được. Đây là một kết
 *                    quả hợp lệ, không phải lỗi. VM-08 bắt chấm mọi dạng bài,
 *                    nhưng "chấm được" không đồng nghĩa với "dám kết luận" —
 *                    và đoán bừa một lần là mất niềm tin của phụ huynh (BR-18).
 *
 *   doTinCay         Mức chắc chắn của kết luận. Ô Ly hiển thị mức này cho phụ
 *                    huynh thấy, chứ không giấu đi để trông cho oai.
 *
 *   ngoaiTamKiem     Những gì Ô Ly KHÔNG kiểm được ở dạng bài này. BR-38 đòi
 *                    nói rõ hệ thống có thể đọc sai và phụ huynh là người quyết
 *                    định cuối cùng; cách nói rõ tử tế nhất là chỉ đích danh
 *                    phần Ô Ly không dám nhận.
 */
export interface BuocCham {
  /** Tên bước theo cách gọi của trẻ và cô giáo: "cột đơn vị", "đáp số". */
  nhan: string;
  conViet: string;
  oLyTinh: string;
  dung: boolean | null;
  giaiThich: string;
}

export type DoTinCay = "cao" | "trung-binh" | "thap";

export interface KetQuaCham {
  dang: MaDang;
  tenDang: string;
  dung: boolean | null;
  buoc: BuocCham[];
  /** Chỉ số bước sai đầu tiên trong mảng buoc. null nếu không sai bước nào. */
  buocSaiDauTien: number | null;
  /** Mã bẫy suy ra từ kiểu sai, để nối vào bản tin tối (BR-04, BR-08). */
  trapId: string | null;
  /** Câu viết cho phụ huynh đọc, bằng ngôn ngữ giảng bài (BR-27, BR-29). */
  choPhuHuynh: string;
  doTinCay: DoTinCay;
  ngoaiTamKiem: string[];
}

export const CHUA_KET_LUAN = "Ô Ly chưa dám kết luận bài này";

/** Dựng kết quả "đọc được nhưng chưa kết luận được", dùng chung nhiều chỗ. */
export function chuaKetLuan(
  dang: MaDang,
  tenDang: string,
  choPhuHuynh: string,
  buoc: BuocCham[] = [],
  ngoaiTamKiem: string[] = [],
): KetQuaCham {
  return {
    dang,
    tenDang,
    dung: null,
    buoc,
    buocSaiDauTien: null,
    trapId: null,
    choPhuHuynh,
    doTinCay: "thap",
    ngoaiTamKiem,
  };
}

/** Bước đầu tiên có dung === false. Bước chưa kết luận không tính là sai. */
export function timBuocSai(buoc: BuocCham[]): number | null {
  const i = buoc.findIndex((b) => b.dung === false);
  return i === -1 ? null : i;
}
