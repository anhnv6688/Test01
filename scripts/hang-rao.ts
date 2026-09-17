/**
 * Hàng rào mật khẩu của bản thử — phía bộ soi.
 *
 * Bản thử nằm ở một địa chỉ công khai, và từ lúc có chứng chỉ Let's Encrypt thì
 * tên miền ấy nằm trong Certificate Transparency log: công khai, và có bot quét
 * log đó liên tục. `robots.txt` chặn máy quét nhưng đó là lời đề nghị, không
 * phải cái khóa. Nên Caddy dựng một lớp basic auth trước toàn bộ trang.
 *
 * Hệ quả: bộ soi tự động cũng bị chặn. Không có mã ở đây thì mọi bước kiểm đều
 * nhận 401 và cả đường ống đỏ vì một lý do chẳng liên quan gì tới sản phẩm.
 *
 * Vì sao vá thẳng vào `fetch` toàn cục thay vì sửa từng chỗ gọi.
 *
 * Hai bộ soi cộng lại có tám chỗ gọi `fetch`, nằm rải rác. Sửa từng chỗ thì
 * quên một chỗ là chuyện gần như chắc chắn — và hôm nay đã quên đúng một chỗ
 * tới hai lần: OLY_CHROME khai cho kiem-giao-dien mà không khai cho
 * kiem-moi-truong, rồi NODE_TLS_REJECT_UNAUTHORIZED cũng y hệt. Cả hai lần đều
 * hỏng ở chỗ khó đoán và tốn một vòng chạy để tìm ra.
 *
 * Một chỗ vá thì không quên được chỗ nào. Đánh đổi là `fetch` không còn là hàm
 * gốc của Node nữa, nên chỗ này phải rõ ràng và hẹp: chỉ thêm đúng một tiêu đề,
 * chỉ cho địa chỉ đang soi, và không đụng tới bất cứ thứ gì khác.
 */

/** Tên đăng nhập của hàng rào. Một tài khoản chung cho cả đội là đủ. */
export const TEN_DANG_NHAP_HANG_RAO = "noi-bo";

export interface ThongTinHangRao {
  username: string;
  password: string;
}

/**
 * Mật khẩu hàng rào, lấy từ môi trường. Không có thì trả null và mọi thứ chạy
 * như cũ — máy chủ chưa dựng hàng rào thì bộ soi cũng không cần mã.
 */
export function matKhauHangRao(): string | null {
  const mk = process.env.OLY_MAT_KHAU_THU;
  return mk && mk.length > 0 ? mk : null;
}

export function thongTinHangRao(): ThongTinHangRao | undefined {
  const mk = matKhauHangRao();
  return mk ? { username: TEN_DANG_NHAP_HANG_RAO, password: mk } : undefined;
}

/**
 * Bật hàng rào cho `fetch` toàn cục, đúng một lần.
 *
 * Chỉ thêm tiêu đề cho địa chỉ bắt đầu bằng `goc` — bộ soi không gọi ra đâu
 * khác, nhưng nếu về sau có ai thêm một lệnh gọi ra ngoài thì mật khẩu của bản
 * thử tuyệt đối không được đi theo nó.
 *
 * Không đè lên `Authorization` nếu chỗ gọi đã tự đặt: chỗ gọi biết rõ hơn.
 */
export function batHangRaoChoFetch(goc: string): boolean {
  const mk = matKhauHangRao();
  if (!mk) return false;

  const ma = Buffer.from(`${TEN_DANG_NHAP_HANG_RAO}:${mk}`).toString("base64");
  const goc0 = goc.replace(/\/+$/, "");
  const fetchGoc = globalThis.fetch;

  globalThis.fetch = ((dau: Parameters<typeof fetch>[0], tuyChon?: RequestInit) => {
    const diaChi = typeof dau === "string" ? dau : dau instanceof URL ? dau.href : dau.url;
    if (!diaChi.startsWith(goc0)) return fetchGoc(dau, tuyChon);
    const tieuDe = new Headers(tuyChon?.headers ?? (dau instanceof Request ? dau.headers : undefined));
    if (!tieuDe.has("authorization")) tieuDe.set("authorization", `Basic ${ma}`);
    return fetchGoc(dau, { ...tuyChon, headers: tieuDe });
  }) as typeof fetch;

  return true;
}
