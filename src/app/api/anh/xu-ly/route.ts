import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { chamCaTrang, tomTatTrang } from "@/lib/domain/cham-bai";
import { kiemTraQuyen } from "@/lib/domain/metering";
import type { LoiGiang, MucChiTiet } from "@/lib/domain/teaching";
import { giaiDeTatDinh, soanLoiGiangTatDinh } from "@/lib/domain/giang-de-doc-duoc";
import { dangBat } from "@/lib/privacy/consent";
import { dieuKienXuLy } from "@/lib/server/du-dieu-kien";
import { dungGoiGuiDi } from "@/lib/privacy/envelope";
import { kiemTraChungTuChe, ThieuCheAnhError } from "@/lib/privacy/redaction";
import { dungAnhRoiXoa } from "@/lib/privacy/retention";
import {
  danhSachCon, ghiLuotXuLyTrang, ghiViecAnh, hoDauTien, lichSuDongY, mucDaDung,
} from "@/lib/server/repo";
import { layNhaCungCap } from "@/lib/vision/chon-nha-cung-cap";
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
    childId?: string;
  };
  const loaiViec = body.loaiViec;
  if (!loaiViec || !body.anhBase64 || !body.chatLuong) {
    return NextResponse.json({ loi: "thiếu dữ liệu" }, { status: 400 });
  }

  const ho = hoDauTien();
  if (!ho) return NextResponse.json({ loi: "chưa có hộ nào" }, { status: 404 });

  /*
   * Ảnh này là bài của ĐỨA TRẺ NÀO.
   *
   * Trước CR-05, luồng ảnh không cần biết điều đó và lớp học lấy thẳng từ máy
   * khách. Bây giờ thì cần, vì chế độ đồng ý phụ thuộc vào tuổi của chính đứa
   * trẻ có bài trong ảnh: một hộ có bé lớp 1 sáu tuổi và bé lớp 2 tám tuổi thì
   * hai bé thuộc hai chế độ khác nhau. Lớp cũng lấy từ bản ghi của trẻ chứ
   * không nhận từ máy khách nữa — máy khách không phải chỗ quyết định việc đó.
   */
  const cacCon = danhSachCon(ho.id);
  const con = body.childId ? cacCon.find((c) => c.id === body.childId) : cacCon[0];
  if (!con) {
    return NextResponse.json(
      { ok: false, thongBao: "Anh chị chọn giúp đây là bài của bạn nào trong nhà nhé." },
      { status: 200 },
    );
  }

  // Bước 1 — căn cứ xử lý dữ liệu của trẻ: người đại diện theo pháp luật đã
  // xác minh, đã đồng ý đúng mục đích, và nếu con từ đủ 7 tuổi thì chính con
  // cũng đã được hỏi và đồng ý (CR-05, BR-37, CR-04).
  const mucDich = loaiViec === "doc-de-bai" ? "doc-anh-de-bai" : "cham-bai-viet-tay";
  const dongY = lichSuDongY(ho.id);
  const dieuKien = dieuKienXuLy(ho.id, con, mucDich);
  if (!dieuKien.duDieuKien) {
    return NextResponse.json(
      {
        ok: false,
        thieu: dieuKien.thieu,
        // Giữ lại trường cũ cho giao diện: chỉ thiếu mỗi phần bật mục đích thì
        // chỗ cần đi tới vẫn là trang Quyền riêng tư.
        canDongY: dieuKien.thieu.includes("chua-co-dong-y-nguoi-giam-ho") ? mucDich : undefined,
        tenCon: con.tenGoi,
        thongBao: dieuKien.noiGiVoiPhuHuynh,
      },
      { status: 200 },
    );
  }

  // Bước 2 — trần định lượng. Chưa gọi ra ngoài nên chưa tốn đồng nào.
  const quyen = kiemTraQuyen("xu-ly-trang-anh", {
    goi: ho.goi,
    hetHan: ho.hetHanAt ? new Date(ho.hetHanAt) < new Date() : false,
    daDung: mucDaDung(ho.id),
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
    lop: con.lop,
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
  let tangDaDung: 1 | 2 = 1;
  if (kq.ketQua.loai === "doc-de-bai") {
    const doc = kq.ketQua;
    const muc: MucChiTiet = body.mucChiTiet ?? "giang-tu-dau";
    const batSoanGiang = dangBat(dongY, "sinh-loi-giang");

    /*
     * Hai tầng soạn lời giảng.
     *
     * Tầng 1 — đề có cấu trúc mà mã nguồn giải được. Đáp án tính tất định, lời
     * giảng lắp từ khuôn có sẵn, KHÔNG gọi mô hình nào. Đây là phần lớn số
     * trang và là lý do chi phí trung bình mỗi trang thấp.
     *
     * Tầng 2 — bài toán có lời văn. Phải nhờ mô hình mạnh soạn, và đây là lần
     * gọi đắt nhất trong toàn sản phẩm.
     *
     * Điểm quan trọng chung cho cả hai tầng: lời giảng bám ĐÚNG đề trong ảnh
     * của phụ huynh. Phiên bản trước sinh một bài khác từ kho rồi giảng bài đó,
     * nghĩa là hộ chụp "45 + 27" có thể nhận về lời giảng cho "38 + 24" — còn
     * tệ hơn không giảng gì.
     */
    const giai = giaiDeTatDinh(doc.de);
    let loiGiang: LoiGiang | null = null;

    if (giai) {
      loiGiang = soanLoiGiangTatDinh(doc.de, giai, muc, doc.deBai);
    } else if (batSoanGiang) {
      tangDaDung = 2;
      loiGiang = await layNhaCungCap().soanLoiGiang(doc.deBai, muc);
    }

    if (!loiGiang) {
      ghiViecAnh({
        householdId: ho.id, loai: loaiViec, thanhCong: false, ketQua: null,
        maLoi: "ngoai-pham-vi", vungDaChe: body.chungTuChe,
      });
      // Không trừ lượt: Ô Ly không giao được thứ phụ huynh cần (BR-31).
      return NextResponse.json({
        ok: false,
        khongDocDuoc: true,
        maLoi: "ngoai-pham-vi",
        thongBao: !batSoanGiang
          ? "Bài này là bài toán có lời văn nên Ô Ly cần bật mục Soạn lời giảng trong phần Quyền riêng tư mới giảng được. Các phần khác vẫn dùng bình thường. Lần chụp này không bị trừ lượt."
          : "Ô Ly đọc được chữ trong ảnh nhưng chưa đủ chắc chắn để giảng bài này, nên không dám giảng để khỏi giảng sai. Lần chụp này không bị trừ lượt.",
        truLuot: false,
      });
    }

    ketQua = {
      loai: "loi-giang",
      loiGiang: batSoanGiang
        ? loiGiang
        // BR-37: tắt mục đích soạn lời giảng thì mất phần gợi ý cách hỏi con,
        // các bước giải vẫn còn nguyên — không sập cả tính năng.
        : { ...loiGiang, buoc: loiGiang.buoc.map((b) => ({ ...b, hoiCon: "" })) },
      coGoiYCachHoi: batSoanGiang,
      deBaiDocDuoc: doc.deBai,
      // Hiện cho phụ huynh biết đề có dấu hiệu bất thường không (BR-18).
      nghiNgo: doc.nghiNgo,
      tang: tangDaDung,
    };
  } else {
    const c = kq.ketQua;
    // Bên xử lý ảnh chỉ phiên âm; việc chấm làm ở đây, bằng mã tất định.
    const cham = chamCaTrang(c.cacBai);
    ketQua = {
      loai: "cham-bai",
      cham,
      tomTat: tomTatTrang(cham),
      docDuoc: c.buocDocDuoc,
    };
  }

  ghiViecAnh({
    householdId: ho.id, loai: loaiViec, thanhCong: true, ketQua,
    maLoi: null, vungDaChe: body.chungTuChe,
  });
  // Chỉ tới đây mới ghi lượt: kết quả đã có, phụ huynh sắp nhận được.
  // Ghi kèm tầng để đo được tần suất tầng 2 trong vận hành thật (BR-22).
  ghiLuotXuLyTrang(ho.id, tangDaDung);

  return NextResponse.json({
    ok: true,
    ketQua,
    anhDaXoa: true,
    nhanMay: "Phần lời giảng và phần chấm do trí tuệ nhân tạo tạo ra, anh chị là người quyết định cuối cùng.",
    conLai: { ...mucDaDung(ho.id), goi: ho.goi },
  });
}
