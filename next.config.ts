import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Gói kèm mọi thứ cần để chạy vào .next/standalone.
   *
   * Nhờ vậy máy chủ chạy bằng đúng một lệnh `node server.js` mà không cần
   * node_modules bên cạnh, nên ảnh Docker nhỏ hẳn và không phải cài lại gói khi
   * khởi động. Xem Dockerfile và docs/dua-len-mang.md.
   */
  output: "standalone",

  /*
   * better-sqlite3 là gói có phần mã máy biên dịch sẵn, không gói chung vào
   * gói phát hành được. Khai ở đây để Next để nguyên nó ở dạng gói ngoài.
   */
  serverExternalPackages: ["better-sqlite3"],

  /*
   * Không khoe tên phần mềm máy chủ ở tiêu đề X-Powered-By.
   *
   * Nó không phải lỗ hổng, nhưng nó nói cho người dò biết nên thử những lỗ hổng
   * nào của phiên bản nào. Tắt đi thì mất một mẩu thông tin miễn phí mà người
   * dò vốn được cho không.
   */
  poweredByHeader: false,
};

export default nextConfig;
