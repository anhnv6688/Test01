import { VUNG_DAU_TRANG_MAC_DINH, type VungDaChe } from "@/lib/privacy/redaction";
import { DUOI_ANH_NHAN } from "@/lib/do-anh/gan-nhan";

/**
 * Che dải họ tên TRƯỚC KHI ảnh vào bo-anh-do/.
 *
 * Vì sao có tệp này, dù luồng phụ huynh đã che sẵn: hai luồng khác nhau.
 *
 * Phụ huynh chụp qua trình duyệt, và ở đó lớp che chạy trên chính máy họ —
 * `src/app/phu-huynh/chup/che-anh.ts` tô đè dải đầu trang rồi mới mã hóa JPEG,
 * nên ảnh gốc không bao giờ rời khỏi điện thoại. Việc ấy đã xong và không cần
 * ai làm gì thêm.
 *
 * Bộ ảnh ĐO thì đi đường khác: người làm sản phẩm chép ảnh từ máy ảnh, từ tin
 * nhắn, từ thẻ nhớ vào một thư mục trên máy mình. Không có trình duyệt nào ở
 * giữa, nên không có lớp che nào chạy. Quy ước của kho mã vì thế bắt che tay
 * trước khi bỏ vào thư mục — mà "che tay" thì tốn thời gian, và thứ gì tốn thời
 * gian thì sớm muộn cũng có người bỏ qua đúng vào hôm bận nhất.
 *
 * Nên chỗ này tự động hóa đúng việc đó, bằng CÙNG một dải với luồng phụ huynh.
 * Đó không phải trùng hợp: bộ đo phải đo thứ mô hình thật sự nhìn thấy khi chạy
 * thật. Che rộng hơn thì báo cáo bi quan hơn thực tế; che hẹp hơn thì báo cáo
 * lạc quan hơn thực tế, và còn để lọt tên trẻ.
 */

/** Cạnh chứa dải họ tên. Trang vở khổ dọc thì gần như luôn là cạnh trên. */
export type CanhChe = "tren" | "duoi" | "trai" | "phai";

export const MOI_CANH_CHE: CanhChe[] = ["tren", "duoi", "trai", "phai"];

/**
 * Bề dày dải che, tính theo phần của cạnh.
 *
 * Lấy thẳng từ luồng phụ huynh chứ không đặt một con số riêng ở đây. Hai con số
 * rời nhau thì chúng sẽ lệch nhau — và lúc lệch, bộ đo lặng lẽ đo một thứ khác
 * với thứ đang chạy thật, mà không có gì báo.
 */
export const TY_LE_CHE_MAC_DINH = VUNG_DAU_TRANG_MAC_DINH.h;

export function vungCheTheoCanh(canh: CanhChe, tyLe = TY_LE_CHE_MAC_DINH): VungDaChe {
  const t = Math.min(1, Math.max(0, tyLe));
  switch (canh) {
    case "tren": return { x: 0, y: 0, w: 1, h: t };
    case "duoi": return { x: 0, y: 1 - t, w: 1, h: t };
    case "trai": return { x: 0, y: 0, w: t, h: 1 };
    case "phai": return { x: 1 - t, y: 0, w: t, h: 1 };
  }
}

/**
 * Ảnh nằm ngang thì KHÔNG đoán cạnh nào.
 *
 * Trang vở là khổ dọc. Ảnh nằm ngang nghĩa là một trong hai chuyện, và cả hai
 * đều làm dải trên cùng thành chỗ sai:
 *
 *   - Điện thoại cầm ngang để lấy hết bề rộng trang (điều kiện `xoay-90` trong
 *     nhan.ts, gặp ngay ở lô ảnh thật đầu tiên). Cả trang quay một phần tư
 *     vòng, nên dải họ tên nằm ở cạnh BÊN.
 *   - Chụp cả hai trang mở ra. Khi đó có thể có hai dải họ tên, hoặc không có
 *     dải nào ở rìa ảnh.
 *
 * Đoán bừa trong hai trường hợp này là tô đè một dải giấy trắng rồi báo "đã
 * che" trong khi tên trẻ vẫn nằm nguyên trong ảnh. Một phép che báo xanh mà
 * không che gì thì tệ hơn hẳn không có phép che nào: nó tạo ra niềm tin sai.
 *
 * Nên ở đây từ chối, và bắt người chạy nói ra cạnh nào.
 */
export function phaiHoiCanh(rong: number, cao: number): boolean {
  return rong > cao;
}

export interface AnhVao {
  ten: string;
  rong: number;
  cao: number;
}

export type QuyetDinhChe =
  | { che: true; canh: CanhChe; vung: VungDaChe }
  | { che: false; lyDo: string };

/**
 * Quyết định che thế nào cho một ảnh. Thuần tính toán, không đụng vào tệp —
 * để bài kiểm thử chạy được mà không cần một trình duyệt và một bộ ảnh thật.
 */
export function quyetDinhChe(
  anh: AnhVao,
  canhKhai: CanhChe | null,
  tyLe = TY_LE_CHE_MAC_DINH,
): QuyetDinhChe {
  if (anh.rong <= 0 || anh.cao <= 0) {
    return { che: false, lyDo: "không đọc được kích thước ảnh" };
  }
  if (canhKhai) return { che: true, canh: canhKhai, vung: vungCheTheoCanh(canhKhai, tyLe) };
  if (phaiHoiCanh(anh.rong, anh.cao)) {
    return {
      che: false,
      lyDo:
        `ảnh nằm ngang (${anh.rong}×${anh.cao}) nên dải họ tên không chắc ở cạnh trên. ` +
        "Chạy lại riêng những ảnh này kèm --canh trai|phai|tren|duoi.",
    };
  }
  return { che: true, canh: "tren", vung: vungCheTheoCanh("tren", tyLe) };
}

/**
 * Chromium không giải mã được HEIC/HEIF, mà ảnh iPhone mặc định là HEIC.
 *
 * Nói thẳng ra thay vì bỏ qua lặng lẽ: một tệp bị bỏ qua trong im lặng sẽ được
 * hiểu là "đã che xong", rồi có người chép tay nó vào thư mục.
 */
export const DUOI_KHONG_GIAI_MA_DUOC = [".heic", ".heif"];

export function giaiMaDuocKhong(ten: string): boolean {
  const t = ten.toLowerCase();
  return !DUOI_KHONG_GIAI_MA_DUOC.some((d) => t.endsWith(d));
}

export function laAnhVaoDuoc(ten: string): boolean {
  if (ten.startsWith(".")) return false;
  const t = ten.toLowerCase();
  return DUOI_ANH_NHAN.some((d) => t.endsWith(d));
}

/**
 * Tên tệp ra: luôn .jpg, vì thứ ghi xuống là JPEG đã mã hóa lại từ canvas.
 *
 * Giữ nguyên phần tên để còn đối chiếu được với ảnh gốc bên ngoài kho, nhưng
 * bỏ đường dẫn và mọi ký tự lạ — tên tệp từ máy ảnh và từ tin nhắn có đủ thứ
 * trong đó, và tệp này ghi thẳng vào thư mục mà trang gắn nhãn sẽ đọc.
 */
export function tenTepRa(ten: string): string {
  const goc = ten.replace(/\\/g, "/").split("/").pop() ?? ten;
  const khongDuoi = goc.replace(/\.[^.]+$/, "");
  const sach = khongDuoi.replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "");
  return `${sach || "anh"}.jpg`;
}
