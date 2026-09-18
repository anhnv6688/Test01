/**
 * Đấu model: một ảnh, nhiều mô hình, so cạnh nhau.
 *
 *   npm run dau-model -- --anh bo-anh-do/trang-01.jpg \
 *     --claude haiku-4-5,opus-5 \
 *     --tuong-thich qwen=http://127.0.0.1:8000/v1:Qwen/Qwen3-VL-8B-Instruct
 *
 * Gọi song song, vì thứ muốn đo có cả THỜI GIAN phụ huynh phải đứng chờ, và
 * chạy lần lượt thì tổng thời gian không nói lên điều gì về từng bên.
 *
 * Đọc kỹ chú thích đầu src/lib/do-anh/dau-model.ts trước khi tin bảng số này:
 * ở đây KHÔNG có nhãn, nên nó không trả lời được "mô hình nào đọc đúng hơn".
 * Nó chỉ ra chỗ các mô hình cãi nhau, cùng chi phí và thời gian thật.
 */
import { readFileSync, existsSync } from "node:fs";
import { extname } from "node:path";
import { dungGoiGuiDi } from "@/lib/privacy/envelope";
import type { NhaCungCapXuLyAnh } from "@/lib/vision/provider";
import { NhaCungCapGiaLap } from "@/lib/vision/mock";
import { NhaCungCapTuongThichOpenAI, diemCuoiNamTaiCho } from "@/lib/vision/openai-tuong-thich";
import { soSanh, tyLeDongThuan, type KetQuaMotBen } from "@/lib/do-anh/dau-model";
import { chiPhiLanGoiDong } from "@/lib/do-anh/bao-cao";

const A = process.argv.slice(2);
const co = (c: string) => A.includes(c);
const lay = (c: string) => {
  const i = A.indexOf(c);
  return i === -1 ? null : A[i + 1] ?? null;
};

const do_ = (s: string) => console.log(`\x1b[31m  ✗  ${s}\x1b[0m`);
const vang = (s: string) => console.log(`\x1b[33m  !!  ${s}\x1b[0m`);
const xanh = (s: string) => console.log(`\x1b[32m  ok  ${s}\x1b[0m`);

if (co("--giup") || A.length === 0) {
  console.log(`
Đấu model — chạy CÙNG MỘT ảnh qua nhiều mô hình rồi so cạnh nhau.

  --anh <tệp>              ảnh trang vở, ĐÃ CHE dải họ tên (BR-32)
  --viec <loai>            cham-bai-lam (mặc định) hoặc doc-de-bai
  --lop <1|2>              mặc định 2
  --claude <a,b,c>         các mô hình Claude, ví dụ haiku-4-5,opus-5
  --tuong-thich <ten=url:model>   điểm cuối nói giao thức OpenAI; lặp lại được
  --gia-lap                thêm bản giả lập nội bộ làm mốc đối chiếu
  --json                   in JSON thay vì bảng

Ví dụ chạy Qwen tự dựng bằng vLLM tại chỗ:

  vllm serve Qwen/Qwen3-VL-8B-Instruct --port 8000
  npm run dau-model -- --anh bo-anh-do/trang-01.jpg --claude haiku-4-5 \\
    --tuong-thich qwen=http://127.0.0.1:8000/v1:Qwen/Qwen3-VL-8B-Instruct
`);
  process.exit(0);
}

const duongAnh = lay("--anh");
if (!duongAnh || !existsSync(duongAnh)) {
  do_(`Không thấy ảnh: ${duongAnh ?? "(chưa khai --anh)"}`);
  process.exit(1);
}

/*
 * Chốt che ảnh.
 *
 * Lệnh này gửi ảnh tới mô hình, và với điểm cuối ở xa thì ảnh rời khỏi máy.
 * BR-32 nói ảnh vào bo-anh-do/ phải được che dải họ tên TRƯỚC. Ở đây không đọc
 * được chữ để mà kiểm, nên không giả vờ kiểm: chỉ chặn đúng thứ chặn được, là
 * ảnh nằm ngoài thư mục đã có quy ước che, và bắt người chạy nói ra một lần
 * rằng họ biết mình đang làm gì.
 *
 * Không tự động cho qua bằng một biến môi trường: một chốt tự mở được bằng
 * biến môi trường thì sớm muộn có người đặt nó vào tệp cấu hình rồi quên.
 */
const trongBoAnhDo = duongAnh.replace(/\\/g, "/").includes("bo-anh-do/");
if (!trongBoAnhDo && !co("--toi-tu-chiu-trach-nhiem-anh-da-che")) {
  do_(`Ảnh không nằm trong bo-anh-do/ nên chưa chắc đã che dải họ tên.`);
  do_(`Che trước bằng:  npm run che-anh-do -- --tu <thư mục ảnh gốc>`);
  do_(`Hoặc nếu chắc chắn ảnh đã che, chạy lại kèm cờ:`);
  do_(`  --toi-tu-chiu-trach-nhiem-anh-da-che`);
  process.exit(1);
}

const LOAI = (lay("--viec") ?? "cham-bai-lam") as "cham-bai-lam" | "doc-de-bai";
const LOP = (Number(lay("--lop") ?? 2) === 1 ? 1 : 2) as 1 | 2;

const anhBase64 = readFileSync(duongAnh).toString("base64");
const goi = dungGoiGuiDi({ loaiViec: LOAI, lop: LOP, hocKy: 2, anhBase64 });

/*
 * Chất lượng ảnh: khai là ĐẠT cho mọi bên.
 *
 * tienKiemChatLuong() chặn ảnh hỏng trước khi gửi, để đỡ tiền cho phụ huynh.
 * Ở đây thì không: nếu một bên bị chặn tại chỗ còn bên kia được gọi thật thì
 * bảng so sánh có hai cột đo hai thứ khác nhau. Muốn biết ảnh hỏng thì đã có
 * chính các mô hình trả về docDuocAnh = false, và đó cũng là một phép đo.
 */
const CHAT_LUONG = { doSang: 200, doNet: 200, doNghiengDo: 0 };

const cacBen: { ten: string; ncc: NhaCungCapXuLyAnh }[] = [];

for (const m of (lay("--claude") ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
  process.env.OLY_MODEL_DOC_ANH = `claude-${m}`;
  const { NhaCungCapClaude } = await import("@/lib/vision/claude");
  try {
    cacBen.push({ ten: `claude-${m}`, ncc: new NhaCungCapClaude() });
  } catch (e) {
    do_(`claude-${m}: ${(e as Error).message}`);
    process.exit(1);
  }
}

for (const t of A.filter((_, i) => A[i - 1] === "--tuong-thich")) {
  // ten=url:model — tách ở dấu = đầu tiên và dấu : CUỐI, vì url có sẵn dấu :
  const bang = t.indexOf("=");
  const hai = t.lastIndexOf(":");
  if (bang === -1 || hai <= bang) {
    do_(`--tuong-thich sai dạng: ${t}. Đúng dạng: ten=http://host:cong/v1:ten-model`);
    process.exit(1);
  }
  const ten = t.slice(0, bang);
  const diemCuoi = t.slice(bang + 1, hai);
  const model = t.slice(hai + 1);
  try {
    cacBen.push({
      ten,
      ncc: new NhaCungCapTuongThichOpenAI({
        ten, diemCuoi, model, khoa: process.env.OLY_KHOA_TUONG_THICH,
      }),
    });
  } catch (e) {
    do_(`${ten}: ${(e as Error).message}`);
    process.exit(1);
  }
  if (!diemCuoiNamTaiCho(diemCuoi)) {
    vang(`${ten}: điểm cuối ở XA — ảnh sẽ rời khỏi máy này.`);
  } else {
    xanh(`${ten}: điểm cuối tại chỗ — ảnh KHÔNG rời khỏi máy này.`);
  }
}

if (co("--gia-lap")) cacBen.push({ ten: "gia-lap", ncc: new NhaCungCapGiaLap() });

if (cacBen.length < 2) {
  do_("Cần ít nhất hai bên mới so được. Xem --giup.");
  process.exit(1);
}

console.log(`\nẢnh: ${duongAnh}  (${extname(duongAnh)}, ${Math.round(anhBase64.length * 0.75 / 1024)} KB)`);
console.log(`Việc: ${LOAI} · lớp ${LOP} · ${cacBen.length} bên, gọi song song\n`);

const ketQua: KetQuaMotBen[] = await Promise.all(
  cacBen.map(async ({ ten, ncc }): Promise<KetQuaMotBen> => {
    try {
      const kq = await ncc.xuLy(goi, CHAT_LUONG);
      return { ten, ketQua: kq, hong: null, chiPhi: kq.chiPhi ?? null };
    } catch (e) {
      return { ten, ketQua: null, hong: (e as Error).message, chiPhi: null };
    }
  }),
);

if (co("--json")) {
  console.log(JSON.stringify({ anh: duongAnh, ketQua, soSanh: soSanh(ketQua) }, null, 2));
  process.exit(0);
}

console.log("Từng bên:");
for (const k of ketQua) {
  if (k.hong) {
    do_(`${k.ten.padEnd(18)} HỎNG — ${k.hong}`);
    continue;
  }
  const r = k.ketQua!;
  const gio = k.chiPhi ? `${(k.chiPhi.thoiGianMs / 1000).toFixed(1)}s` : "—";
  const tien = k.chiPhi ? chiPhiLanGoiDong(k.chiPhi) : null;
  /*
   * "Không tính theo token" KHÁC "chưa đo được".
   *
   * chiPhiLanGoiDong trả null khi không có bảng giá cho mô hình. Với mô hình
   * tự dựng thì đó không phải thiếu sót: chi phí của nó là tiền máy chia cho
   * số trang, không phải giá token. In "chưa tính được" cạnh một con số tiền
   * của bên kia khiến người đọc tưởng công cụ hỏng rồi bỏ qua cả cột — trong
   * khi cột ấy đang nói đúng một điều quan trọng.
   */
  const dong = tien !== null
    ? `${Math.round(tien).toLocaleString("vi-VN")}đ`
    : k.chiPhi
      ? `${k.chiPhi.tokenVaoMoi}+${k.chiPhi.tokenRa} token (không có bảng giá — tự dựng thì tính theo tiền máy, xem npm run chi-phi)`
      : "chưa đo được";
  if (!r.ok) {
    vang(`${k.ten.padEnd(18)} từ chối ảnh: ${r.loi.ma}  ·  ${gio}  ·  ${dong}`);
    continue;
  }
  const soBai = r.ketQua.loai === "cham-bai-lam" ? r.ketQua.cacBai.length : 1;
  xanh(`${k.ten.padEnd(18)} đọc được ${soBai} bài  ·  ${gio}  ·  ${dong}`);
}

const bc = soSanh(ketQua);
const ty = tyLeDongThuan(bc);
console.log(`\nSo cạnh nhau:`);
if (bc.soOSoDuoc === 0) {
  vang("Không đủ hai bên cùng đọc được ảnh này nên chưa so được ô nào.");
} else {
  console.log(`  ${bc.soODongThuan}/${bc.soOSoDuoc} ô mọi bên nói giống nhau` +
    (ty === null ? "" : ` (${(ty * 100).toFixed(0)}%)`));
  if (bc.lechSoBai) {
    vang(`Các bên đọc ra SỐ BÀI khác nhau (nhiều nhất ${bc.soBaiNhieuNhat}). ` +
      "Lệch số bài nặng hơn lệch một con số: một bên đang bỏ sót hoặc tách nhầm bài.");
  }
  if (bc.batDong.length === 0) {
    console.log("  Không ô nào bất đồng.");
  } else {
    console.log(`\n  ${bc.batDong.length} ô bất đồng — đây là danh sách đáng đem đi gắn nhãn trước:`);
    for (const b of bc.batDong) {
      const ai = Object.entries(b.theoBen).map(([t, v]) => `${t}=${v}`).join("  |  ");
      console.log(`    bài ${b.viTri} · ${b.truong.padEnd(12)} ${ai}`);
    }
  }
}

console.log(`
LƯU Ý: bảng này KHÔNG nói mô hình nào đọc đúng hơn — ở đây không có nhãn.
Ba mô hình cùng đọc "65" thì chỉ biết chúng cùng đọc "65"; trên giấy có thể là
55, và chúng dễ sai giống nhau ở đúng những nét chữ khó nhất. Muốn biết bên nào
đúng hơn thì gắn nhãn rồi chạy \`npm run do-anh\`.
`);
