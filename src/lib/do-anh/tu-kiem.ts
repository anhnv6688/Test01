import type { DongDo } from "./bao-cao";
import { coLoi, type NhaCungCapDienTap } from "./nha-cung-cap-dien-tap";

/**
 * Kiểm lại chính bộ đo, bằng cách gài lỗi đã biết rồi đòi bộ đo nêu đúng.
 *
 * Một bộ đo chưa ai thử là một bộ đo không dùng được: khi nó chạy trên ảnh thật
 * và báo "0 báo động giả", con số đó có thể nghĩa là sản phẩm tốt, mà cũng có
 * thể nghĩa là hàm so sánh hỏng — và không cách nào phân biệt hai khả năng đó.
 *
 * Cách kiểm KHÔNG so tổng với tổng. Bỏ sót một bài ở giữa trang làm mọi bài sau
 * nó lệch đi một nhịp, nên một lỗi gài vào hiện ra thành nhiều dòng lệch; đó là
 * hành vi đúng của soKhopCacBai chứ không phải sai sót. Thứ kiểm được, và kiểm
 * chặt, là từng tấm ảnh: ảnh nào không gài lỗi thì bộ đo phải im, ảnh nào có
 * gài thì bộ đo phải lên tiếng.
 */
export interface LechTuKiem {
  tep: string;
  /** Có gài lỗi vào ảnh này không. */
  daGaiLoi: boolean;
  /** Bộ đo có nêu ra điều gì bất thường không. */
  boDoLenTieng: boolean;
  moTa: string;
}

function boDoLenTieng(d: DongDo): boolean {
  if (d.khop.tuChoiOan || d.khop.docBua) return true;
  if (d.khop.bai.some((b) => b.mucKhop !== "khop-het")) return true;
  if (d.khop.lechKetLuan.some((l) => l !== "giong-nhau")) return true;
  if (d.khopDeBai && d.khopDeBai.muc === "sai-so") return true;
  return false;
}

export function kiemBoDo(dong: DongDo[], dienTap: NhaCungCapDienTap): LechTuKiem[] {
  const lech: LechTuKiem[] = [];
  for (const d of dong) {
    const gai = coLoi(dienTap.loiCuaAnh(d.khop.tep));
    const nghe = boDoLenTieng(d);
    if (gai === nghe) continue;
    lech.push({
      tep: d.khop.tep,
      daGaiLoi: gai,
      boDoLenTieng: nghe,
      moTa: gai
        ? "đã gài lỗi vào ảnh này mà bộ đo không nêu ra — bộ đo đang bỏ sót"
        : "không gài lỗi nào mà bộ đo vẫn báo lệch — bộ đo đang báo động nhầm",
    });
  }
  return lech;
}
