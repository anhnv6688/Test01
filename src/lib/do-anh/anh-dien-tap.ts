import { deflateSync } from "node:zlib";

/**
 * Dựng một tấm PNG hợp lệ, đặc một màu, để làm ảnh diễn tập.
 *
 * Bộ đo phải chạy được TRỌN VẸN trước khi có ảnh thật, mà chạy trọn vẹn thì
 * phải có tệp thật trên đĩa: hàm đọc tệp, hàm mã hóa base64, hàm kiểm đủ ảnh —
 * cả ba chỉ hỏng khi gặp tệp thật. Vì vậy ở đây dựng PNG đúng chuẩn chứ không
 * ghi bừa vài byte ra tệp rồi đặt tên .png.
 *
 * Chúng không phải trang vở, và không tấm nào được dùng để nói về độ chính xác
 * của sản phẩm. Việc của chúng là làm bộ đo chạy hết một vòng.
 */

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function khoi(loai: string, du: Buffer): Buffer {
  const than = Buffer.concat([Buffer.from(loai, "latin1"), du]);
  const dai = Buffer.alloc(4);
  dai.writeUInt32BE(du.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(than));
  return Buffer.concat([dai, than, crc]);
}

export function pngMotMau(rong: number, cao: number, mau: [number, number, number]): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(rong, 0);
  ihdr.writeUInt32BE(cao, 4);
  ihdr[8] = 8; // 8 bit mỗi kênh
  ihdr[9] = 2; // ảnh màu, không bảng màu
  const tho = Buffer.alloc(cao * (1 + rong * 3));
  for (let y = 0; y < cao; y++) {
    const d = y * (1 + rong * 3);
    tho[d] = 0; // không lọc
    for (let x = 0; x < rong; x++) {
      tho[d + 1 + x * 3] = mau[0];
      tho[d + 2 + x * 3] = mau[1];
      tho[d + 3 + x * 3] = mau[2];
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    khoi("IHDR", ihdr),
    khoi("IDAT", deflateSync(tho)),
    khoi("IEND", Buffer.alloc(0)),
  ]);
}
