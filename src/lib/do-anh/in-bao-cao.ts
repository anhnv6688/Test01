import {
  bienDongGop,
  diemHoaVon,
  tranTrangHoMienPhi,
  tranTrangHoTraPhiLo,
} from "@/lib/domain/mo-hinh-chi-phi";
import { TRAN_MIEN_PHI_TRANG_NGAY } from "@/lib/domain/pricing";
import type { BaoCaoDo, ThongKeNhom } from "./bao-cao";

/**
 * In báo cáo đo ra chữ, cho người đọc chứ không cho máy.
 *
 * Thứ tự các mục cố ý không theo thứ tự dễ tính nhất mà theo thứ tự mức độ tai
 * hại: những lần Ô Ly nói sai về bài của trẻ đứng TRƯỚC tỷ lệ phiên âm, vì một
 * bản báo cáo mở đầu bằng "đọc đúng 94%" sẽ khiến người đọc yên tâm và bỏ qua
 * ba dòng báo động giả nằm ở cuối trang.
 */

const pt = (x: number | null): string => (x === null ? "chưa đo" : `${(x * 100).toFixed(1)}%`);
const d = (n: number): string => Math.round(n).toLocaleString("vi-VN");

function bangNhom(tieuDe: string, nhom: ThongKeNhom[], cotDau: string): string[] {
  if (nhom.length === 0) return [];
  const rong = Math.max(cotDau.length, ...nhom.map((n) => n.ten.length));
  const dong = [
    "",
    tieuDe,
    `  ${cotDau.padEnd(rong)}  ${"số bài".padStart(7)}  ${"khớp".padStart(7)}  ${"lệch KL".padStart(8)}  ${"báo động giả".padStart(13)}`,
  ];
  for (const n of nhom) {
    dong.push(
      `  ${n.ten.padEnd(rong)}  ${String(n.soBai).padStart(7)}  ${pt(n.tyLeKhop).padStart(7)}` +
        `  ${String(n.soLechKetLuan).padStart(8)}  ${String(n.soBaoDongGia).padStart(13)}`,
    );
  }
  return dong;
}

export function inBaoCao(b: BaoCaoDo): string {
  const r: string[] = [];
  r.push("BÁO CÁO ĐO BỘ ẢNH");
  r.push("=================");
  r.push(`Số ảnh: ${b.soAnh}   Số bài đã so: ${b.soBai}`);
  r.push(`Mô hình đã phục vụ: ${b.cacModel.filter(Boolean).join(", ") || "không rõ"}`);

  r.push("");
  r.push("1. Ô LY CÓ NÓI SAI VỀ BÀI CỦA TRẺ KHÔNG");
  r.push(`  Báo động giả (con làm đúng, Ô Ly bảo sai): ${b.demLechKetLuan["bao-dong-gia"]}`);
  r.push(`  Bỏ sót (con làm sai, Ô Ly bảo đúng):       ${b.demLechKetLuan["bo-sot"]}`);
  r.push(`  Mất kết luận (Ô Ly không dám kết luận):    ${b.demLechKetLuan["mat-ket-luan"]}`);
  r.push(`  Thêm kết luận (nhãn không kết luận được):  ${b.demLechKetLuan["them-ket-luan"]}`);
  r.push(`  Đọc bừa ảnh mà người không đọc nổi:        ${b.soDocBua}`);
  r.push(`  Từ chối oan ảnh mà người đọc được:         ${b.soTuChoiOan}`);

  r.push("");
  r.push("2. ĐỌC ĐÚNG ĐƯỢC BAO NHIÊU");
  r.push(`  Đọc được ngay lần chụp đầu: ${pt(b.tyLeDocDuocLanDau)}   (điều kiện ra mắt số 9)`);
  r.push(`  Bài phiên âm khớp hoàn toàn: ${pt(b.tyLeKhopChung)}`);
  r.push(`    khớp hết ${b.demMucKhop["khop-het"]}  đúng dạng sai số ${b.demMucKhop["dung-dang-sai-so"]}` +
    `  sai dạng ${b.demMucKhop["sai-dang"]}  thiếu bài ${b.demMucKhop.thieu}  thừa bài ${b.demMucKhop.thua}`);
  const tongDe = b.demKhopDe["khop-het"] + b.demKhopDe["khop-so"] + b.demKhopDe["sai-so"];
  if (tongDe > 0) {
    r.push(
      `  Ảnh chụp đề bài: đúng từng chữ ${b.demKhopDe["khop-het"]}` +
        `  đúng số khác chữ ${b.demKhopDe["khop-so"]}  SAI SỐ ${b.demKhopDe["sai-so"]}`,
    );
  }
  if (Object.keys(b.demMaLoi).length > 0) {
    r.push(`  Lý do từ chối: ${Object.entries(b.demMaLoi).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  }
  if (b.truongHaySai.length > 0) {
    r.push(
      `  Trường hay đọc sai: ${b.truongHaySai.slice(0, 6).map((t) => `${t.truong} (${t.soLan})`).join(", ")}`,
    );
  }

  r.push(...bangNhom("3. HỎNG Ở DẠNG BÀI NÀO", b.theoDang, "dạng bài"));
  r.push(...bangNhom("4. HỎNG Ở ĐIỀU KIỆN CHỤP NÀO", b.theoDieuKien, "điều kiện"));

  r.push("");
  r.push("5. CHI PHÍ VÀ THỜI GIAN CHỜ");
  r.push(`  Tỷ lệ chạm tầng 2 (nhờ mô hình mạnh soạn giảng): ${pt(b.tyLeTang2)}`);
  if (b.chiPhiTrungBinhMoiTrang === null) {
    r.push("  Chi phí: CHƯA ĐO ĐƯỢC — nhà cung cấp không báo số token.");
  } else {
    r.push(
      `  Chi phí trung bình một trang: ${d(b.chiPhiTrungBinhMoiTrang)} đ` +
        `   (đo trên ${b.soTrangDoDuocChiPhi}/${b.soAnh} trang)`,
    );
    if (b.chiPhiTrangCaoNhat !== null) {
      r.push(`  Trang tốn nhất: ${d(b.chiPhiTrangCaoNhat)} đ`);
    }
  }
  r.push(
    `  Thời gian chờ: trung vị ${b.thoiGianTrungViMs === null ? "chưa đo" : `${d(b.thoiGianTrungViMs)} ms`}` +
      `, p90 ${b.thoiGianP90Ms === null ? "chưa đo" : `${d(b.thoiGianP90Ms)} ms`}`,
  );

  if (b.chiPhiTrungBinhMoiTrang !== null) {
    /*
     * Cắm chi phí đo được vào mô hình lỗ lãi ngay tại đây.
     *
     * Để hai con số này ở hai bản báo cáo khác nhau là cách chắc chắn nhất để
     * không ai ghép chúng lại. Trần miễn phí đang là 2 trang mỗi ngày, nên một
     * hộ miễn phí dùng hết trần cả tháng là khoảng 60 trang — con số đó phải so
     * được ngay với trần hòa vốn ở dòng dưới.
     */
    const gia = b.chiPhiTrungBinhMoiTrang;
    const trangMienPhiThang = TRAN_MIEN_PHI_TRANG_NGAY * 30;
    const bien = bienDongGop(gia, trangMienPhiThang);
    const hoaVon = diemHoaVon(gia, trangMienPhiThang);
    r.push("");
    r.push("6. HỆ QUẢ LÊN LỖ LÃI (cắm chi phí vừa đo vào mô hình)");
    r.push(`  Nếu mọi hộ miễn phí dùng hết trần ${TRAN_MIEN_PHI_TRANG_NGAY} trang/ngày = ${trangMienPhiThang} trang/tháng:`);
    r.push(`    Biên đóng góp mỗi hộ trả phí: ${d(bien)} đ`);
    r.push(`    Điểm hòa vốn: ${hoaVon === null ? "KHÔNG quy mô nào hòa vốn" : `${d(hoaVon)} hộ trả phí`}`);
    r.push(`  Trần để biên còn dương: ${d(tranTrangHoMienPhi(gia))} trang/tháng mỗi hộ miễn phí`);
    r.push(`  Hộ trả phí dùng quá ${d(tranTrangHoTraPhiLo(gia))} trang/tháng là hết sạch doanh thu của chính hộ đó`);
  }

  r.push("");
  r.push("Báo cáo này không tự đặt ngưỡng đạt hay không đạt — ngưỡng do chủ đầu tư đặt (mục 15 của BRD).");
  return r.join("\n");
}
