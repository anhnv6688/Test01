import { getDb } from "./db";
import {
  danhSachCon, ghiDongY, layHo, lichSuCuaCon, lichSuDongY, lichSuViecAnh,
  luotDungCuaHo, nguoiGiamHoHienTai,
} from "./repo";
import { MUC_DICH } from "@/lib/privacy/consent";
import type { NguoiGiamHo } from "@/lib/privacy/nguoi-giam-ho";
import type { ThangNamSinh } from "@/lib/privacy/tuoi";

/**
 * Thực thi yêu cầu của người dùng về dữ liệu của mình.
 *
 * BR-39 nói rõ: "Cần có người trực và quy trình, không chỉ có một địa chỉ thư
 * điện tử." Một bảng trực chỉ đổi được trạng thái từ "mới" sang "hoàn thành"
 * mà không làm gì thật thì cũng chỉ là một địa chỉ thư điện tử đắt tiền hơn.
 *
 * Ba hành động dưới đây là ba việc thật mà người trực bấm một nút là xong.
 */

/**
 * Xuất toàn bộ dữ liệu của một hộ.
 *
 * Phục vụ hai loại yêu cầu cùng lúc: "xem dữ liệu Ô Ly đang giữ" và "xuất dữ
 * liệu ra tệp". Cố ý gom hết mọi bảng có dính tới hộ — nếu sau này ai đó thêm
 * một bảng mới mà quên thêm vào đây thì người dùng sẽ nhận một bản xuất thiếu,
 * và đó là vi phạm chứ không phải thiếu sót nhỏ.
 */
export interface BanXuatDuLieu {
  xuatLuc: string;
  ho: { ten: string; diaBan: string; goi: string; hetHanAt: string | null };
  con: {
    tenGoi: string; lop: number; soLuotBai: number;
    thangNamSinh: ThangNamSinh | null;
  }[];
  /** Người đại diện theo pháp luật đang có hiệu lực (CR-05). */
  nguoiDaiDien: NguoiGiamHo | null;
  lichSuHocTap: unknown[];
  lichSuDongY: unknown[];
  luotXuLyAnh: { at: string; loai: string; thanhCong: boolean; maLoi: string | null }[];
  luotTinhPhi: unknown[];
  ghiChu: string[];
}

export function xuatDuLieuHo(householdId: string): BanXuatDuLieu | null {
  const ho = layHo(householdId);
  if (!ho) return null;
  const con = danhSachCon(householdId);

  return {
    xuatLuc: new Date().toISOString(),
    ho: { ten: ho.ten, diaBan: ho.diaBan, goi: ho.goi, hetHanAt: ho.hetHanAt },
    con: con.map((c) => ({
      tenGoi: c.tenGoi,
      lop: c.lop,
      // Tháng năm sinh nằm trong bản xuất vì nó là dữ liệu cá nhân Ô Ly đang
      // giữ; giấu nó đi thì bản xuất không còn là "toàn bộ" nữa (CR-05).
      thangNamSinh: c.thangNamSinh,
      soLuotBai: lichSuCuaCon(c.id, 5000).length,
    })),
    nguoiDaiDien: nguoiGiamHoHienTai(householdId),
    lichSuHocTap: con.flatMap((c) =>
      lichSuCuaCon(c.id, 5000).map((a) => ({ tenGoi: c.tenGoi, ...a })),
    ),
    lichSuDongY: lichSuDongY(householdId),
    luotXuLyAnh: lichSuViecAnh(householdId, 5000).map((v) => ({
      at: v.at, loai: v.loai, thanhCong: v.thanhCong, maLoi: v.maLoi,
    })),
    luotTinhPhi: luotDungCuaHo(householdId),
    ghiChu: [
      "Ô Ly không giữ ảnh nào. Mỗi ảnh chụp bị xóa ngay sau khi trả kết quả, chỉ giữ lại phần đã đọc ra thành chữ và số.",
      "Ô Ly không giữ ảnh khuôn mặt của trẻ, và không lưu nét chữ dưới bất kỳ dạng nào có thể dùng để nhận ra trẻ.",
      "Bản xuất này gồm toàn bộ dữ liệu Ô Ly đang giữ về hộ gia đình, tại thời điểm ghi ở trường xuatLuc.",
      "Ô Ly chỉ giữ THÁNG và NĂM sinh của con, không giữ ngày sinh — chừng đó là đủ để biết con đã đủ 7 tuổi hay chưa.",
    ],
  };
}

/**
 * Rút toàn bộ sự đồng ý.
 *
 * Ghi một bản ghi TẮT cho từng mục đích thay vì xóa lịch sử đồng ý cũ. Lịch sử
 * phải còn nguyên vì nó chính là bằng chứng của CR-04: chứng minh được rằng
 * trước đây đã hỏi, và chứng minh được rằng nay đã tắt theo yêu cầu.
 */
export function rutToanBoDongY(householdId: string): number {
  for (const m of MUC_DICH) ghiDongY(householdId, m.ma, false);
  return MUC_DICH.length;
}

export interface KetQuaXoa {
  soCon: number;
  soLuotBai: number;
  soViecAnh: number;
}

/**
 * Xóa toàn bộ dữ liệu của một hộ.
 *
 * Xóa thật, xóa dây chuyền, không có "đánh dấu đã xóa" rồi giữ lại. Nếu giữ lại
 * thì đó không phải là xóa, và nói với người dùng rằng đã xóa là nói dối.
 *
 * Nhật ký xử lý sống sót vì bảng nhat_ky_xu_ly cố ý không có khóa ngoại tới
 * households — xem chú thích ở lược đồ. Nhờ vậy Ô Ly vẫn chứng minh được là đã
 * nhận yêu cầu và đã xóa đúng hạn, mà không giữ lại gì của hộ đó.
 */
export function xoaDuLieuHo(householdId: string): KetQuaXoa | null {
  const ho = layHo(householdId);
  if (!ho) return null;
  const con = danhSachCon(householdId);
  const dem: KetQuaXoa = {
    soCon: con.length,
    soLuotBai: con.reduce((s, c) => s + lichSuCuaCon(c.id, 5000).length, 0),
    soViecAnh: lichSuViecAnh(householdId, 5000).length,
  };

  const d = getDb();
  // Khóa ngoại đã bật và khai ON DELETE CASCADE, nên một câu lệnh là đủ.
  // Vẫn bọc trong giao dịch: xóa nửa chừng còn tệ hơn không xóa.
  d.transaction(() => {
    d.prepare("DELETE FROM households WHERE id = ?").run(householdId);
  })();

  return dem;
}

/** Đếm những gì còn sót lại của một hộ — dùng để kiểm chứng việc xóa. */
export function conSotLaiCuaHo(householdId: string): number {
  const d = getDb();
  const bang = [
    ["households", "id"],
    ["children", "household_id"],
    ["consents", "household_id"],
    ["guardians", "household_id"],
    ["meter_events", "household_id"],
    ["photo_jobs", "household_id"],
    ["data_requests", "household_id"],
  ] as const;
  let tong = 0;
  for (const [ten, cot] of bang) {
    const r = d.prepare(`SELECT COUNT(*) AS n FROM ${ten} WHERE ${cot} = ?`).get(householdId) as { n: number };
    tong += r.n;
  }
  // sessions và attempts trỏ tới children, đã bị xóa dây chuyền theo.
  return tong;
}
