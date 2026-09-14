import { cookies } from "next/headers";

/**
 * Cổng vào bảng trực.
 *
 * Đây là bề mặt THỨ BA của sản phẩm, tách khỏi cả bề mặt trẻ lẫn bề mặt phụ
 * huynh. Người dùng nó là nhân sự trực của công ty, không phải khách hàng.
 *
 * Vì sao phải tách hẳn thay vì gắn vào phần của phụ huynh: bảng trực nhìn thấy
 * yêu cầu của MỌI hộ, còn phụ huynh chỉ được nhìn thấy hộ mình. Gộp hai thứ đó
 * vào cùng một cổng là tạo ra một đường để một phụ huynh nhìn sang dữ liệu nhà
 * khác — đúng loại lỗi mà không ai phát hiện cho tới khi quá muộn.
 *
 * Mã trực lấy từ biến môi trường. Bản dựng thử nghiệm có mã mặc định, nhưng
 * trước khi mở cho người dùng thật thì phần này phải thay bằng tài khoản nhân
 * sự có phân quyền và có nhật ký đăng nhập.
 */
export const TEN_COOKIE_TRUC = "oly_cong_truc";

const MA_TRUC = process.env.OLY_MA_TRUC ?? "truc2026";

export interface PhienTruc {
  nguoiTruc: string;
}

export async function daMoCongTruc(): Promise<PhienTruc | null> {
  const c = await cookies();
  const ten = c.get(TEN_COOKIE_TRUC)?.value;
  return ten ? { nguoiTruc: ten } : null;
}

export async function moCongTruc(
  nguoiTruc: string,
  ma: string,
): Promise<{ ok: boolean; loi?: string }> {
  const ten = nguoiTruc.trim();
  if (ten.length < 2) return { ok: false, loi: "Cần ghi tên người trực, để nhật ký biết ai đã xử lý." };
  if (ma.trim() !== MA_TRUC) return { ok: false, loi: "Mã trực chưa đúng." };
  const c = await cookies();
  c.set(TEN_COOKIE_TRUC, ten, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return { ok: true };
}

export async function dongCongTruc(): Promise<void> {
  const c = await cookies();
  c.delete(TEN_COOKIE_TRUC);
}
