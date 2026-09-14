/**
 * In báo cáo độ phủ kho nội dung.
 *
 *   npm run kho
 *
 * Dùng để trả lời điều kiện ra mắt số 4 bằng số đo, chứ không bằng cảm giác.
 */
import { TEMPLATES } from "../src/lib/domain/templates";
import { YCCD } from "../src/lib/domain/curriculum";
import {
  NGUONG_BIEN_THE_TOI_THIEU, SO_BAI_BON_TUAN, demBienThe, doKhoNoiDung,
} from "../src/lib/domain/do-kho-noi-dung";

const d = (n: number) => n.toLocaleString("vi-VN");
const bc = doKhoNoiDung();

console.log(`\n=== KHO KHUÔN DẠNG ===`);
console.log(`  ${bc.soKhuonDang} khuôn dạng, phủ ${bc.soYccdDuocPhu} / ${YCCD.length} yêu cầu cần đạt\n`);

const theoYccd = new Map<string, string[]>();
for (const t of TEMPLATES) {
  theoYccd.set(t.yccd, [...(theoYccd.get(t.yccd) ?? []), t.id]);
}
for (const y of YCCD) {
  const ds = theoYccd.get(y.code) ?? [];
  const co = ds.length > 0 ? `${ds.length} khuôn dạng` : "CHƯA CÓ";
  console.log(`  ${y.code.padEnd(11)} ${co.padEnd(15)} ${y.statement.slice(0, 52)}`);
}

console.log(`\n=== KHÔNG GIAN THAM SỐ TỪNG KHUÔN DẠNG ===`);
console.log(`  Số đề khác nhau đếm được trong 1500 lần sinh thử.`);
console.log(`  Ngưỡng an toàn tối thiểu: ${NGUONG_BIEN_THE_TOI_THIEU}\n`);
for (const t of TEMPLATES) {
  const { khacNhau, daBaoHoa } = demBienThe(t, 1500);
  const co = khacNhau < NGUONG_BIEN_THE_TOI_THIEU
    ? (t.ghiChuKhongGian ? "  ← nhỏ, có chủ đích" : "  ← QUÁ BÉ")
    : "";
  const ghi = daBaoHoa ? d(khacNhau) : `hơn ${d(khacNhau)}`;
  console.log(`  ${t.id}  ${ghi.padStart(11)}   ${t.title.slice(0, 42)}${co}`);
}

console.log(`\n=== BỐN TUẦN HỌC LIÊN TỤC (điều kiện ra mắt số 4) ===`);
console.log(`  ${SO_BAI_BON_TUAN} bài trong 20 buổi:`);
console.log(`    đề khác nhau      ${d(bc.deKhacNhauBonTuan)}`);
console.log(`    đề bị lặp lại     ${d(bc.soDeTrungBonTuan)}`);
console.log(`    mỗi DẠNG bài lặp  ${bc.lanLapMoiDang.toFixed(1)} lần`);
if (bc.khuonDangQuaBe.length > 0) {
  console.log(`\n  CẦN MỞ RỘNG THAM SỐ:`);
  for (const k of bc.khuonDangQuaBe) console.log(`    ${k.id} — chỉ ${k.bienThe} đề — ${k.title}`);
} else {
  console.log(`\n  Không khuôn dạng nào có không gian tham số quá bé.`);
}
if (bc.khuonDangNhoCoLyDo.length > 0) {
  console.log(`\n  Nhỏ nhưng có chủ đích, đã ghi rõ lý do:`);
  for (const k of bc.khuonDangNhoCoLyDo) {
    console.log(`    ${k.id} — ${k.bienThe} đề — ${k.title}`);
    console.log(`      ${k.lyDo}`);
  }
}
console.log();
