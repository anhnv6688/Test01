/**
 * In bảng lỗ lãi theo từng mô hình đọc ảnh.
 *
 *   npm run chi-phi                      # dùng giả định mặc định
 *   npm run chi-phi -- --suy-nghi 2500   # thử mức suy nghĩ khác
 *   npm run chi-phi -- --gia-trang 450   # cắm chi phí THẬT đo được vào
 *
 * Khi đã đo được chi phí thật một trang (điều kiện ra mắt số 3), dùng
 * --gia-trang để bỏ qua toàn bộ phần ước lượng token.
 */
import {
  GIA_DINH_BRD, MODEL, THAM_SO_MAC_DINH, bienDongGop, chiPhiMotTrang,
  chiPhiTrungBinhMoiTrang, diemHoaVon, laiLoThang, soHoMienPhiMoiHoTraPhi,
  tranTrangHoMienPhi, tranTrangHoTraPhiLo,
} from "../src/lib/domain/mo-hinh-chi-phi.ts";

function doiSo(ten: string): number | null {
  const i = process.argv.indexOf(`--${ten}`);
  return i !== -1 && process.argv[i + 1] ? Number(process.argv[i + 1]) : null;
}

const suyNghi = doiSo("suy-nghi") ?? THAM_SO_MAC_DINH.tokenSuyNghi;
const giaTrangThat = doiSo("gia-trang");
const tham = { ...THAM_SO_MAC_DINH, tokenSuyNghi: suyNghi };

const d = (n: number) => Math.round(n).toLocaleString("vi-VN");
const hv = (n: number | null) => (n === null ? "không hòa vốn" : d(n));

const tyLeTang2 = doiSo("tang-2") ?? 0.2;

const cot = giaTrangThat !== null
  ? [{ ma: "do-that", ten: "Đo thật", gia: giaTrangThat }]
  : [
      // Cách chia việc đang dùng trong mã nguồn: Haiku phiên âm mọi trang,
      // Opus chỉ soạn giảng ở tầng 2.
      {
        ma: "hai-tang",
        ten: "Haiku + Opus (đang dùng)",
        gia: chiPhiTrungBinhMoiTrang("haiku-4-5", "opus-5", tyLeTang2, tham),
      },
      ...Object.entries(MODEL).map(([ma, m]) => ({
        ma, ten: `${m.ten.replace("Claude ", "")} cho mọi việc`, gia: chiPhiMotTrang(ma, tham),
      })),
    ];

console.log(`\nGiả định: doanh thu ${d(GIA_DINH_BRD.doanhThuMoiHo)}đ/hộ, cố định ` +
  `${d(GIA_DINH_BRD.chiPhiCoDinhThang)}đ/tháng, chuyển đổi ` +
  `${GIA_DINH_BRD.tyLeChuyenDoi * 100}%, hộ trả phí dùng ${GIA_DINH_BRD.trangMoiHoTraPhi} trang/tháng.`);
console.log(`Mỗi hộ trả phí gánh ${soHoMienPhiMoiHoTraPhi().toFixed(1)} hộ miễn phí.`);
if (giaTrangThat === null) {
  console.log(`Ước tính với ${suyNghi} token suy nghĩ mỗi trang, ` +
    `${(tyLeTang2 * 100).toFixed(0)}% số trang phải nhờ mô hình soạn giảng (tầng 2).\n`);
}
else console.log(`Dùng chi phí THẬT đã đo: ${d(giaTrangThat)}đ mỗi trang.\n`);

console.log("=== CHI PHÍ MỘT TRANG ===");
for (const c of cot) console.log(`  ${c.ten.padEnd(26)} ${(d(c.gia) + "đ").padStart(10)}`);

console.log("\n=== NGƯỠNG GÃY ===");
for (const c of cot) {
  console.log(
    `  ${c.ten.padEnd(26)} hộ trả phí lỗ khi vượt ${String(Math.floor(tranTrangHoTraPhiLo(c.gia))).padStart(4)} trang/tháng` +
    ` · hộ miễn phí chỉ được trung bình ${tranTrangHoMienPhi(c.gia).toFixed(1)} trang/tháng`,
  );
}

const mucDung = [0, 1, 2, 4, 6, 12, 30];
console.log("\n=== BIÊN ĐÓNG GÓP MỖI HỘ TRẢ PHÍ (đồng/tháng) ===");
console.log("  theo số trang mỗi hộ MIỄN PHÍ dùng trung bình mỗi tháng");
console.log("  " + "model".padEnd(26) + mucDung.map((p) => String(p).padStart(10)).join(""));
for (const c of cot) {
  console.log("  " + c.ten.padEnd(26) + mucDung.map((p) => {
    const b = bienDongGop(c.gia, p);
    return (b > 0 ? d(b) : "âm").padStart(10);
  }).join(""));
}

console.log("\n=== SỐ HỘ TRẢ PHÍ ĐỂ HÒA VỐN VẬN HÀNH ===");
console.log("  " + "model".padEnd(26) + mucDung.map((p) => String(p).padStart(15)).join(""));
for (const c of cot) {
  console.log("  " + c.ten.padEnd(26) +
    mucDung.map((p) => hv(diemHoaVon(c.gia, p)).padStart(15)).join(""));
}

console.log("\n=== Ở TRẦN GÓI MIỄN PHÍ 2 LƯỢT/NGÀY (tối đa 60 trang/tháng) ===");
console.log("  theo tỷ lệ hộ miễn phí thật sự dùng hết trần\n");
console.log("  " + "tỷ lệ dùng trần".padEnd(20) + cot.map((c) => c.ten.padStart(26)).join(""));
for (const tl of [0.05, 0.1, 0.2, 0.35, 0.5]) {
  const p = 60 * tl;
  console.log("  " + `${(tl * 100).toFixed(0)}% (${p.toFixed(0)} trang)`.padEnd(20) +
    cot.map((c) => hv(diemHoaVon(c.gia, p)).padStart(26)).join(""));
}

if (giaTrangThat === null) {
  console.log("\n=== ĐỘ NHẠY THEO TẦN SUẤT TẦNG 2 ===");
  console.log("  Tầng 2 là lần phải nhờ mô hình soạn giảng. Luồng CHẤM BÀI không bao giờ");
  console.log("  chạm tầng 2, nên tỷ lệ này tính trên TỔNG số trang, không phải trên số đề.\n");
  const soanMotLan =
    chiPhiTrungBinhMoiTrang("haiku-4-5", "opus-5", 1, tham) -
    chiPhiTrungBinhMoiTrang("haiku-4-5", "opus-5", 0, tham);
  console.log(`  Một lần soạn giảng bằng Opus 5 tốn khoảng ${d(soanMotLan)}đ.\n`);
  console.log("  " + "tỷ lệ tầng 2".padEnd(16) + "chi phí/trang".padStart(16) +
    "hòa vốn khi free dùng 2 trang".padStart(32));
  for (const tl of [0, 0.05, 0.1, 0.2, 0.4]) {
    const g = chiPhiTrungBinhMoiTrang("haiku-4-5", "opus-5", tl, tham);
    console.log("  " + `${(tl * 100).toFixed(0)}%`.padEnd(16) +
      (d(g) + "đ").padStart(16) + hv(diemHoaVon(g, 2)).padStart(32));
  }
}

console.log("\n=== Ở QUY MÔ 1.000 HỘ TRẢ PHÍ, HỘ MIỄN PHÍ DÙNG 6 TRANG/THÁNG ===");
for (const c of cot) {
  const kq = laiLoThang(c.gia, 6, 1000);
  console.log(
    `  ${c.ten.padEnd(26)} lãi vận hành ${(d(kq.laiVanHanhThang) + "đ/tháng").padStart(18)}` +
    ` · hoàn vốn nội dung ${kq.soThangHoanVonNoiDung === null ? "không bao giờ" : `${kq.soThangHoanVonNoiDung.toFixed(1)} tháng`}`,
  );
}
console.log();
