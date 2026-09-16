import { randomUUID } from "node:crypto";
import { GOI } from "@/lib/domain/pricing";
import {
  conDungDuocGi, duocTruTienGiaHan, huy, huyViecHuy, soNgayConLai, trangThai,
  type ThueBao, type TrangThaiThueBao,
} from "@/lib/domain/thue-bao";
import { layNhaCungCapThanhToan } from "@/lib/thanh-toan/chon-nha-cung-cap";
import type { MaGoi } from "@/lib/domain/pricing";
import { getDb } from "./db";
import { layHo } from "./repo";

/**
 * Thuê bao ở tầng máy chủ: đọc ra, mua, hủy, và ghi biên lai.
 *
 * Phần quyết định nằm ở domain/thue-bao.ts và không đụng cơ sở dữ liệu; ở đây
 * chỉ là đọc ghi. Tách như vậy để bốn ràng buộc của CR-12 và CR-13 kiểm thử
 * được mà không cần dựng một cái kho dữ liệu.
 */

interface DongHo {
  tu_dong_gia_han: number;
  da_bam_huy: number;
  dang_dung_thu: number;
  bao_truoc_gia_han_luc: string | null;
}

export function docThueBao(householdId: string): ThueBao | null {
  const ho = layHo(householdId);
  if (!ho) return null;
  const r = getDb()
    .prepare(
      "SELECT tu_dong_gia_han, da_bam_huy, dang_dung_thu, bao_truoc_gia_han_luc FROM households WHERE id = ?",
    )
    .get(householdId) as DongHo | undefined;
  return {
    goi: ho.goi,
    hetHanAt: ho.hetHanAt ? new Date(ho.hetHanAt) : null,
    tuDongGiaHan: r?.tu_dong_gia_han === 1,
    daBamHuy: r?.da_bam_huy === 1,
    dangDungThu: r?.dang_dung_thu === 1,
  };
}

export interface TinhHinhThueBao {
  thueBao: ThueBao;
  trangThai: TrangThaiThueBao;
  soNgayConLai: number | null;
  conDungDuocGi: ReturnType<typeof conDungDuocGi>;
  /** Có lần thu tiền nào được ghi bằng bản giả lập không. */
  coBienLaiGiaLap: boolean;
}

export function tinhHinhThueBao(householdId: string, moc = new Date()): TinhHinhThueBao | null {
  const tb = docThueBao(householdId);
  if (!tb) return null;
  const tt = trangThai(tb, moc);
  const n = getDb()
    .prepare("SELECT COUNT(*) AS n FROM bien_lai WHERE household_id = ? AND la_gia_lap = 1")
    .get(householdId) as { n: number };
  return {
    thueBao: tb,
    trangThai: tt,
    soNgayConLai: soNgayConLai(tb, moc),
    conDungDuocGi: conDungDuocGi(tt),
    coBienLaiGiaLap: n.n > 0,
  };
}

export interface KetQuaMua {
  ok: boolean;
  thongBao: string;
  laGiaLap?: boolean;
}

/**
 * Mua hoặc gia hạn một chu kỳ.
 *
 * Việc bật trừ tiền định kỳ là MỘT LỰA CHỌN RIÊNG, không đi kèm việc mua. Gộp
 * hai thứ đó lại là cách người ta hay dùng để biến một lần mua thành một chuỗi
 * trừ tiền mà người trả không để ý — chính là thứ điều 4 ở domain/thue-bao.ts
 * viết ra để chặn.
 */
export async function muaGoi(
  householdId: string,
  ma: MaGoi,
  chapNhanTuDongGiaHan: boolean,
  moc = new Date(),
): Promise<KetQuaMua> {
  const goi = GOI[ma];
  if (!goi || ma === "vo-nhap") {
    return { ok: false, thongBao: "Gói này không mua được." };
  }

  const ncc = layNhaCungCapThanhToan();
  const kq = await ncc.thu({ householdId, goi: ma, soTien: goi.giaThang, chapNhanTuDongGiaHan });
  if (!kq.ok) return { ok: false, thongBao: `Chưa thu được tiền: ${kq.lyDo}`, laGiaLap: kq.laGiaLap };

  const d = getDb();
  // Gia hạn thì nối tiếp vào phần còn lại, không cắt mất những ngày đã trả tiền.
  const tb = docThueBao(householdId);
  const goc = tb?.hetHanAt && tb.hetHanAt > moc ? tb.hetHanAt : moc;
  const hetHan = new Date(goc.getTime() + 30 * 86_400_000);

  d.transaction(() => {
    d.prepare(
      "UPDATE households SET goi = ?, het_han_at = ?, tu_dong_gia_han = ?, da_bam_huy = 0, dang_dung_thu = 0 WHERE id = ?",
    ).run(ma, hetHan.toISOString(), chapNhanTuDongGiaHan ? 1 : 0, householdId);
    d.prepare(
      "INSERT INTO bien_lai (id, household_id, goi, so_tien, ma_giao_dich, la_gia_lap, at) VALUES (?,?,?,?,?,?,?)",
    ).run(
      randomUUID(), householdId, ma, goi.giaThang, kq.maGiaoDich,
      kq.laGiaLap ? 1 : 0, moc.toISOString(),
    );
  })();

  return {
    ok: true,
    laGiaLap: kq.laGiaLap,
    thongBao: kq.laGiaLap
      ? "Đã ghi một lần mua BẰNG BẢN GIẢ LẬP. Không có đồng tiền nào được chuyển."
      : `Đã gia hạn tới ${hetHan.toLocaleDateString("vi-VN")}.`,
  };
}

/**
 * Hủy thuê bao.
 *
 * Dừng trừ tiền ở cổng thanh toán TRƯỚC, rồi mới ghi vào cơ sở dữ liệu. Nếu
 * cổng báo hỏng thì dừng lại và nói thật, chứ không ghi "đã hủy" rồi để hộ vẫn
 * bị trừ tiền — đó là kiểu lỗi người dùng chỉ phát hiện khi đã mất tiền, và là
 * kiểu lỗi làm mất lòng tin lâu nhất.
 */
export async function huyGoi(householdId: string): Promise<KetQuaMua> {
  const tb = docThueBao(householdId);
  if (!tb) return { ok: false, thongBao: "Không tìm thấy hộ." };

  const dung = await layNhaCungCapThanhToan().dungTruTienDinhKy(householdId);
  if (!dung.ok) {
    return {
      ok: false,
      thongBao:
        "Ô Ly chưa dừng được lệnh trừ tiền định kỳ ở cổng thanh toán, nên chưa dám ghi là đã hủy. " +
        `Anh chị thử lại sau ít phút giúp nhé${dung.lyDo ? ` (${dung.lyDo})` : ""}.`,
    };
  }

  const sau = huy(tb);
  getDb()
    .prepare("UPDATE households SET da_bam_huy = 1, tu_dong_gia_han = ? WHERE id = ?")
    .run(sau.tuDongGiaHan ? 1 : 0, householdId);

  const den = tb.hetHanAt ? tb.hetHanAt.toLocaleDateString("vi-VN") : "hết chu kỳ";
  return {
    ok: true,
    thongBao: `Đã hủy. Anh chị vẫn dùng bình thường tới ${den}, và lịch sử học của con thì giữ nguyên mãi.`,
  };
}

export function bat_laiGoi(householdId: string): void {
  const tb = docThueBao(householdId);
  if (!tb) return;
  const sau = huyViecHuy(tb);
  getDb()
    .prepare("UPDATE households SET da_bam_huy = ? WHERE id = ?")
    .run(sau.daBamHuy ? 1 : 0, householdId);
}

/** Ghi lại lúc đã gửi thông báo sắp gia hạn, để duocTruTienGiaHan kiểm được. */
export function ghiDaBaoTruocGiaHan(householdId: string, moc = new Date()): void {
  getDb()
    .prepare("UPDATE households SET bao_truoc_gia_han_luc = ? WHERE id = ?")
    .run(moc.toISOString(), householdId);
}

/** Cổng duy nhất quyết định có được trừ tiền gia hạn hay không. */
export function duocGiaHanTuDong(householdId: string, moc = new Date()) {
  const tb = docThueBao(householdId);
  if (!tb) return "chua-toi-han" as const;
  const r = getDb()
    .prepare("SELECT bao_truoc_gia_han_luc FROM households WHERE id = ?")
    .get(householdId) as { bao_truoc_gia_han_luc: string | null } | undefined;
  return duocTruTienGiaHan(
    { thueBao: tb, daBaoTruocLuc: r?.bao_truoc_gia_han_luc ? new Date(r.bao_truoc_gia_han_luc) : null },
    moc,
  );
}
