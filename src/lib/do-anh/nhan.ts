import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";

/**
 * Nhãn của bộ ảnh đo — sự thật để đối chiếu.
 *
 * Điều kiện ra mắt số 9 đòi "tỷ lệ nhận dạng thành công ngay lần chụp đầu đạt
 * ngưỡng do chủ đầu tư đặt ra, đo trên bộ ảnh chụp trong điều kiện thật". Muốn
 * có tỷ lệ đó thì phải biết đúng ra máy PHẢI đọc được cái gì. Tệp nhãn chính là
 * chỗ ghi điều đó.
 *
 * Nguyên tắc gắn nhãn, và đây là chỗ dễ làm sai nhất: nhãn ghi những gì TRẺ ĐÃ
 * VIẾT trên giấy, KHÔNG phải đáp án đúng của bài. Trẻ viết 47 + 28 = 65 thì
 * nhãn ghi 65. Việc 65 là sai là chuyện của bộ chấm, không phải của nhãn.
 */

/** Điều kiện chụp, để biết máy hỏng ở hoàn cảnh nào (BR-30). */
export type DieuKienChup =
  | "tot"
  | "den-ban-buoi-toi"
  | "thieu-sang"
  | "nhoe"
  | "nghieng"
  | "mat-goc"
  | "xoay-90"
  | "co-ngon-tay";

/**
 * Mô tả từng điều kiện, để trang gắn nhãn không phải đoán và để báo cáo đọc được.
 *
 * Hai nhãn cuối thêm vào sau khi xem lô ảnh thật đầu tiên. Bộ ảnh diễn tập do
 * chính đội phát triển dựng ra nên nó chỉ chứa những hoàn cảnh mà đội nghĩ ra
 * được; ảnh thật thì lô đầu tiên đã có ngay hai thứ không ai liệt kê trước:
 *
 *   xoay-90      Điện thoại cầm ngang để lấy hết bề rộng trang vở. Ảnh lưu
 *                đúng chiều cảm biến, chữ nằm nghiêng 90 độ. Đây KHÔNG phải
 *                "nghieng" — nghiêng là vài độ do cầm lệch, còn cái này là cả
 *                trang quay hẳn một phần tư vòng. Gộp hai thứ vào một nhãn thì
 *                báo cáo không trả lời được câu hỏi đáng tiền nhất: có cần tự
 *                xoay ảnh trước khi gửi đi không.
 *   co-ngon-tay  Ngón tay giữ mép vở, che mất một phần bài. Rất hay gặp vì
 *                trang vở cong, không giữ thì không phẳng.
 *
 * Danh sách này sẽ còn dài ra. Đó là chuyện bình thường và là lý do bộ đo tách
 * kết quả theo điều kiện chứ không chỉ in một tỷ lệ tổng.
 */
export const MO_TA_DIEU_KIEN: Record<DieuKienChup, string> = {
  tot: "Sáng, phẳng, chụp thẳng",
  "den-ban-buoi-toi": "Đèn bàn buổi tối, ánh vàng, có bóng",
  "thieu-sang": "Tối, khó đọc",
  nhoe: "Rung tay, chữ nhòe",
  nghieng: "Cầm lệch vài độ, trang hơi xiên",
  "mat-goc": "Mất một góc trang",
  "xoay-90": "Cả trang quay ngang 90 độ",
  "co-ngon-tay": "Ngón tay che một phần bài",
};

export const MOI_DIEU_KIEN = Object.keys(MO_TA_DIEU_KIEN) as DieuKienChup[];

export interface NhanMotAnh {
  tep: string;
  loaiViec: "cham-bai-lam" | "doc-de-bai";
  dieuKienChup: DieuKienChup;
  /**
   * Một người bình thường nhìn ảnh này có đọc được không.
   *
   * Nếu false thì Ô Ly PHẢI từ chối và nói rõ lý do (BR-31); đọc bừa một ảnh
   * mà người còn không đọc nổi là lỗi nặng hơn từ chối.
   */
  nguoiDocDuoc: boolean;
  /** Với ảnh chấm bài: các bài trẻ đã làm, theo thứ tự từ trên xuống. */
  cacBai?: DangBaiLam[];
  /** Với ảnh đề bài: nguyên văn đề. */
  deBai?: string;
  /** Lớp của trẻ, để bộ đo gửi đúng gợi ý phạm vi. */
  lop?: 1 | 2;
  ghiChu?: string;
}

export interface NhanBoAnh {
  moTa: string;
  nguoiGanNhan: string;
  ganNhanLuc: string;
  anh: NhanMotAnh[];
}

export class NhanKhongHopLeError extends Error {
  constructor(chiTiet: string) {
    super(`Tệp nhãn không hợp lệ: ${chiTiet}`);
    this.name = "NhanKhongHopLeError";
  }
}

/**
 * Kiểm tệp nhãn trước khi chạy.
 *
 * Chạy cả bộ ảnh rồi mới phát hiện nhãn sai là tốn tiền gọi mô hình một cách
 * vô ích, nên kiểm hết trước khi gọi lần đầu.
 */
export function kiemTraNhan(x: unknown): NhanBoAnh {
  if (!x || typeof x !== "object") throw new NhanKhongHopLeError("không phải một đối tượng");
  const n = x as Partial<NhanBoAnh>;
  if (!Array.isArray(n.anh) || n.anh.length === 0) {
    throw new NhanKhongHopLeError("thiếu danh sách ảnh, hoặc danh sách rỗng");
  }
  if (!n.nguoiGanNhan) throw new NhanKhongHopLeError("thiếu tên người gắn nhãn");

  const daThay = new Set<string>();
  for (const [i, a] of n.anh.entries()) {
    const o = `ảnh thứ ${i + 1}`;
    if (!a.tep) throw new NhanKhongHopLeError(`${o} thiếu tên tệp`);
    if (daThay.has(a.tep)) throw new NhanKhongHopLeError(`tệp ${a.tep} bị gắn nhãn hai lần`);
    daThay.add(a.tep);
    if (a.loaiViec !== "cham-bai-lam" && a.loaiViec !== "doc-de-bai") {
      throw new NhanKhongHopLeError(`${o} có loaiViec lạ: ${a.loaiViec}`);
    }
    if (typeof a.nguoiDocDuoc !== "boolean") {
      throw new NhanKhongHopLeError(`${o} thiếu nguoiDocDuoc`);
    }
    // Ảnh người còn không đọc nổi thì không cần nhãn nội dung — đó là ảnh để
    // kiểm tra Ô Ly có biết từ chối hay không.
    if (a.nguoiDocDuoc) {
      if (a.loaiViec === "cham-bai-lam" && (!a.cacBai || a.cacBai.length === 0)) {
        throw new NhanKhongHopLeError(`${o} đọc được nhưng chưa gắn nhãn bài nào`);
      }
      if (a.loaiViec === "doc-de-bai" && !a.deBai) {
        throw new NhanKhongHopLeError(`${o} đọc được nhưng chưa gắn nhãn đề bài`);
      }
    }
  }
  return n as NhanBoAnh;
}

/** Đếm bộ ảnh có phủ đủ các dạng bài hay không — báo trước khi đo. */
export function doPhuDang(nhan: NhanBoAnh): Map<string, number> {
  const dem = new Map<string, number>();
  for (const a of nhan.anh) {
    for (const b of a.cacBai ?? []) dem.set(b.dang, (dem.get(b.dang) ?? 0) + 1);
  }
  return dem;
}
