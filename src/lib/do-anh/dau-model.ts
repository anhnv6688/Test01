import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";
import type { ChiPhiLanGoi, KetQuaXuLy } from "@/lib/vision/provider";

/**
 * So kết quả của NHIỀU mô hình trên CÙNG MỘT ảnh.
 *
 * Khác hẳn bộ đo ở chay.ts: bộ đo kia chấm từng mô hình theo NHÃN do người gắn,
 * và trả lời câu "đọc đúng bao nhiêu phần trăm". Tệp này không có nhãn, nên nó
 * không trả lời được câu ấy — và đó là điều phải nói ra to nhất.
 *
 * ĐỒNG THUẬN KHÔNG PHẢI LÀ ĐÚNG. Ba mô hình cùng đọc "65" thì chỉ biết ba mô
 * hình cùng đọc "65"; trên giấy có thể là 55. Chúng còn dễ sai giống nhau, vì
 * cùng học từ những nguồn na ná nhau và đều thấy cùng một nét chữ nhòe. Lấy
 * đồng thuận làm đáp án là tự dựng một cái nhãn giả rồi chấm điểm theo nó, và
 * cái nhãn giả ấy sai đúng ở những chỗ khó nhất — tức là những chỗ cần đo nhất.
 *
 * Vậy nó dùng để làm gì:
 *
 *   1. CHỖ BẤT ĐỒNG LÀ CHỖ KHÓ. Chạy trên vài chục ảnh, những ô mà các mô hình
 *      cãi nhau chính là danh sách ngắn đáng đem đi gắn nhãn trước — thay vì
 *      gắn nhãn tuần tự từ ảnh số một.
 *   2. Đo được CHI PHÍ và THỜI GIAN thật, hai thứ không cần nhãn mới đo được.
 *      Phụ huynh đứng chờ bằng đúng số mili giây ấy.
 *   3. Bắt được lỗi thô: mô hình trả về sai lược đồ, bỏ sót bài, hoặc đọc được
 *      trang mà mô hình khác bảo không đọc nổi.
 *
 * Muốn biết mô hình nào ĐÚNG hơn thì vẫn phải gắn nhãn và chạy `npm run do-anh`.
 * Tệp này rút ngắn đường tới đó, không thay thế nó.
 */

export interface KetQuaMotBen {
  ten: string;
  /** Vắng nghĩa là lần gọi ném lỗi — xem `hong`. */
  ketQua: KetQuaXuLy | null;
  hong: string | null;
  chiPhi: ChiPhiLanGoi | null;
}

export interface OBatDong {
  /** Thứ tự bài trên trang, đếm từ 1. */
  viTri: number;
  /** Tên trường lệch, ví dụ "dang" hay "ketQuaTre". */
  truong: string;
  /** Mỗi bên đọc ra gì. Khóa là tên bên. */
  theoBen: Record<string, string>;
}

export interface BaoCaoDau {
  soBen: number;
  /** Số bài mà bên đọc được nhiều bài nhất tìm thấy. */
  soBaiNhieuNhat: number;
  /** Các bên không cùng số bài — dấu hiệu nặng hơn lệch một con số. */
  lechSoBai: boolean;
  batDong: OBatDong[];
  /** Số ô so được và giống nhau ở MỌI bên. */
  soODongThuan: number;
  /** Tổng số ô đã so. */
  soOSoDuoc: number;
}

/**
 * Trải một bài thành các cặp trường–giá trị để so từng ô.
 *
 * So theo từng trường chứ không so cả đối tượng: hai mô hình đọc giống hệt nhau
 * trừ đúng một chữ số thì đó là một thông tin hoàn toàn khác với "đọc ra hai
 * bài khác nhau", và một phép so bằng đối tượng gộp cả hai thành "khác".
 */
export function traiBai(b: DangBaiLam): Record<string, string> {
  const o: Record<string, string> = { dang: b.dang };
  for (const [k, v] of Object.entries(b as unknown as Record<string, unknown>)) {
    if (k === "dang") continue;
    if (v === null || v === undefined) continue;
    o[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
  }
  return o;
}

function baiCuaBen(k: KetQuaMotBen): DangBaiLam[] | null {
  if (!k.ketQua || !k.ketQua.ok) return null;
  const r = k.ketQua.ketQua;
  return r.loai === "cham-bai-lam" ? r.cacBai : null;
}

export function soSanh(cacBen: KetQuaMotBen[]): BaoCaoDau {
  const doc = cacBen.map((b) => ({ ten: b.ten, bai: baiCuaBen(b) })).filter((b) => b.bai !== null);
  const soBaiNhieuNhat = doc.reduce((m, b) => Math.max(m, b.bai!.length), 0);
  const lechSoBai = new Set(doc.map((b) => b.bai!.length)).size > 1;

  const batDong: OBatDong[] = [];
  let soODongThuan = 0;
  let soOSoDuoc = 0;

  for (let i = 0; i < soBaiNhieuNhat; i++) {
    // Chỉ so những bên THẬT SỰ có bài ở vị trí này. Bên đọc thiếu bài đã bị
    // `lechSoBai` nêu riêng rồi; đếm nó thành "bất đồng ở mọi ô" sẽ nhấn chìm
    // những lệch một chữ số, mà đó mới là thứ khó thấy.
    const co = doc.filter((b) => b.bai![i] !== undefined);
    if (co.length < 2) continue;

    const trai = co.map((b) => ({ ten: b.ten, o: traiBai(b.bai![i]) }));
    const moiTruong = new Set(trai.flatMap((t) => Object.keys(t.o)));

    for (const truong of moiTruong) {
      const theoBen: Record<string, string> = {};
      for (const t of trai) theoBen[t.ten] = t.o[truong] ?? "(không có)";
      soOSoDuoc += 1;
      if (new Set(Object.values(theoBen)).size === 1) soODongThuan += 1;
      else batDong.push({ viTri: i + 1, truong, theoBen });
    }
  }

  return {
    soBen: cacBen.length,
    soBaiNhieuNhat,
    lechSoBai,
    batDong,
    soODongThuan,
    soOSoDuoc,
  };
}

/** Tỷ lệ ô mọi bên nói giống nhau. null khi chưa so được ô nào. */
export function tyLeDongThuan(bc: BaoCaoDau): number | null {
  return bc.soOSoDuoc === 0 ? null : bc.soODongThuan / bc.soOSoDuoc;
}
