import type { ChiPhiLanGoi, MaLoiAnh } from "@/lib/vision/provider";
import {
  MODEL,
  THAM_SO_MAC_DINH,
  type BangGiaModel,
} from "@/lib/domain/mo-hinh-chi-phi";
import type { DieuKienChup } from "./nhan";
import type { KhopDeBai, KhopMotAnh, LechKetLuan, MucKhop, MucKhopDe } from "./so-khop";

/**
 * Tổng hợp kết quả đo thành các con số dùng để ra quyết định.
 *
 * Bản báo cáo này tồn tại để trả lời bốn câu hỏi mà điều kiện ra mắt đặt ra, và
 * chỉ bốn câu đó — mọi con số khác đều là trang trí:
 *
 *   1. Máy đọc đúng bao nhiêu phần, và HỎNG Ở ĐÂU (dạng bài nào, ánh sáng nào)?
 *      Một tỷ lệ chung 92% không nói được gì; 92% mà toàn bộ 8% sai dồn vào
 *      dạng bài giải có lời văn thì đó là một sản phẩm khác hẳn.
 *   2. Bao nhiêu lần máy nói sai về bài của trẻ (điều kiện ra mắt số 9)?
 *   3. Một trang tốn thật bao nhiêu tiền (điều kiện ra mắt số 3)?
 *   4. Phụ huynh phải chờ bao lâu?
 *
 * Báo cáo KHÔNG tự đặt ngưỡng đạt/không đạt. BRD nói rõ ngưỡng do chủ đầu tư
 * đặt, nên ở đây chỉ có số đo; ai đặt ngưỡng thì so lấy.
 */

/** Một dòng kết quả cho một tấm ảnh, đủ để dựng lại mọi con số trong báo cáo. */
export interface DongDo {
  khop: KhopMotAnh;
  dieuKienChup: DieuKienChup;
  loaiViec: "cham-bai-lam" | "doc-de-bai";
  /** Mã lỗi máy trả về khi từ chối ảnh, để biết máy từ chối vì lý do gì. */
  maLoi: MaLoiAnh | null;
  /** Lần chụp này có phải nhờ mô hình mạnh soạn giảng không (tầng 2). */
  dungTang2: boolean;
  /** Chi phí lần phiên âm. Vắng nghĩa là nhà cung cấp không báo được. */
  chiPhiDocAnh: ChiPhiLanGoi | null;
  /** Chi phí lần soạn giảng, nếu có chạm tầng 2. */
  chiPhiSoanGiang: ChiPhiLanGoi | null;
  /** Với ảnh chụp đề bài: đề máy đọc ra có khớp đề trên giấy không. */
  khopDeBai: KhopDeBai | null;
}

export interface ThongKeNhom {
  ten: string;
  soAnh: number;
  soAnhMayDocDuoc: number;
  soBai: number;
  soBaiKhopHet: number;
  /** Tỷ lệ bài phiên âm khớp hoàn toàn. null khi nhóm chưa có bài nào. */
  tyLeKhop: number | null;
  /** Số lần kết luận của Ô Ly lệch với kết luận trên nhãn. */
  soLechKetLuan: number;
  soBaoDongGia: number;
}

export interface BaoCaoDo {
  /** Mô hình thật sự đã phục vụ. Nhiều tên nghĩa là lần đo trộn mô hình. */
  cacModel: string[];
  soAnh: number;

  /* ---- Câu hỏi 1: đọc đúng bao nhiêu, hỏng ở đâu ---- */
  /** Điều kiện ra mắt số 9: đọc được ngay lần chụp đầu. */
  tyLeDocDuocLanDau: number;
  demMucKhop: Record<MucKhop, number>;
  soBai: number;
  tyLeKhopChung: number | null;
  theoDang: ThongKeNhom[];
  theoDieuKien: ThongKeNhom[];
  /** Tên trường hay bị đọc sai nhất, nhiều nhất trước. */
  truongHaySai: { truong: string; soLan: number }[];
  /** Riêng ảnh chụp đề bài. Sai một con số trong đề là hỏng cả lời giảng. */
  demKhopDe: Record<MucKhopDe, number>;

  /* ---- Câu hỏi 2: máy nói sai về bài của trẻ bao nhiêu lần ---- */
  demLechKetLuan: Record<LechKetLuan, number>;
  /** Máy từ chối ảnh mà người đọc được — phụ huynh mất công chụp lại. */
  soTuChoiOan: number;
  /** Máy đọc bừa ảnh mà người không đọc nổi — nặng hơn từ chối oan. */
  soDocBua: number;
  demMaLoi: Record<string, number>;

  /* ---- Câu hỏi 3: một trang tốn thật bao nhiêu ---- */
  /** Đồng Việt Nam. null khi không nhà cung cấp nào báo được token. */
  chiPhiTrungBinhMoiTrang: number | null;
  chiPhiTrangCaoNhat: number | null;
  soTrangDoDuocChiPhi: number;
  tyLeTang2: number;

  /* ---- Câu hỏi 4: phụ huynh chờ bao lâu ---- */
  thoiGianTrungViMs: number | null;
  thoiGianP90Ms: number | null;
}

/**
 * Tra bảng giá từ tên mô hình mà nhà cung cấp báo về.
 *
 * Tên báo về thường có đuôi ngày tháng ("claude-haiku-4-5-20251001") nên phải
 * so theo chuỗi con chứ không so bằng. Không đoán bừa khi không tra được: trả
 * null để báo cáo nói thẳng là chưa đo được chi phí, thay vì lấp bằng một con
 * số trông có vẻ đúng.
 */
export function bangGiaCuaModel(model: string): BangGiaModel | null {
  for (const [ma, gia] of Object.entries(MODEL)) {
    if (model.includes(ma)) return gia;
  }
  return null;
}

/** Chi phí thật của một lần gọi, tính bằng đồng. */
export function chiPhiLanGoiDong(
  c: ChiPhiLanGoi,
  tyGia: number = THAM_SO_MAC_DINH.tyGia,
): number | null {
  const gia = bangGiaCuaModel(c.model);
  if (!gia) return null;
  const usd =
    (c.tokenVaoMoi / 1e6) * gia.vaoUSD +
    // Token đọc lại từ bộ đệm lời nhắc rẻ bằng một phần mười.
    (c.tokenVaoTuDem / 1e6) * gia.vaoUSD * 0.1 +
    (c.tokenRa / 1e6) * gia.raUSD;
  return usd * tyGia;
}

function nhomRong(ten: string): ThongKeNhom {
  return {
    ten,
    soAnh: 0,
    soAnhMayDocDuoc: 0,
    soBai: 0,
    soBaiKhopHet: 0,
    tyLeKhop: null,
    soLechKetLuan: 0,
    soBaoDongGia: 0,
  };
}

function phanVi(xs: number[], p: number): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(p * s.length));
  return s[i];
}

/**
 * Gộp các dòng đo thành báo cáo.
 *
 * Cách tính có một chỗ cố ý làm khác lẽ thường: ảnh mà máy từ chối KHÔNG bị
 * tính là "bài đọc sai". Từ chối và đọc sai là hai chuyện khác hẳn nhau — từ
 * chối thì phụ huynh chụp lại và không ai bị mắng oan, còn đọc sai thì có. Trộn
 * hai thứ vào một tỷ lệ sẽ khiến một sản phẩm hay từ chối trông giống một sản
 * phẩm hay nói bậy, mà chúng không giống nhau chút nào.
 */
export function gopBaoCao(
  dong: DongDo[],
  tyGia: number = THAM_SO_MAC_DINH.tyGia,
): BaoCaoDo {
  const demMucKhop: Record<MucKhop, number> = {
    "khop-het": 0,
    "dung-dang-sai-so": 0,
    "sai-dang": 0,
    thieu: 0,
    thua: 0,
  };
  const demLechKetLuan: Record<LechKetLuan, number> = {
    "giong-nhau": 0,
    "bao-dong-gia": 0,
    "bo-sot": 0,
    "mat-ket-luan": 0,
    "them-ket-luan": 0,
  };
  const demKhopDe: Record<MucKhopDe, number> = { "khop-het": 0, "khop-so": 0, "sai-so": 0 };
  const demMaLoi: Record<string, number> = {};
  const demTruong = new Map<string, number>();
  const theoDang = new Map<string, ThongKeNhom>();
  const theoDieuKien = new Map<string, ThongKeNhom>();
  const models = new Set<string>();

  let soBai = 0;
  let soBaiKhopHet = 0;
  let soDocDuoc = 0;
  let soTuChoiOan = 0;
  let soDocBua = 0;
  let soTang2 = 0;
  const chiPhiTrang: number[] = [];
  const thoiGian: number[] = [];

  for (const d of dong) {
    const dk = theoDieuKien.get(d.dieuKienChup) ?? nhomRong(d.dieuKienChup);
    theoDieuKien.set(d.dieuKienChup, dk);
    dk.soAnh++;
    if (d.khop.mayDocDuoc) {
      soDocDuoc++;
      dk.soAnhMayDocDuoc++;
    }
    if (d.khop.tuChoiOan) soTuChoiOan++;
    if (d.khop.docBua) soDocBua++;
    if (d.maLoi) demMaLoi[d.maLoi] = (demMaLoi[d.maLoi] ?? 0) + 1;
    if (d.dungTang2) soTang2++;
    if (d.khopDeBai) demKhopDe[d.khopDeBai.muc]++;

    for (const b of d.khop.bai) {
      soBai++;
      demMucKhop[b.mucKhop]++;
      dk.soBai++;
      // Bài thừa không có nhãn nên không quy về dạng nào cả.
      const tenDang = b.dangNhan ?? `(máy thêm) ${b.dangMay}`;
      const nd = theoDang.get(tenDang) ?? nhomRong(tenDang);
      theoDang.set(tenDang, nd);
      nd.soBai++;
      if (b.mucKhop === "khop-het") {
        soBaiKhopHet++;
        nd.soBaiKhopHet++;
        dk.soBaiKhopHet++;
      }
      for (const t of b.truongLech) demTruong.set(t, (demTruong.get(t) ?? 0) + 1);
    }

    // Lệch kết luận đi theo từng bài, nên phải quy về dạng của bài tương ứng.
    for (const [i, l] of d.khop.lechKetLuan.entries()) {
      demLechKetLuan[l]++;
      if (l === "giong-nhau") continue;
      dk.soLechKetLuan++;
      if (l === "bao-dong-gia") dk.soBaoDongGia++;
      const tenDang = d.khop.bai[i]?.dangNhan ?? "(không rõ dạng)";
      const nd = theoDang.get(tenDang) ?? nhomRong(tenDang);
      theoDang.set(tenDang, nd);
      nd.soLechKetLuan++;
      if (l === "bao-dong-gia") nd.soBaoDongGia++;
    }

    let tienTrang = 0;
    let doDuocTien = false;
    let msTrang = 0;
    for (const c of [d.chiPhiDocAnh, d.chiPhiSoanGiang]) {
      if (!c) continue;
      models.add(c.model);
      msTrang += c.thoiGianMs;
      const t = chiPhiLanGoiDong(c, tyGia);
      if (t !== null) {
        tienTrang += t;
        doDuocTien = true;
      }
    }
    if (doDuocTien) chiPhiTrang.push(tienTrang);
    if (msTrang > 0) thoiGian.push(msTrang);
  }

  for (const n of [...theoDang.values(), ...theoDieuKien.values()]) {
    n.tyLeKhop = n.soBai > 0 ? n.soBaiKhopHet / n.soBai : null;
  }

  const tongTien = chiPhiTrang.reduce((a, b) => a + b, 0);

  return {
    cacModel: [...models].sort(),
    soAnh: dong.length,
    tyLeDocDuocLanDau: dong.length > 0 ? soDocDuoc / dong.length : 0,
    demMucKhop,
    soBai,
    tyLeKhopChung: soBai > 0 ? soBaiKhopHet / soBai : null,
    theoDang: [...theoDang.values()].sort((a, b) => a.ten.localeCompare(b.ten, "vi")),
    theoDieuKien: [...theoDieuKien.values()].sort((a, b) => a.ten.localeCompare(b.ten, "vi")),
    truongHaySai: [...demTruong.entries()]
      .map(([truong, soLan]) => ({ truong, soLan }))
      .sort((a, b) => b.soLan - a.soLan),
    demKhopDe,
    demLechKetLuan,
    soTuChoiOan,
    soDocBua,
    demMaLoi,
    chiPhiTrungBinhMoiTrang: chiPhiTrang.length > 0 ? tongTien / chiPhiTrang.length : null,
    chiPhiTrangCaoNhat: phanVi(chiPhiTrang, 1),
    soTrangDoDuocChiPhi: chiPhiTrang.length,
    tyLeTang2: dong.length > 0 ? soTang2 / dong.length : 0,
    thoiGianTrungViMs: phanVi(thoiGian, 0.5),
    thoiGianP90Ms: phanVi(thoiGian, 0.9),
  };
}
