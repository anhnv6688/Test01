import { chonKhuonDang } from "./generator";
import type { Attempt } from "./types";

/**
 * Nhịp phiên học.
 *
 * BR-05: một phiên phải kết thúc dứt điểm trong khoảng 10–12 phút. Phụ huynh lo
 * con nghiện màn hình hơn là lo con học ít, nên sản phẩm biết tự dừng là sản
 * phẩm được giữ lại. Mốc 25 phút ở đây không phải để chặn mà để đếm: phiên vượt
 * 25 phút là tín hiệu xấu cần theo dõi, theo đúng thước đo của BR-05.
 */
export const PHUT_MEM = 10;
export const PHUT_CUNG = 12;
export const PHUT_TIN_HIEU_XAU = 25;
export const SO_BAI_MOI_PHIEN = 8;

export interface KeHoachPhien {
  sessionId: string;
  childId: string;
  batDau: string;
  ke: { templateId: string; seed: number }[];
}

export function lapKeHoach(
  childId: string,
  yccdYeu: string[],
  seed: number,
  batDau = new Date(),
): KeHoachPhien {
  return {
    sessionId: `${childId}-${batDau.getTime()}`,
    childId,
    batDau: batDau.toISOString(),
    ke: chonKhuonDang(yccdYeu, SO_BAI_MOI_PHIEN, seed),
  };
}

export type TrangThaiNhip =
  | { pha: "dang-hoc"; conLaiMs: number }
  | { pha: "sap-het-gio"; conLaiMs: number }
  | { pha: "het-gio" };

/**
 * Nhịp được tính ở ranh giới giữa hai bài, không cắt ngang khi trẻ đang làm dở
 * — cắt giữa chừng là cách nhanh nhất khiến trẻ ức chế và không quay lại.
 */
export function nhipPhien(batDau: string, bayGio = Date.now()): TrangThaiNhip {
  const troi = bayGio - new Date(batDau).getTime();
  const mem = PHUT_MEM * 60_000;
  const cung = PHUT_CUNG * 60_000;
  if (troi >= cung) return { pha: "het-gio" };
  if (troi >= mem) return { pha: "sap-het-gio", conLaiMs: cung - troi };
  return { pha: "dang-hoc", conLaiMs: mem - troi };
}

export function laPhienQuaDai(batDau: string, ketThuc: string): boolean {
  return new Date(ketThuc).getTime() - new Date(batDau).getTime() >= PHUT_TIN_HIEU_XAU * 60_000;
}

/** Các mã yêu cầu cần đạt mà trẻ đang yếu, suy ra từ lịch sử gần nhất. */
export function yccdDangYeu(lichSu: Attempt[], nguong = 0.6): string[] {
  const thong = new Map<string, { dung: number; tong: number }>();
  for (const a of lichSu) {
    const t = thong.get(a.yccd) ?? { dung: 0, tong: 0 };
    t.tong += 1;
    if (a.correct && a.attemptNo === 1) t.dung += 1;
    thong.set(a.yccd, t);
  }
  return [...thong.entries()]
    .filter(([, t]) => t.tong >= 2 && t.dung / t.tong < nguong)
    .map(([code]) => code);
}
