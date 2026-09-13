import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { chamCotDoc } from "@/lib/domain/column-marking";
import { sinhBai } from "@/lib/domain/generator";
import { kiemTraQuyen } from "@/lib/domain/metering";
import { soanLoiGiang, type MucChiTiet } from "@/lib/domain/teaching";
import { dangBat } from "@/lib/privacy/consent";
import { dungGoiGuiDi } from "@/lib/privacy/envelope";
import { kiemTraChungTuChe, ThieuCheAnhError } from "@/lib/privacy/redaction";
import { dungAnhRoiXoa } from "@/lib/privacy/retention";
import {
  ghiLuotXuLyTrang, ghiViecAnh, hoDauTien, lichSuDongY, soTrangDaDungThangNay,
} from "@/lib/server/repo";
import { layNhaCungCap } from "@/lib/vision/mock";
import type { ChatLuongAnh } from "@/lib/vision/provider";

export const runtime = "nodejs";

/**
 * Luồng xử lý một trang ảnh — nhóm F.
 *
 * Thứ tự các bước dưới đây không phải ngẫu nhiên, và không được đổi:
 *
 *   1. Kiểm tra sự đồng ý theo đúng mục đích       (BR-37, CR-04)
 *   2. Kiểm tra trần định lượng                    (BR-19, BR-20)
 *   3. Kiểm tra chứng từ che ảnh tại thiết bị      (BR-32) — lớp 1
 *   4. Dựng gói gửi đi theo danh sách trắng        (BR-34) — lớp 2
 *   5. Gọi bên xử lý, xóa ảnh trong khối finally   (BR-35) — lớp 3
 *   6. Ghi lượt CHỈ KHI đã có kết quả              (BR-31)
 *
 * Ba lớp ở bước 3, 4, 5 phải làm đủ mới có giá trị: thiếu một lớp thì hai lớp
 * còn lại mất tác dụng pháp lý (ghi chú cuối mục 6.6 của BRD).
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    loaiViec?: "doc-de-bai" | "cham-bai-lam";
    anhBase64?: string;
    chungTuChe?: unknown;
    chatLuong?: ChatLuongAnh;
    mucChiTiet?: MucChiTiet;
    lop?: 1 | 2;
  };
  const loaiViec = body.loaiViec;
  if (!loaiViec || !body.anhBase64 || !body.chatLuong) {
    return NextResponse.json({ loi: "thiếu dữ liệu" }, { status: 400 });
  }

  const ho = hoDauTien();
  if (!ho) return NextResponse.json({ loi: "chưa có hộ nào" }, { status: 404 });

  // Bước 1 — sự đồng ý, tách riêng theo mục đích.
  const mucDich = loaiViec === "doc-de-bai" ? "doc-anh-de-bai" : "cham-bai-viet-tay";
  const dongY = lichSuDongY(ho.id);
  if (!dangBat(dongY, mucDich)) {
    return NextResponse.json(
      {
        ok: false,
        canDongY: mucDich,
        thongBao:
          "Tính năng này cần anh chị bật riêng trong mục Quyền riêng tư. Ô Ly không bật sẵn giúp, và các phần khác của ứng dụng vẫn dùng bình thường nếu anh chị để tắt.",
      },
      { status: 200 },
    );
  }

  // Bước 2 — trần định lượng. Chưa gọi ra ngoài nên chưa tốn đồng nào.
  const daDung = soTrangDaDungThangNay(ho.id);
  const quyen = kiemTraQuyen("xu-ly-trang-anh", {
    goi: ho.goi,
    hetHan: ho.hetHanAt ? new Date(ho.hetHanAt) < new Date() : false,
    daDungThangNay: daDung,
  });
  if (!quyen.duocPhep) {
    return NextResponse.json({ ok: false, hetLuot: true, thongBao: quyen.lyDo }, { status: 200 });
  }

  // Bước 3 — lớp thứ nhất: ảnh phải được che ngay trên thiết bị của phụ huynh.
  try {
    kiemTraChungTuChe(body.chungTuChe);
  } catch (e) {
    const loi = e instanceof ThieuCheAnhError ? e.message : "Ảnh không hợp lệ.";
    return NextResponse.json({ ok: false, thongBao: loi }, { status: 400 });
  }

  // Bước 4 — lớp thứ hai: gói gửi đi không mang theo mã truy ngược nào.
  const goi = dungGoiGuiDi({
    loaiViec: loaiViec === "doc-de-bai" ? "doc-de-bai" : "cham-bai-lam",
    lop: body.lop ?? 2,
    hocKy: 2,
    anhBase64: body.anhBase64,
  });

  // Bước 5 — lớp thứ ba: ảnh chỉ sống trong bộ nhớ đúng một lần gọi.
  const maAnh = randomUUID();
  const bytes = Buffer.from(body.anhBase64, "base64");
  const kq = await dungAnhRoiXoa(maAnh, bytes, async () =>
    layNhaCungCap().xuLy(goi, body.chatLuong as ChatLuongAnh),
  );

  // Bước 6 — thất bại thì nói rõ lý do và KHÔNG trừ lượt (BR-31).
  if (!kq.ok) {
    ghiViecAnh({
      householdId: ho.id,
      loai: loaiViec,
      thanhCong: false,
      ketQua: null,
      maLoi: kq.loi.ma,
      vungDaChe: body.chungTuChe,
    });
    return NextResponse.json({
      ok: false,
      khongDocDuoc: true,
      maLoi: kq.loi.ma,
      thongBao: kq.loi.noiGiVoiPhuHuynh,
      truLuot: false,
    });
  }

  let ketQua: unknown;
  if (kq.ketQua.loai === "doc-de-bai") {
    const khuon = kq.ketQua.khuonDangKhop;
    if (!khuon) {
      ghiViecAnh({
        householdId: ho.id, loai: loaiViec, thanhCong: false, ketQua: null,
        maLoi: "ngoai-pham-vi", vungDaChe: body.chungTuChe,
      });
      return NextResponse.json({
        ok: false,
        khongDocDuoc: true,
        maLoi: "ngoai-pham-vi",
        thongBao:
          "Ô Ly đọc được chữ trong ảnh nhưng chưa nhận ra dạng bài này trong chương trình lớp 1–2, nên không dám giảng để khỏi giảng sai. Lần chụp này không bị trừ lượt.",
        truLuot: false,
      });
    }
    const bai = sinhBai(khuon, Math.floor(Math.random() * 2_000_000_000));
    const muc: MucChiTiet = body.mucChiTiet ?? "giang-tu-dau";
    const loiGiang = soanLoiGiang(bai, muc);
    // BR-37: tắt mục đích soạn lời giảng thì mất phần gợi ý cách hỏi con,
    // các bước giải vẫn còn nguyên — không sập cả tính năng.
    const batSoanGiang = dangBat(dongY, "sinh-loi-giang");
    ketQua = {
      loai: "loi-giang",
      loiGiang: batSoanGiang
        ? loiGiang
        : { ...loiGiang, buoc: loiGiang.buoc.map((b) => ({ ...b, hoiCon: "" })) },
      coGoiYCachHoi: batSoanGiang,
      deBaiDocDuoc: kq.ketQua.deBai,
    };
  } else {
    const c = kq.ketQua;
    ketQua = {
      loai: "cham-bai",
      cham: chamCotDoc(c.soA, c.soB, c.phepTinh, c.chuSoTre),
      docDuoc: c.buocDocDuoc,
    };
  }

  ghiViecAnh({
    householdId: ho.id, loai: loaiViec, thanhCong: true, ketQua,
    maLoi: null, vungDaChe: body.chungTuChe,
  });
  // Chỉ tới đây mới ghi lượt: kết quả đã có, phụ huynh sắp nhận được.
  ghiLuotXuLyTrang(ho.id);

  return NextResponse.json({
    ok: true,
    ketQua,
    anhDaXoa: true,
    nhanMay: "Phần lời giảng và phần chấm do trí tuệ nhân tạo tạo ra, anh chị là người quyết định cuối cùng.",
    conLai: (() => {
      const sau = soTrangDaDungThangNay(ho.id);
      return { daDung: sau, goi: ho.goi };
    })(),
  });
}
