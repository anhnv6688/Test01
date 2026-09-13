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

function dungTheoCauHinh(): NhaCungCapXuLyAnh {
  const coKhoa = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  const daKyDu =
    process.env.OLY_DPA_DA_KY === "true" &&
    process.env.OLY_DPA_CAM_HUAN_LUYEN === "true" &&
    process.env.OLY_DPA_CAM_LUU_GIU === "true";

  if (!coKhoa || !daKyDu) {
    if (coKhoa && !daKyDu) {
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
