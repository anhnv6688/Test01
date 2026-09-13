import type { GoiGuiDi } from "@/lib/privacy/envelope";

/**
 * Giao diện nhà cung cấp dịch vụ xử lý ảnh.
 *
 * RR-08: dự án không được phụ thuộc vào một nhà cung cấp duy nhất về giá và
 * điều khoản. Vì vậy phần còn lại của hệ thống chỉ biết tới giao diện này; đổi
 * nhà cung cấp là viết một lớp cài đặt mới, không đụng tới luồng nghiệp vụ.
 *
 * Đầu vào cố ý là GoiGuiDi chứ không phải một đối tượng tự do: gói đó đã qua
 * danh sách trắng của BR-34 nên không thể vô tình mang theo mã truy ngược.
 */
export type MaLoiAnh =
  | "anh-toi-qua"
  | "anh-mo"
  | "anh-nghieng"
  | "khong-thay-chu"
  | "ngoai-pham-vi";

export interface LoiDocAnh {
  ma: MaLoiAnh;
  /** Câu nói cho phụ huynh, nêu rõ lý do và cách chụp lại (BR-31). */
  noiGiVoiPhuHuynh: string;
}

export const GIAI_THICH_LOI: Record<MaLoiAnh, string> = {
  "anh-toi-qua":
    "Ảnh hơi tối nên Ô Ly không đọc được chữ. Anh chị bật đèn bàn rồi chụp lại giúp nhé. Lần chụp này không bị trừ lượt.",
  "anh-mo":
    "Ảnh bị nhòe. Anh chị giữ máy yên khoảng một giây rồi chụp lại giúp nhé. Lần chụp này không bị trừ lượt.",
  "anh-nghieng":
    "Trang giấy bị nghiêng nhiều quá. Anh chị cầm máy song song với mặt bàn rồi chụp lại nhé. Lần chụp này không bị trừ lượt.",
  "khong-thay-chu":
    "Ô Ly không tìm thấy dòng chữ nào trong ảnh. Anh chị chụp lại sao cho cả trang nằm gọn trong khung nhé. Lần chụp này không bị trừ lượt.",
  "ngoai-pham-vi":
    "Bài trong ảnh nằm ngoài phạm vi lớp 1–2 mà Ô Ly đang phục vụ. Ô Ly chưa dám đoán để khỏi giảng sai cho con. Lần chụp này không bị trừ lượt.",
};

/** Một bước trẻ đã viết trên giấy, do bên xử lý đọc ra. */
export interface BuocDocDuoc {
  /** Nhãn bước: ví dụ "cột đơn vị", "phép tính 1". */
  nhan: string;
  /** Chuỗi thô đọc được, chưa diễn giải. */
  noiDung: string;
}

export interface KetQuaDocDe {
  loai: "doc-de-bai";
  deBai: string;
  /** Khuôn dạng khớp trong kho, nếu nhận ra. Không nhận ra thì null. */
  khuonDangKhop: string | null;
  cacSo: number[];
  /** Cờ nghi ngờ đề có vấn đề, ví dụ thiếu dữ kiện (BR-18). */
  nghiNgo: string | null;
}

export interface KetQuaChamAnh {
  loai: "cham-bai-lam";
  phepTinh: "+" | "-";
  soA: number;
  soB: number;
  /** Chữ số trẻ viết ở dòng kết quả, từ phải sang trái. */
  chuSoTre: (number | null)[];
  buocDocDuoc: BuocDocDuoc[];
}

export type KetQuaXuLy =
  | { ok: true; ketQua: KetQuaDocDe | KetQuaChamAnh }
  | { ok: false; loi: LoiDocAnh };

export interface NhaCungCapXuLyAnh {
  ten: string;
  /**
   * Điều khoản bắt buộc theo CR-03 và CR-16: không lưu giữ, không dùng để huấn
   * luyện. Trường này để hiển thị trong trang minh bạch, và để không ai cắm một
   * nhà cung cấp mới vào hệ thống mà quên phần hợp đồng.
   */
  thoaThuan: {
    daKy: boolean;
    camDungDeHuanLuyen: boolean;
    camLuuGiu: boolean;
    ngayKy: string | null;
  };
  xuLy(goi: GoiGuiDi, chatLuongAnh: ChatLuongAnh): Promise<KetQuaXuLy>;
}

/**
 * Số đo chất lượng ảnh do chính trình duyệt tính trước khi gửi (BR-30).
 *
 * Người dùng thật là phụ huynh cầm điện thoại chụp trang vở ô ly lúc chín giờ
 * tối, không phải ảnh quét phẳng. Tính ở máy khách giúp báo sớm cho họ, và giúp
 * tiết kiệm đúng khoản chi phí mà BR-19 muốn kiểm soát.
 */
export interface ChatLuongAnh {
  /** Độ sáng trung bình, 0–255. */
  doSang: number;
  /** Độ tương phản, dùng làm chỉ báo nhòe. */
  doTuongPhan: number;
  /** Cạnh dài của ảnh, tính bằng điểm ảnh. */
  canhDai: number;
}

export const NGUONG_TOI = 60;
export const NGUONG_NHOE = 18;
export const NGUONG_NHO = 640;

export function tienKiemChatLuong(cl: ChatLuongAnh): MaLoiAnh | null {
  if (cl.doSang < NGUONG_TOI) return "anh-toi-qua";
  if (cl.doTuongPhan < NGUONG_NHOE) return "anh-mo";
  if (cl.canhDai < NGUONG_NHO) return "khong-thay-chu";
  return null;
}
