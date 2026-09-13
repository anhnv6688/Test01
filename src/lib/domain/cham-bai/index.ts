import {
  chamBaiGiaiLoiVan, chamChuaNhanDang, chamCotDocChung, chamDemHinh, chamDienSo,
  chamDoiDonVi, chamHangNgang, chamNoiGhep, chamSoSanh, chamTracNghiem, chamXemGio,
} from "./bo-cham";
import type { DangBaiLam, MaDang } from "./dang-bai-lam";
import type { KetQuaCham } from "./ket-qua";

/**
 * Sổ đăng ký bộ chấm.
 *
 * VM-08 chốt ngày 13/9/2026: bản đầu tiên chấm được MỌI dạng bài của chương
 * trình lớp 1–2. Hàm dưới đây là chỗ duy nhất phân nhánh theo dạng, và nó dùng
 * kiểu vét cạn: thêm một dạng mới vào DangBaiLam mà quên viết bộ chấm thì trình
 * biên dịch báo lỗi ngay tại dòng `khongConDangNao`, chứ không lặng lẽ rơi vào
 * nhánh mặc định lúc chạy thật trên bài của một đứa trẻ.
 */
export function chamBaiLam(bai: DangBaiLam): KetQuaCham {
  switch (bai.dang) {
    case "cot-doc": return chamCotDocChung(bai);
    case "hang-ngang": return chamHangNgang(bai);
    case "dien-so": return chamDienSo(bai);
    case "so-sanh": return chamSoSanh(bai);
    case "trac-nghiem": return chamTracNghiem(bai);
    case "bai-giai-loi-van": return chamBaiGiaiLoiVan(bai);
    case "doi-don-vi": return chamDoiDonVi(bai);
    case "dem-hinh": return chamDemHinh(bai);
    case "xem-gio": return chamXemGio(bai);
    case "noi-ghep": return chamNoiGhep(bai);
    case "chua-nhan-dang": return chamChuaNhanDang(bai);
    default: {
      const khongConDangNao: never = bai;
      throw new Error(`Chưa có bộ chấm cho dạng bài: ${JSON.stringify(khongConDangNao)}`);
    }
  }
}

/** Chấm cả trang: một trang vở thường có nhiều bài. */
export function chamCaTrang(cacBai: DangBaiLam[]): KetQuaCham[] {
  return cacBai.map(chamBaiLam);
}

/**
 * Tóm tắt cả trang cho phụ huynh đọc trước khi xem chi tiết từng bài.
 *
 * Con số "chưa kết luận" được nêu ngang hàng với đúng và sai, không giấu xuống
 * dưới: nó là phần Ô Ly cần phụ huynh nhìn hộ, và giấu nó đi là để phụ huynh
 * tưởng bài đã được kiểm hết.
 */
export interface TomTatTrang {
  tongSoBai: number;
  soDung: number;
  soSai: number;
  soChuaKetLuan: number;
  /** Mã các bẫy gặp trong trang, để nối vào bản tin tối (BR-08). */
  trapIds: string[];
  cauChoPhuHuynh: string;
}

export function tomTatTrang(kq: KetQuaCham[]): TomTatTrang {
  const soDung = kq.filter((x) => x.dung === true).length;
  const soSai = kq.filter((x) => x.dung === false).length;
  const soChuaKetLuan = kq.filter((x) => x.dung === null).length;
  const trapIds = [...new Set(kq.map((x) => x.trapId).filter((x): x is string => Boolean(x)))];

  return {
    tongSoBai: kq.length,
    soDung,
    soSai,
    soChuaKetLuan,
    trapIds,
    cauChoPhuHuynh: vietTomTat(kq.length, soDung, soSai, soChuaKetLuan),
  };
}

function vietTomTat(tong: number, dung: number, sai: number, chua: number): string {
  if (tong === 0) return "Ô Ly không tìm thấy bài nào trong ảnh này.";
  const phan: string[] = [];
  if (dung > 0) phan.push(`${dung} bài đúng`);
  if (sai > 0) phan.push(`${sai} bài có chỗ sai`);
  if (chua > 0) phan.push(`${chua} bài Ô Ly chưa dám kết luận`);
  const dau = `Trang này có ${tong} bài: ${phan.join(", ")}.`;
  if (chua > 0) {
    return `${dau} Phần Ô Ly chưa kết luận là phần cần anh chị nhìn hộ — máy đọc chữ viết tay của trẻ không phải lúc nào cũng chắc chắn.`;
  }
  if (sai === 0) return `${dau} Anh chị khen con nhé.`;
  return `${dau} Anh chị xem phần Ô Ly chỉ ra bên dưới, chữa đúng chỗ đó thôi là đủ.`;
}

export { chamBaiLam as cham };
export type { DangBaiLam, MaDang, KetQuaCham };
