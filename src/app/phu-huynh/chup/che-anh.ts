"use client";

import {
  PHIEN_BAN_CHE, VUNG_DAU_TRANG_MAC_DINH,
  type ChungTuCheAnh, type VungDaChe,
} from "@/lib/privacy/redaction";
import type { ChatLuongAnh } from "@/lib/vision/provider";

/**
 * Che ảnh ngay trên thiết bị — lớp thứ nhất của thiết kế ba lớp (BR-32).
 *
 * Toàn bộ tệp này chạy trong trình duyệt của phụ huynh, và đó chính là điểm
 * mấu chốt. Trình tự bắt buộc:
 *
 *   1. Vẽ ảnh lên canvas. Bước này cũng rũ bỏ luôn siêu dữ liệu EXIF, trong đó
 *      có tọa độ nơi chụp — một thứ không liên quan gì tới việc chấm bài.
 *   2. Tô đè hẳn vùng chứa họ tên, lớp, trường. Tô đè chứ không phải phủ một
 *      lớp hình bên trên: sau bước này, pixel gốc không còn tồn tại trong bộ
 *      nhớ canvas nữa.
 *   3. Mã hóa ảnh ĐÃ tô đè thành JPEG. Chỉ chuỗi này mới được gửi đi.
 *
 * Không có nhánh nào trong tệp này trả về ảnh gốc. Hàm duy nhất xuất dữ liệu là
 * cheVaDongGoi, và nó chỉ đọc từ canvas đã tô đè.
 */
export interface AnhDaChe {
  base64: string;
  chungTu: ChungTuCheAnh;
  chatLuong: ChatLuongAnh;
  /** Bản xem trước để phụ huynh tự kiểm tra đã che kín chưa. */
  xemTruoc: string;
  rong: number;
  cao: number;
}

const CANH_TOI_DA = 1600;

export async function docAnhVaoCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const tyLe = Math.min(1, CANH_TOI_DA / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * tyLe);
  canvas.height = Math.round(bitmap.height * tyLe);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không vẽ được ảnh.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

/** Đo độ sáng và độ tương phản để báo sớm cho phụ huynh (BR-30). */
export function doChatLuong(canvas: HTMLCanvasElement): ChatLuongAnh {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { doSang: 0, doTuongPhan: 0, canhDai: 0 };
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let tong = 0;
  let tongBinhPhuong = 0;
  let n = 0;
  // Lấy mẫu thưa: đủ chính xác cho một ngưỡng, và không làm khựng máy yếu.
  for (let i = 0; i < d.length; i += 4 * 37) {
    const xam = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    tong += xam;
    tongBinhPhuong += xam * xam;
    n += 1;
  }
  const tb = n > 0 ? tong / n : 0;
  const phuongSai = n > 0 ? tongBinhPhuong / n - tb * tb : 0;
  return {
    doSang: Math.round(tb),
    doTuongPhan: Math.round(Math.sqrt(Math.max(phuongSai, 0))),
    canhDai: Math.max(canvas.width, canvas.height),
  };
}

/**
 * Tô đè các vùng rồi xuất ảnh. Đây là hàm duy nhất trong ứng dụng tạo ra chuỗi
 * ảnh để gửi đi, và nó chỉ đọc canvas SAU khi đã tô đè.
 */
export function cheVaDongGoi(canvas: HTMLCanvasElement, vung: VungDaChe[]): AnhDaChe {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không vẽ được ảnh.");

  const chatLuong = doChatLuong(canvas);

  for (const v of vung) {
    const x = Math.max(0, v.x) * canvas.width;
    const y = Math.max(0, v.y) * canvas.height;
    const w = Math.min(1, v.w) * canvas.width;
    const h = Math.min(1, v.h) * canvas.height;
    // Tô đặc, không dùng độ mờ: phải phá hẳn pixel gốc chứ không phải làm nhòe.
    ctx.fillStyle = "#111111";
    ctx.fillRect(x, y, w, h);
  }

  const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
  return {
    base64: dataUrl.split(",")[1] ?? "",
    xemTruoc: dataUrl,
    rong: canvas.width,
    cao: canvas.height,
    chatLuong,
    chungTu: {
      daCheTrenThietBi: true,
      daBoExif: true,
      vung,
      phienBan: PHIEN_BAN_CHE,
    },
  };
}

export { VUNG_DAU_TRANG_MAC_DINH };
export type { VungDaChe };
