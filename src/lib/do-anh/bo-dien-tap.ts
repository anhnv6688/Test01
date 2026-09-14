import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pngMotMau } from "./anh-dien-tap";
import type { NhanBoAnh } from "./nhan";

/**
 * Bộ ảnh diễn tập: đủ 11 dạng bài và đủ các điều kiện chụp.
 *
 * Bộ này KHÔNG đại diện cho chữ viết tay thật và không dùng để kết luận bất cứ
 * điều gì về độ chính xác. Nó có hai việc:
 *
 *   1. Làm bộ đo chạy hết một vòng khi chưa có ảnh thật — đọc tệp, gọi nhà cung
 *      cấp, so khớp, gộp báo cáo, in ra.
 *   2. Làm mẫu tệp nhãn cho người sẽ gắn nhãn ảnh thật. Xem tài liệu
 *      docs/bo-do-anh.md, mục cách gắn nhãn.
 *
 * Bài làm trong đây cố ý trộn cả đúng lẫn sai, vì bộ đo cần cả hai: một bộ toàn
 * bài đúng thì không bao giờ phát hiện được lỗi "bỏ sót", còn một bộ toàn bài
 * sai thì không phát hiện được lỗi "báo động giả".
 */
export const NHAN_DIEN_TAP: NhanBoAnh = {
  moTa: "Bộ ảnh diễn tập — KHÔNG phải ảnh thật, chỉ để chạy thử bộ đo",
  nguoiGanNhan: "bộ đo (tự sinh)",
  ganNhanLuc: "2026-09-14",
  anh: [
    {
      tep: "01-cot-doc.png",
      loaiViec: "cham-bai-lam",
      dieuKienChup: "tot",
      nguoiDocDuoc: true,
      lop: 2,
      cacBai: [
        // 47 + 28 = 75, trẻ viết đúng.
        { dang: "cot-doc", soA: 47, soB: 28, phep: "+", chuSoTre: [5, 7] },
        // 63 - 25 = 38, trẻ quên mượn nên viết 42.
        { dang: "cot-doc", soA: 63, soB: 25, phep: "-", chuSoTre: [2, 4] },
      ],
    },
    {
      tep: "02-hang-ngang.png",
      loaiViec: "cham-bai-lam",
      dieuKienChup: "den-ban-buoi-toi",
      nguoiDocDuoc: true,
      lop: 2,
      cacBai: [
        { dang: "hang-ngang", veTrai: "35 + 24", ketQuaTre: 59 },
        { dang: "hang-ngang", veTrai: "18 + 7", ketQuaTre: 24 },
        { dang: "hang-ngang", veTrai: "4 x 6", ketQuaTre: 24 },
      ],
    },
    {
      tep: "03-dien-so-so-sanh.png",
      loaiViec: "cham-bai-lam",
      dieuKienChup: "tot",
      nguoiDocDuoc: true,
      lop: 2,
      cacBai: [
        { dang: "dien-so", bieuThuc: "5 + ? = 12", soTre: 7 },
        { dang: "dien-so", bieuThuc: "? - 9 = 15", soTre: 23 },
        { dang: "so-sanh", veTrai: "45", vePhai: "54", dauTre: "<" },
        { dang: "so-sanh", veTrai: "3 x 4", vePhai: "10 + 2", dauTre: "=" },
      ],
    },
    {
      tep: "04-trac-nghiem.png",
      loaiViec: "cham-bai-lam",
      dieuKienChup: "nghieng",
      nguoiDocDuoc: true,
      lop: 2,
      cacBai: [
        {
          dang: "trac-nghiem",
          luaChon: ["18", "20", "22", "24"],
          chonTre: 2,
          dapAnDung: 2,
        },
        // Đề không cho biết đáp án đúng: bộ chấm phải nói thẳng là chưa kết luận.
        { dang: "trac-nghiem", luaChon: ["A", "B", "C"], chonTre: 0, dapAnDung: null },
      ],
    },
    {
      tep: "05-bai-giai.png",
      loaiViec: "cham-bai-lam",
      dieuKienChup: "tot",
      nguoiDocDuoc: true,
      lop: 2,
      cacBai: [
        {
          dang: "bai-giai-loi-van",
          deBai: "Lan có 32 quả cam, Lan cho bạn 8 quả. Hỏi Lan còn lại bao nhiêu quả cam?",
          cauLoiGiai: "Số quả cam Lan còn lại là:",
          phepTinh: "32 - 8 = 24",
          dapSo: "24 quả",
        },
        {
          dang: "bai-giai-loi-van",
          deBai: "Mỗi hộp có 5 cái bút. Hỏi 4 hộp có bao nhiêu cái bút?",
          cauLoiGiai: null,
          phepTinh: "5 x 4 = 20",
          dapSo: "20 cái bút",
        },
      ],
    },
    {
      tep: "06-do-luong.png",
      loaiViec: "cham-bai-lam",
      dieuKienChup: "thieu-sang",
      nguoiDocDuoc: true,
      lop: 2,
      cacBai: [
        { dang: "doi-don-vi", soNguon: 3, donViNguon: "m", donViDich: "cm", ketQuaTre: 300 },
        { dang: "doi-don-vi", soNguon: 250, donViNguon: "cm", donViDich: "dm", ketQuaTre: 25 },
        { dang: "dem-hinh", soThat: 7, ketQuaTre: 7 },
        { dang: "dem-hinh", soThat: 5, ketQuaTre: 6 },
      ],
    },
    {
      tep: "07-xem-gio-noi-ghep.png",
      loaiViec: "cham-bai-lam",
      dieuKienChup: "tot",
      nguoiDocDuoc: true,
      lop: 2,
      cacBai: [
        { dang: "xem-gio", gioThat: 8, phutThat: 30, gioTre: 8, phutTre: 30 },
        { dang: "xem-gio", gioThat: 3, phutThat: 15, gioTre: 3, phutTre: 45 },
        {
          dang: "noi-ghep",
          capTre: [
            { trai: "2 x 3", phai: "6" },
            { trai: "4 x 5", phai: "20" },
          ],
          capDung: [
            { trai: "2 x 3", phai: "6" },
            { trai: "4 x 5", phai: "20" },
          ],
        },
      ],
    },
    {
      tep: "08-chua-nhan-dang.png",
      loaiViec: "cham-bai-lam",
      dieuKienChup: "mat-goc",
      nguoiDocDuoc: true,
      lop: 2,
      cacBai: [
        {
          dang: "chua-nhan-dang",
          docDuoc: "Vẽ thêm hình để được hình vuông",
          ghiChu: "bài vẽ, Ô Ly không kết luận được",
        },
      ],
    },
    {
      tep: "09-qua-nhoe.png",
      loaiViec: "cham-bai-lam",
      dieuKienChup: "nhoe",
      // Người còn không đọc nổi: Ô Ly PHẢI từ chối và nói rõ lý do (BR-31).
      nguoiDocDuoc: false,
      lop: 2,
    },
    {
      tep: "10-qua-toi.png",
      loaiViec: "cham-bai-lam",
      dieuKienChup: "thieu-sang",
      nguoiDocDuoc: false,
      lop: 2,
    },
    {
      tep: "11-de-tang-1.png",
      loaiViec: "doc-de-bai",
      dieuKienChup: "tot",
      nguoiDocDuoc: true,
      lop: 2,
      deBai: "Đặt tính rồi tính: 56 + 37",
    },
    {
      tep: "12-de-tang-2.png",
      loaiViec: "doc-de-bai",
      dieuKienChup: "den-ban-buoi-toi",
      nguoiDocDuoc: true,
      lop: 2,
      deBai:
        "Một cửa hàng có 45 kg gạo, buổi sáng bán được 18 kg. Hỏi cửa hàng còn lại bao nhiêu ki-lô-gam gạo?",
    },
  ],
};

/** Ghi bộ ảnh diễn tập ra đĩa. Mỗi ảnh một màu khác nhau để vân tay khác nhau. */
export async function ghiBoAnhDienTap(thuMuc: string): Promise<Map<string, string>> {
  await mkdir(thuMuc, { recursive: true });
  const theoTep = new Map<string, string>();
  for (const [i, a] of NHAN_DIEN_TAP.anh.entries()) {
    const png = pngMotMau(16 + i, 16, [(i * 20) % 256, (i * 37) % 256, (i * 53) % 256]);
    await writeFile(path.join(thuMuc, a.tep), png);
    theoTep.set(a.tep, png.toString("base64"));
  }
  return theoTep;
}
