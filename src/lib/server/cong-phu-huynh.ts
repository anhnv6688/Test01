import { cookies } from "next/headers";
import { hoDauTien, layHo, type Ho } from "./repo";

/**
 * Cổng vào bề mặt phụ huynh.
 *
 * NT-10 đòi hai bề mặt tách bạch, và BR-03 nói rõ lý do: nhóm F cung cấp lời
 * giải đầy đủ cho phụ huynh, nên nếu hai bề mặt dùng chung một màn hình thì
 * nguyên tắc không cho trẻ xem đáp án sụp đổ ngay khi trẻ mượn điện thoại của
 * mẹ. Cổng này là ranh giới đó.
 *
 * Mã PIN bốn số không phải là bảo mật chống người lớn; nó là rào chắn chống một
 * đứa trẻ bảy tuổi tò mò, và đó đúng là mối đe dọa cần chặn ở đây. Phần xác
 * thực tài khoản thật sự thuộc về tài liệu đặc tả sau, cùng với CR-05 về xác
 * minh độ tuổi và sự đồng ý của người đại diện theo pháp luật.
 */
export const TEN_COOKIE = "oly_cong_phu_huynh";

export async function daMoCong(): Promise<Ho | null> {
  const c = await cookies();
  const id = c.get(TEN_COOKIE)?.value;
  if (!id) return null;
  return layHo(id);
}

export async function moCong(pin: string): Promise<{ ok: boolean; loi?: string }> {
  const ho = hoDauTien();
  if (!ho) return { ok: false, loi: "Chưa có hộ nào trong máy này." };
  if (pin.trim() !== ho.pin) return { ok: false, loi: "Mã PIN chưa đúng. Anh chị thử lại nhé." };
  const c = await cookies();
  c.set(TEN_COOKIE, ho.id, {
    httpOnly: true,
    sameSite: "lax",
    /*
     * Chỉ gửi cookie qua HTTPS khi chạy thật.
     *
     * Cookie này là chìa vào phần chứa lời giải đầy đủ và các thao tác trên dữ
     * liệu hộ. Không có cờ này thì nó đi qua cả đường HTTP, tức là đọc trộm
     * được trên một mạng wifi công cộng. Để tắt ở bản phát triển vì máy tại chỗ
     * không có chứng chỉ, và bật lên thì không đăng nhập được.
     */
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return { ok: true };
}

export async function dongCong(): Promise<void> {
  const c = await cookies();
  c.delete(TEN_COOKIE);
}
