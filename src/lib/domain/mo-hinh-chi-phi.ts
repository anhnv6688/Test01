/**
 * Mô hình chi phí và điểm hòa vốn.
 *
 * Vì sao đây là mã nguồn chứ không phải một bảng tính: BR-22 đòi chi phí thật
 * phải được theo dõi liên tục ở mức từng hộ và so với ngưỡng an toàn, chứ không
 * phát hiện vào cuối quý. Điều kiện ra mắt số 3 đòi chi phí xử lý một trang
 * phải ĐO trên dữ liệu thật, không còn là ước lượng. Cả hai đều cần một chỗ
 * duy nhất, chạy lại được, để cắm số đo thật vào và xem hệ quả.
 *
 * Mọi giả định đều nằm ở GIA_DINH_BRD bên dưới và đều đổi được. Không con số
 * nào trong tệp này là cam kết — chúng là giả định chưa kiểm chứng, đúng như
 * mục 9 của BRD đã cảnh báo.
 */

/** Bậc phân giải ảnh của mô hình đọc ảnh. */
export interface BacPhanGiai {
  canhToiDa: number;
  tokenToiDa: number;
}

/** Claude 4.7 trở lên. Nhìn ảnh chi tiết hơn, nên cũng tốn token hơn. */
export const BAC_CAO: BacPhanGiai = { canhToiDa: 2576, tokenToiDa: 4784 };
/** Các mô hình còn lại. */
export const BAC_CHUAN: BacPhanGiai = { canhToiDa: 1568, tokenToiDa: 1568 };

/**
 * Số token của một tấm ảnh.
 *
 * Mô hình nhìn ảnh theo ô 28×28 điểm ảnh, mỗi ô là một token. Ảnh vượt giới hạn
 * của bậc thì bị thu nhỏ trước khi xử lý.
 */
export function tokenAnh(rong: number, cao: number, bac: BacPhanGiai): number {
  let w = rong;
  let h = cao;
  const canhDai = Math.max(w, h);
  if (canhDai > bac.canhToiDa) {
    const tyLe = bac.canhToiDa / canhDai;
    w = Math.round(w * tyLe);
    h = Math.round(h * tyLe);
  }
  return Math.min(Math.ceil(w / 28) * Math.ceil(h / 28), bac.tokenToiDa);
}

export interface BangGiaModel {
  ten: string;
  /** Đô la Mỹ cho một triệu token đầu vào. */
  vaoUSD: number;
  /** Đô la Mỹ cho một triệu token đầu ra. Token suy nghĩ tính theo giá này. */
  raUSD: number;
  bac: BacPhanGiai;
}

/** Bảng giá tra ngày 13/9/2026. Kiểm lại trước khi dùng cho quyết định tài chính. */
export const MODEL: Record<string, BangGiaModel> = {
  "opus-5": { ten: "Claude Opus 5", vaoUSD: 5, raUSD: 25, bac: BAC_CAO },
  "sonnet-5": { ten: "Claude Sonnet 5", vaoUSD: 2, raUSD: 10, bac: BAC_CAO },
  "haiku-4-5": { ten: "Claude Haiku 4.5", vaoUSD: 1, raUSD: 5, bac: BAC_CHUAN },
};

export interface ThamSoTrang {
  anhRong: number;
  anhCao: number;
  /** Lời nhắc hệ thống và lược đồ đầu ra. Được đệm nên chỉ tốn 10% từ lần hai. */
  tokenDem: number;
  /** JSON phiên âm trả về. */
  tokenJson: number;
  /**
   * Token suy nghĩ. Đây là biến chưa đo và có sai số lớn nhất trong cả mô hình,
   * nên nó là tham số chứ không phải hằng số.
   */
  tokenSuyNghi: number;
  /** Đồng Việt Nam cho một đô la Mỹ. */
  tyGia: number;
}

export const THAM_SO_MAC_DINH: ThamSoTrang = {
  // Ảnh trang vở dọc, sau khi máy khách thu về cạnh dài 1600 điểm ảnh.
  anhRong: 1200,
  anhCao: 1600,
  tokenDem: 2000,
  tokenJson: 800,
  tokenSuyNghi: 1200,
  // Giá bán đô la của ngân hàng thương mại đầu tháng 9/2026.
  tyGia: 26_200,
};

/** Chi phí xử lý một trang ảnh, tính bằng đồng. */
export function chiPhiMotTrang(maModel: string, tham: ThamSoTrang = THAM_SO_MAC_DINH): number {
  const m = MODEL[maModel];
  if (!m) throw new Error(`Không có bảng giá cho mô hình ${maModel}`);
  const anh = tokenAnh(tham.anhRong, tham.anhCao, m.bac);
  const vaoMoi = anh + 10;
  // Đọc từ bộ đệm lời nhắc rẻ bằng một phần mười giá đầu vào thường.
  const vaoDem = tham.tokenDem * 0.1;
  const ra = tham.tokenJson + tham.tokenSuyNghi;
  const usd = ((vaoMoi + vaoDem) / 1e6) * m.vaoUSD + (ra / 1e6) * m.raUSD;
  return usd * tham.tyGia;
}

/**
 * Chi phí trung bình một trang khi chia việc cho hai mô hình.
 *
 * Mọi trang đều phải phiên âm, nên chi phí phiên âm là chi phí sàn. Chỉ những
 * trang thuộc tầng 2 — đề là bài toán có lời văn mà mã nguồn không giải được —
 * mới phải gọi thêm mô hình soạn giảng.
 *
 * Biến tyLeTang2 là thứ CHƯA AI ĐO. Nó phụ thuộc vào tỷ lệ bài lời văn trong
 * đề thật, mà theo quan sát 6 của BRD thì đề lớp 2 có 6 trên 10 điểm là tự
 * luận. Tuy nhiên phần lớn lượt chụp của phụ huynh là chấm bài con làm, không
 * phải nhờ giảng đề — và luồng chấm bài KHÔNG bao giờ chạm tầng 2. Vì vậy tỷ lệ
 * tầng 2 trên tổng số trang nhiều khả năng thấp hơn hẳn 60%.
 *
 * Đặt nó thành tham số thay vì hằng số chính vì chưa đo được.
 */
export function chiPhiTrungBinhMoiTrang(
  maModelDocAnh: string,
  maModelSoanGiang: string,
  tyLeTang2: number,
  tham: ThamSoTrang = THAM_SO_MAC_DINH,
): number {
  const phienAm = chiPhiMotTrang(maModelDocAnh, tham);
  // Tầng 2 không có ảnh: chỉ gửi chữ của đề đi, nên phần token ảnh bằng không.
  const thamGiang: ThamSoTrang = {
    ...tham,
    anhRong: 0,
    anhCao: 0,
    tokenJson: 1200,
    tokenSuyNghi: tham.tokenSuyNghi * 2,
  };
  const soanGiang = chiPhiMotTrang(maModelSoanGiang, thamGiang);
  return phienAm + tyLeTang2 * soanGiang;
}

/** Giả định kinh doanh, lấy từ mục 9 và 9.1 của BRD ngày 13/9/2026. */
export interface GiaDinhKinhDoanh {
  doanhThuMoiHo: number;
  chiPhiCoDinhThang: number;
  tyLeChuyenDoi: number;
  trangMoiHoTraPhi: number;
  dauTuNoiDung: number;
}

export const GIA_DINH_BRD: GiaDinhKinhDoanh = {
  doanhThuMoiHo: 61_000,
  chiPhiCoDinhThang: 18_000_000,
  tyLeChuyenDoi: 0.08,
  trangMoiHoTraPhi: 30,
  dauTuNoiDung: 62_600_000,
};

/** Số hộ miễn phí mà mỗi hộ trả phí đang gánh chi phí hộ. */
export function soHoMienPhiMoiHoTraPhi(gd: GiaDinhKinhDoanh = GIA_DINH_BRD): number {
  return (1 - gd.tyLeChuyenDoi) / gd.tyLeChuyenDoi;
}

/**
 * Biên đóng góp của một hộ trả phí: doanh thu của chính hộ đó, trừ chi phí biến
 * đổi của hộ đó, trừ phần chi phí gánh cho nhóm miễn phí (định nghĩa tại mục
 * 16.1 của BRD).
 */
export function bienDongGop(
  chiPhiTrang: number,
  trangMoiHoMienPhi: number,
  gd: GiaDinhKinhDoanh = GIA_DINH_BRD,
): number {
  const k = soHoMienPhiMoiHoTraPhi(gd);
  return (
    gd.doanhThuMoiHo -
    chiPhiTrang * gd.trangMoiHoTraPhi -
    k * chiPhiTrang * trangMoiHoMienPhi
  );
}

/** Số hộ trả phí để hòa vốn vận hành. null nghĩa là không quy mô nào hòa vốn. */
export function diemHoaVon(
  chiPhiTrang: number,
  trangMoiHoMienPhi: number,
  gd: GiaDinhKinhDoanh = GIA_DINH_BRD,
): number | null {
  const b = bienDongGop(chiPhiTrang, trangMoiHoMienPhi, gd);
  return b > 0 ? Math.ceil(gd.chiPhiCoDinhThang / b) : null;
}

/**
 * Số trang mà một hộ TRẢ PHÍ dùng tới đó là hết sạch doanh thu của chính mình.
 *
 * Con số này quan trọng hơn vẻ ngoài của nó: nếu nó thấp hơn trần của gói trả
 * phí thì sản phẩm có một cái lỗ ngay trong tập khách tốt nhất — càng dùng
 * nhiều càng lỗ, và đó là nhóm khách hàng hài lòng nhất.
 */
export function tranTrangHoTraPhiLo(
  chiPhiTrang: number,
  gd: GiaDinhKinhDoanh = GIA_DINH_BRD,
): number {
  return gd.doanhThuMoiHo / chiPhiTrang;
}

/** Số trang trung bình tối đa mà một hộ miễn phí được dùng để biên còn dương. */
export function tranTrangHoMienPhi(
  chiPhiTrang: number,
  gd: GiaDinhKinhDoanh = GIA_DINH_BRD,
): number {
  const k = soHoMienPhiMoiHoTraPhi(gd);
  const conLai = gd.doanhThuMoiHo - chiPhiTrang * gd.trangMoiHoTraPhi;
  return conLai <= 0 ? 0 : conLai / (k * chiPhiTrang);
}

export interface KetQuaThang {
  bienMoiHo: number;
  laiVanHanhThang: number;
  soThangHoanVonNoiDung: number | null;
}

/** Lãi lỗ ở một quy mô cụ thể. */
export function laiLoThang(
  chiPhiTrang: number,
  trangMoiHoMienPhi: number,
  soHoTraPhi: number,
  gd: GiaDinhKinhDoanh = GIA_DINH_BRD,
): KetQuaThang {
  const bienMoiHo = bienDongGop(chiPhiTrang, trangMoiHoMienPhi, gd);
  const laiVanHanhThang = bienMoiHo * soHoTraPhi - gd.chiPhiCoDinhThang;
  return {
    bienMoiHo,
    laiVanHanhThang,
    soThangHoanVonNoiDung:
      laiVanHanhThang > 0 ? gd.dauTuNoiDung / laiVanHanhThang : null,
  };
}
