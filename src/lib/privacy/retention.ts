/**
 * Lớp thứ ba: xóa ảnh gốc ngay sau khi trả kết quả (BR-35).
 *
 * Mục đích xử lý là chấm bài, và mục đích đó hoàn thành ngay khi kết quả đã tới
 * tay phụ huynh. Giữ ảnh gốc dài hạn rất khó biện minh theo nguyên tắc giới hạn
 * lưu trữ. Nhu cầu xem lại của phụ huynh được giải quyết ở chỗ khác: ảnh nằm
 * trong thư viện ảnh của chính họ, không nằm trên hệ thống (BR-36).
 *
 * Cách làm ở đây: ảnh chỉ tồn tại trong bộ nhớ tiến trình, có hạn dùng tính bằng
 * giây, và bị xóa trong khối finally của luồng xử lý. Không có đường nào ghi
 * ảnh xuống đĩa hay xuống cơ sở dữ liệu — lược đồ bảng photo_jobs cố ý không có
 * cột nào chứa ảnh.
 */
export interface AnhTamThoi {
  bytes: Buffer;
  taoLuc: number;
}

const HAN_DUNG_MS = 120_000;

class KhoAnhTamThoi {
  private kho = new Map<string, AnhTamThoi>();

  luu(ma: string, bytes: Buffer): void {
    this.doVeQuaHan();
    this.kho.set(ma, { bytes, taoLuc: Date.now() });
  }

  doc(ma: string): Buffer | null {
    this.doVeQuaHan();
    return this.kho.get(ma)?.bytes ?? null;
  }

  /** Ghi đè vùng nhớ trước khi bỏ tham chiếu, rồi mới xóa khỏi bảng. */
  xoa(ma: string): boolean {
    const a = this.kho.get(ma);
    if (!a) return false;
    a.bytes.fill(0);
    return this.kho.delete(ma);
  }

  co(ma: string): boolean {
    return this.kho.has(ma);
  }

  soAnhDangGiu(): number {
    this.doVeQuaHan();
    return this.kho.size;
  }

  private doVeQuaHan(): void {
    const nguong = Date.now() - HAN_DUNG_MS;
    for (const [ma, a] of this.kho) {
      if (a.taoLuc < nguong) {
        a.bytes.fill(0);
        this.kho.delete(ma);
      }
    }
  }
}

export const khoAnhTamThoi = new KhoAnhTamThoi();

/**
 * Chạy một việc có dùng ảnh, và xóa ảnh dù việc đó thành công hay thất bại.
 * Khối finally là chỗ duy nhất bảo đảm được điều BR-35 yêu cầu.
 */
export async function dungAnhRoiXoa<T>(
  ma: string,
  bytes: Buffer,
  viec: (bytes: Buffer) => Promise<T>,
): Promise<T> {
  khoAnhTamThoi.luu(ma, bytes);
  try {
    return await viec(bytes);
  } finally {
    khoAnhTamThoi.xoa(ma);
  }
}
