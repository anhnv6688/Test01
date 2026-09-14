import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { giaiDeTatDinh } from "@/lib/domain/giang-de-doc-duoc";
import type { MucChiTiet } from "@/lib/domain/teaching";
import { dungGoiGuiDi } from "@/lib/privacy/envelope";
import type { ChatLuongAnh, ChiPhiLanGoi, NhaCungCapXuLyAnh } from "@/lib/vision/provider";
import { gopBaoCao, type BaoCaoDo, type DongDo } from "./bao-cao";
import { kiemTraNhan, type NhanBoAnh, type NhanMotAnh } from "./nhan";
import { soKhopDeBai, soKhopMotAnh } from "./so-khop";

/**
 * Chạy bộ ảnh đo qua một nhà cung cấp và dựng báo cáo.
 *
 * Ba quyết định trong tệp này đáng nói ra, vì chúng làm con số đo được khác đi:
 *
 * 1. Bộ đo KHÔNG chạy vòng tiền kiểm chất lượng ảnh của trình duyệt (BR-30).
 *    Vòng đó là việc của máy khách và nó sẽ chặn ảnh tối trước khi tốn tiền.
 *    Nhưng ở đây ta cần biết máy LÀM GÌ với một tấm ảnh tối — từ chối tử tế hay
 *    đọc bừa. Chặn trước thì không bao giờ biết. Vì vậy mọi ảnh đều được gửi đi,
 *    kể cả ảnh mà sản phẩm thật sẽ chặn từ đầu.
 *
 * 2. Gọi tuần tự, không gọi song song. Bộ ảnh đo nhỏ, còn gọi song song thì dễ
 *    đụng giới hạn tần suất và làm số đo thời gian chờ mất ý nghĩa.
 *
 * 3. Kiểm đủ tệp ảnh có thật TRƯỚC lần gọi đầu tiên. Chạy được nửa bộ rồi mới
 *    hỏng vì thiếu một tệp là đã tiêu tiền cho một lần đo không dùng được.
 */
export interface CauHinhChay {
  thuMuc: string;
  nhan: unknown;
  nhaCungCap: NhaCungCapXuLyAnh;
  mucChiTiet?: MucChiTiet;
  /** Gọi sau mỗi ảnh, để CLI in tiến độ. */
  baoTien?: (daXong: number, tong: number, tep: string) => void;
}

export class ThieuAnhError extends Error {
  constructor(cacTep: string[]) {
    super(
      `Không tìm thấy ${cacTep.length} tệp ảnh có trong nhãn: ${cacTep.join(", ")}. ` +
        `Bộ đo dừng trước khi gọi lần nào để khỏi tốn tiền cho một lần đo dở dang.`,
    );
    this.name = "ThieuAnhError";
  }
}

/**
 * Số đo chất lượng giả, cố ý đặt qua mọi ngưỡng tiền kiểm.
 *
 * Xem ghi chú 1 ở đầu tệp: bộ đo muốn mọi ảnh đều tới được mô hình.
 */
const CHAT_LUONG_CHO_QUA: ChatLuongAnh = { doSang: 200, doTuongPhan: 60, canhDai: 1600 };

async function kiemDuAnh(thuMuc: string, nhan: NhanBoAnh): Promise<void> {
  const thieu: string[] = [];
  for (const a of nhan.anh) {
    try {
      await stat(path.join(thuMuc, a.tep));
    } catch {
      thieu.push(a.tep);
    }
  }
  if (thieu.length > 0) throw new ThieuAnhError(thieu);
}

async function doMotAnh(
  thuMuc: string,
  a: NhanMotAnh,
  ncc: NhaCungCapXuLyAnh,
  muc: MucChiTiet,
): Promise<DongDo> {
  const anhBase64 = (await readFile(path.join(thuMuc, a.tep))).toString("base64");
  const goi = dungGoiGuiDi({
    loaiViec: a.loaiViec,
    lop: a.lop ?? 2,
    hocKy: 2,
    anhBase64,
  });

  const kq = await ncc.xuLy(goi, CHAT_LUONG_CHO_QUA);
  const chiPhiDocAnh: ChiPhiLanGoi | null = kq.chiPhi ?? null;

  if (!kq.ok) {
    return {
      khop: soKhopMotAnh(a.tep, a.nguoiDocDuoc, a.cacBai ?? [], { docDuoc: false, cacBai: [] }),
      dieuKienChup: a.dieuKienChup,
      loaiViec: a.loaiViec,
      maLoi: kq.loi.ma,
      dungTang2: false,
      chiPhiDocAnh,
      chiPhiSoanGiang: null,
      khopDeBai: null,
    };
  }

  if (kq.ketQua.loai === "cham-bai-lam") {
    return {
      khop: soKhopMotAnh(a.tep, a.nguoiDocDuoc, a.cacBai ?? [], {
        docDuoc: true,
        cacBai: kq.ketQua.cacBai,
      }),
      dieuKienChup: a.dieuKienChup,
      loaiViec: a.loaiViec,
      maLoi: null,
      dungTang2: false,
      chiPhiDocAnh,
      chiPhiSoanGiang: null,
      khopDeBai: null,
    };
  }

  // Ảnh chụp đề bài. Tầng nào là do đề quyết định, đúng như luồng thật:
  // mã nguồn giải được thì không gọi mô hình nào thêm.
  const doc = kq.ketQua;
  const giaiDuoc = giaiDeTatDinh(doc.de) !== null;
  let chiPhiSoanGiang: ChiPhiLanGoi | null = null;
  if (!giaiDuoc) {
    // Đo cả nhánh tầng 2, vì đó là nhánh đắt nhất và là biến chưa ai đo.
    const truoc = Date.now();
    await ncc.soanLoiGiang(doc.deBai, muc);
    // Nhà cung cấp không báo chi phí riêng cho lần soạn giảng qua giao diện
    // này, nên chỉ ghi nhận thời gian chờ thật; phần token để trống chứ không
    // ước lượng.
    chiPhiSoanGiang = {
      tokenVaoMoi: 0,
      tokenVaoTuDem: 0,
      tokenRa: 0,
      thoiGianMs: Date.now() - truoc,
      model: "",
    };
  }

  return {
    khop: soKhopMotAnh(a.tep, a.nguoiDocDuoc, [], { docDuoc: true, cacBai: [] }),
    dieuKienChup: a.dieuKienChup,
    loaiViec: a.loaiViec,
    maLoi: null,
    dungTang2: !giaiDuoc,
    chiPhiDocAnh,
    chiPhiSoanGiang,
    khopDeBai: a.deBai ? soKhopDeBai(a.deBai, doc.deBai) : null,
  };
}

export async function chayBoDo(
  ch: CauHinhChay,
): Promise<{ dong: DongDo[]; baoCao: BaoCaoDo; nhan: NhanBoAnh }> {
  const nhan = kiemTraNhan(ch.nhan);
  await kiemDuAnh(ch.thuMuc, nhan);

  const muc: MucChiTiet = ch.mucChiTiet ?? "giang-tu-dau";
  const dong: DongDo[] = [];
  for (const [i, a] of nhan.anh.entries()) {
    dong.push(await doMotAnh(ch.thuMuc, a, ch.nhaCungCap, muc));
    ch.baoTien?.(i + 1, nhan.anh.length, a.tep);
  }
  return { dong, baoCao: gopBaoCao(dong), nhan };
}
