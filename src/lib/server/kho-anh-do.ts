import { copyFile, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { boNhanRong, laTenAnhHopLe, locTenAnh } from "@/lib/do-anh/gan-nhan";
import { kiemTraNhan, type NhanBoAnh } from "@/lib/do-anh/nhan";
import { laBanPhatHanh } from "./moi-truong";

/**
 * Đọc ghi thư mục bộ ảnh đo, cho trang gắn nhãn cục bộ.
 *
 * Thư mục này chứa ẢNH TRANG VỞ CỦA TRẺ THẬT. Vì vậy mọi thứ trong tệp này đi
 * qua đúng một cánh cửa — `congCuGanNhanMoKhong()` — và cánh cửa đó KHÓA HẲN ở
 * bản phát hành, không có biến môi trường nào mở lại được.
 *
 * Vì sao không cho mở lại bằng khai báo, trong khi hộ mẫu và mã trực thì có:
 * hộ mẫu là dữ liệu bịa ra, mã trực là quyền của người vận hành đã biết mình
 * làm gì. Còn trang này phục vụ ảnh chưa che, từ đĩa của máy chủ, cho bất cứ ai
 * gọi đúng địa chỉ. Một công cụ như thế không có trường hợp dùng đúng nào trên
 * một máy chủ công khai, nên nó không cần một nút để bật. Thêm nút bật là thêm
 * đúng một cách để sự cố xảy ra.
 *
 * Gắn nhãn xong thì `nhan.json` nằm lại trong thư mục ảnh, cạnh ảnh, và cả thư
 * mục đã bị `.gitignore` lẫn `npm run khong-ro-ri` chặn khỏi kho mã.
 */

export const THU_MUC_MAC_DINH = "bo-anh-do";
export const TEN_TEP_NHAN = "nhan.json";

export class CongCuKhoaError extends Error {
  constructor() {
    super(
      "Trang gắn nhãn chỉ chạy ở bản phát triển. Nó phục vụ ảnh trang vở của trẻ " +
        "từ đĩa, nên không có bản phát hành nào được mở nó.",
    );
    this.name = "CongCuKhoaError";
  }
}

export function congCuGanNhanMoKhong(): boolean {
  return !laBanPhatHanh();
}

function chanNeuKhoa(): void {
  if (!congCuGanNhanMoKhong()) throw new CongCuKhoaError();
}

/** Thư mục ảnh. Đổi được bằng OLY_THU_MUC_ANH để gắn nhãn nhiều lô khác nhau. */
export function thuMucAnhDo(): string {
  return path.resolve(process.env.OLY_THU_MUC_ANH || THU_MUC_MAC_DINH);
}

export async function danhSachAnh(): Promise<string[]> {
  chanNeuKhoa();
  try {
    return locTenAnh(await readdir(thuMucAnhDo()));
  } catch (e) {
    // Chưa có thư mục thì trả danh sách rỗng, để giao diện hướng dẫn tạo nó,
    // chứ không hiện một lỗi kỹ thuật cho việc "anh chưa bỏ ảnh vào".
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

const KIEU_THEO_DUOI: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

export async function docAnh(tep: string): Promise<{ du: Buffer; kieu: string }> {
  chanNeuKhoa();
  if (!laTenAnhHopLe(tep)) throw new Error(`Tên tệp không hợp lệ: ${tep}`);
  const du = await readFile(path.join(thuMucAnhDo(), tep));
  return { du, kieu: KIEU_THEO_DUOI[path.extname(tep).toLowerCase()] ?? "application/octet-stream" };
}

export async function docNhan(): Promise<NhanBoAnh> {
  chanNeuKhoa();
  try {
    const tho = JSON.parse(await readFile(path.join(thuMucAnhDo(), TEN_TEP_NHAN), "utf8"));
    /*
     * Tệp nhãn đang gắn dở thì CHƯA hợp lệ theo kiemTraNhan: những ảnh mới thêm
     * chưa có bài nào. Đó là trạng thái bình thường của việc gắn nhãn, nên ở
     * đây chỉ kiểm hình dạng tối thiểu. Bộ đo mới là chỗ gọi kiemTraNhan và từ
     * chối một tệp dở dang, và nó từ chối TRƯỚC khi gọi mô hình lần nào.
     */
    if (!tho || typeof tho !== "object" || !Array.isArray(tho.anh)) {
      throw new Error("nhan.json không có danh sách ảnh");
    }
    return tho as NhanBoAnh;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return boNhanRong("");
    throw e;
  }
}

/**
 * Ghi tệp nhãn.
 *
 * Ghi ra tệp tạm rồi đổi tên, và giữ lại bản trước đó. Đây không phải cẩn thận
 * thừa: tệp này là công sức gõ tay của hàng trăm bài, và nếu tiến trình chết
 * giữa lúc ghi đè thì cái còn lại là một tệp JSON cụt — mất sạch. Đổi tên là
 * thao tác nguyên tử trên cùng một hệ tệp, nên hoặc còn bản cũ nguyên vẹn,
 * hoặc đã có bản mới nguyên vẹn, không có ở giữa.
 */
export async function ghiNhan(bo: NhanBoAnh): Promise<void> {
  chanNeuKhoa();
  const thuMuc = thuMucAnhDo();
  await mkdir(thuMuc, { recursive: true });
  const dich = path.join(thuMuc, TEN_TEP_NHAN);
  const tam = path.join(thuMuc, `${TEN_TEP_NHAN}.dang-ghi`);
  try {
    await copyFile(dich, path.join(thuMuc, `${TEN_TEP_NHAN}.truoc`));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  await writeFile(tam, `${JSON.stringify(bo, null, 2)}\n`, "utf8");
  await rename(tam, dich);
}

/** Tệp nhãn đã đủ điều kiện để chạy bộ đo chưa. */
export function sanSangChayDo(bo: NhanBoAnh): { duoc: boolean; viSao: string | null } {
  try {
    kiemTraNhan(bo);
    return { duoc: true, viSao: null };
  } catch (e) {
    return { duoc: false, viSao: e instanceof Error ? e.message : String(e) };
  }
}
