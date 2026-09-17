import { NhaCungCapGiaLap } from "./mock";
import type { NhaCungCapXuLyAnh } from "./provider";

/**
 * Chọn nhà cung cấp xử lý ảnh.
 *
 * RR-08: dự án không được phụ thuộc vào một nhà cung cấp duy nhất về giá và
 * điều khoản. Phần còn lại của hệ thống chỉ biết tới giao diện
 * NhaCungCapXuLyAnh, và đây là chỗ duy nhất quyết định dùng bản cài đặt nào.
 *
 * Mặc định là bản giả lập. Muốn chạy bằng nhà cung cấp thật thì phải bật đủ ba
 * cờ xác nhận đã ký thỏa thuận xử lý dữ liệu (CR-03, CR-16) và có khóa API.
 * Thiếu bất kỳ điều kiện nào thì hệ thống quay về bản giả lập và ghi một dòng
 * cảnh báo — chứ không lặng lẽ gửi dữ liệu thật của trẻ ra ngoài.
 */
let nhaCungCap: NhaCungCapXuLyAnh | null = null;

/**
 * Ảnh chụp trên máy này có thật sự rời khỏi máy chủ không.
 *
 * Tách ra thành hàm riêng vì có hai chỗ cần biết, và chúng phải không bao giờ
 * trả lời khác nhau: chỗ chọn nhà cung cấp ở dưới, và dải báo của bản thử nói
 * cho người đang test biết ảnh của họ đi đâu. Viết lại điều kiện ở chỗ thứ hai
 * là mở đường cho một ngày nó lệch với chỗ thứ nhất — và lúc đó dải báo sẽ nói
 * "ảnh không đi đâu cả" trong khi ảnh đang được gửi đi.
 */
export function anhCoGuiRaNgoaiKhong(): boolean {
  const coKhoa = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  const daKyDu =
    process.env.OLY_DPA_DA_KY === "true" &&
    process.env.OLY_DPA_CAM_HUAN_LUYEN === "true" &&
    process.env.OLY_DPA_CAM_LUU_GIU === "true";
  return coKhoa && daKyDu;
}

function dungTheoCauHinh(): NhaCungCapXuLyAnh {
  const coKhoa = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

  if (!anhCoGuiRaNgoaiKhong()) {
    if (coKhoa) {
      console.warn(
        "[Ô Ly] Có khóa API nhưng chưa bật đủ ba cờ xác nhận đã ký thỏa thuận xử lý dữ liệu " +
          "(OLY_DPA_DA_KY, OLY_DPA_CAM_HUAN_LUYEN, OLY_DPA_CAM_LUU_GIU). " +
          "Đang dùng bản giả lập. Xem CR-03 và CR-16.",
      );
    }
    return new NhaCungCapGiaLap();
  }

  // Nạp muộn để môi trường không có khóa API vẫn không phải tải gói nặng.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NhaCungCapClaude } = require("./claude") as typeof import("./claude");
  return new NhaCungCapClaude();
}

export function layNhaCungCap(): NhaCungCapXuLyAnh {
  if (!nhaCungCap) nhaCungCap = dungTheoCauHinh();
  return nhaCungCap;
}

/** Dùng khi kiểm thử, hoặc khi cắm một nhà cung cấp khác (RR-08). */
export function datNhaCungCap(n: NhaCungCapXuLyAnh): void {
  nhaCungCap = n;
}
