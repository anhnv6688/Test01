/**
 * Bộ sinh số ngẫu nhiên có hạt (mulberry32).
 *
 * Vì sao không dùng Math.random: mỗi bài cụ thể phải tái dựng được y hệt từ
 * (khuôn dạng, hạt). Nhờ đó máy chủ không cần lưu đề đã sinh, và khi phụ huynh
 * xem lại lịch sử thì bài hiện ra đúng như lúc trẻ làm (BR-09).
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Số nguyên trong [min, max]. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(xs: readonly T[]): T {
    return xs[this.int(0, xs.length - 1)];
  }

  /** Trộn mảng, trả về bản sao. */
  shuffle<T>(xs: readonly T[]): T[] {
    const out = xs.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}
