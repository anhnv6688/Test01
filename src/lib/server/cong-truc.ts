import { cookies } from "next/headers";
import { maTruc } from "./moi-truong";

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

/*
 * Mã mở bảng trực lấy từ moi-truong.ts, không đọc thẳng biến môi trường.
 *
 * Đọc thẳng kèm giá trị mặc định là cách cũ, và nó có nghĩa là một bản phát
 * hành quên khai báo sẽ mở bảng trực bằng một mã ai cũng đoán được — trong khi
 * bảng đó xuất và xóa được dữ liệu của các hộ.
 */

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
  const maDung = maTruc();
  if (!maDung) {
    // Bản phát hành quên khai báo OLY_MA_TRUC: khóa hẳn, không rơi về mã mặc
    // định. Nói rõ lý do để người vận hành biết phải làm gì, thay vì ngồi đoán
    // xem mình gõ sai mã hay hệ thống hỏng.
    return {
      ok: false,
      loi: "Bảng trực chưa mở được vì máy chủ chưa khai báo OLY_MA_TRUC. Nhờ người quản trị đặt biến này rồi khởi động lại.",
    };
  }
  if (ma.trim() !== maDung) return { ok: false, loi: "Mã trực chưa đúng." };
  const c = await cookies();
  c.set(TEN_COOKIE_TRUC, ten, {
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
    maxAge: 60 * 60 * 12,
  });
  return { ok: true };
}

export async function dongCongTruc(): Promise<void> {
  const c = await cookies();
  c.delete(TEN_COOKIE_TRUC);
}
