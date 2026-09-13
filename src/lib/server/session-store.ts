import { lapKeHoach, yccdDangYeu } from "@/lib/domain/session";
import { docPhien, ghiTienDoPhien, lichSuCuaCon, moPhien } from "./repo";

/**
 * Phiên đang chạy.
 *
 * Kế hoạch phiên chỉ là danh sách cặp (mã khuôn dạng, hạt) — không chứa đáp án,
 * nên lưu xuống kho không làm lộ gì cho bề mặt của trẻ (BR-03).
 *
 * Vì sao phải lưu xuống kho chứ không chỉ giữ trong bộ nhớ: một đứa trẻ bảy
 * tuổi cầm máy của mẹ rất hay chạm nhầm và tải lại trang, và máy chủ thì có lúc
 * khởi động lại. Nếu phiên chỉ nằm trong bộ nhớ thì những lúc đó trẻ mất sạch
 * bài đang làm dở, mà mất bài đang làm dở là cách nhanh nhất khiến trẻ không
 * quay lại. Bộ nhớ ở đây chỉ đóng vai trò bộ đệm cho kho.
 *
 * Bộ đệm treo trên globalThis vì trong chế độ phát triển, mỗi route được biên
 * dịch riêng và mô-đun này bị dựng lại nhiều lần; treo trên globalThis thì các
 * route dùng chung đúng một bộ đệm.
 */
export interface PhienDangChay {
  sessionId: string;
  childId: string;
  batDau: string;
  ke: { templateId: string; seed: number }[];
  viTri: number;
  bacGoiYDaMo: number;
  lanThu: number;
  batDauBai: number;
}

const KHOA = Symbol.for("oly.kho-phien");
type CoKho = typeof globalThis & { [KHOA]?: Map<string, PhienDangChay> };

function kho(): Map<string, PhienDangChay> {
  const g = globalThis as CoKho;
  if (!g[KHOA]) g[KHOA] = new Map<string, PhienDangChay>();
  return g[KHOA];
}

export function batDauPhien(childId: string, caNhanHoa: boolean): PhienDangChay {
  const lichSu = lichSuCuaCon(childId, 120);
  // Tôn trọng lựa chọn tắt cá nhân hóa: khi tắt, trẻ nhận bài theo thứ tự chung
  // chứ không mất tính năng luyện tập (BR-37).
  const yeu = caNhanHoa ? yccdDangYeu(lichSu) : [];
  const kh = lapKeHoach(childId, yeu, Date.now() % 2_000_000_000);
  moPhien(kh.sessionId, childId, kh.batDau, kh.ke);
  const p: PhienDangChay = {
    sessionId: kh.sessionId,
    childId,
    batDau: kh.batDau,
    ke: kh.ke,
    viTri: 0,
    bacGoiYDaMo: 0,
    lanThu: 1,
    batDauBai: Date.now(),
  };
  kho().set(kh.sessionId, p);
  return p;
}

export function layPhien(sessionId: string): PhienDangChay | null {
  const trongBoNho = kho().get(sessionId);
  if (trongBoNho) return trongBoNho;

  const tuKho = docPhien(sessionId);
  if (!tuKho || tuKho.daDong || tuKho.ke.length === 0) return null;
  const p: PhienDangChay = {
    sessionId: tuKho.sessionId,
    childId: tuKho.childId,
    batDau: tuKho.batDau,
    ke: tuKho.ke,
    viTri: tuKho.viTri,
    bacGoiYDaMo: tuKho.bacGoiYDaMo,
    lanThu: tuKho.lanThu,
    batDauBai: Date.now(),
  };
  kho().set(sessionId, p);
  return p;
}

export function capNhatPhien(p: PhienDangChay): void {
  kho().set(p.sessionId, p);
  ghiTienDoPhien(p.sessionId, p.viTri, p.bacGoiYDaMo, p.lanThu);
}

export function xoaPhien(sessionId: string): void {
  kho().delete(sessionId);
}
