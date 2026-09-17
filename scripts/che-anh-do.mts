/**
 * Che dải họ tên rồi chép ảnh vào bo-anh-do/ — chạy TRÊN MÁY NGƯỜI GẮN NHÃN.
 *
 *   npm run che-anh-do -- --tu ~/Downloads/anh-vo
 *   npm run che-anh-do -- --tu ~/Downloads/xoay-ngang --canh trai
 *   npm run che-anh-do -- --tu ./anh --day 0.22
 *
 * Ảnh gốc KHÔNG bị đụng tới. Lệnh này chỉ đọc chúng và ghi bản đã che sang
 * bo-anh-do/ — nên thư mục gốc nên nằm NGOÀI kho mã, và bản đã che là thứ duy
 * nhất đi tiếp. Quy ước của kho mã nói "che TRƯỚC KHI đưa vào thư mục", và đây
 * đúng là cái "trước khi" đó, làm bằng máy thay vì bằng tay.
 *
 * Ảnh không rời khỏi máy này. Cả lệnh này lẫn trang /gan-nhan đều chạy tại chỗ;
 * chỉ tới lúc `npm run do-anh` mới có thứ gì đi ra mạng, và lúc đó ảnh đã che.
 *
 * Dùng trình duyệt thật để vẽ, không dùng thư viện ảnh, vì hai lý do. Một: đó
 * đúng là cách luồng phụ huynh che — cùng canvas, cùng phép tô đè, cùng phép mã
 * hóa JPEG — nên thứ bộ đo đo được là thứ mô hình thật sự nhìn thấy. Hai: vẽ
 * qua canvas rũ bỏ luôn siêu dữ liệu EXIF, trong đó có tọa độ nơi chụp.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  MOI_CANH_CHE, TY_LE_CHE_MAC_DINH, giaiMaDuocKhong, laAnhVaoDuoc,
  quyetDinhChe, tenTepRa, type CanhChe,
} from "../src/lib/do-anh/che-truoc-khi-vao";

function doiSo(ten: string): string | null {
  const i = process.argv.indexOf(`--${ten}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

/**
 * Đường dẫn trình duyệt — cùng quy ước với kiem-giao-dien.mts.
 *
 * Máy dựng sẵn của môi trường phát triển có Chromium ở một chỗ cố định, còn
 * bản Playwright cài theo dự án lại đi tìm một số hiệu bản khác. Đặt
 * OLY_CHROME="" để bỏ qua và dùng bản Playwright tự tải.
 */
const CHROME = process.env.OLY_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const xanh = (s: string) => console.log(`  ok   ${s}`);
const vang = (s: string) => console.log(`  !!   ${s}`);
const do_ = (s: string) => console.log(` BỎ QUA ${s}`);

const DUOI_MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
};

async function main() {
  const tu = doiSo("tu");
  if (!tu) {
    console.error(
      "Thiếu --tu <thư-mục-ảnh-gốc>.\n\n" +
        "  npm run che-anh-do -- --tu ~/Downloads/anh-vo\n\n" +
        "Thư mục gốc nên nằm NGOÀI kho mã. Lệnh này không sửa gì trong đó; nó ghi\n" +
        "bản đã che sang bo-anh-do/, và bản đã che là thứ duy nhất đi tiếp.",
    );
    process.exit(2);
  }

  const canhKhai = doiSo("canh") as CanhChe | null;
  if (canhKhai && !MOI_CANH_CHE.includes(canhKhai)) {
    console.error(`--canh phải là một trong: ${MOI_CANH_CHE.join(", ")}`);
    process.exit(2);
  }
  const day = doiSo("day") ? Number(doiSo("day")) : TY_LE_CHE_MAC_DINH;
  if (!Number.isFinite(day) || day <= 0 || day >= 1) {
    console.error("--day phải là một số trong khoảng (0, 1), ví dụ 0.16");
    process.exit(2);
  }

  const thuMucVao = path.resolve(tu);
  const thuMucRa = path.resolve(process.env.OLY_THU_MUC_ANH ?? "bo-anh-do");
  await mkdir(thuMucRa, { recursive: true });

  const tep = (await readdir(thuMucVao)).filter(laAnhVaoDuoc).sort();
  if (tep.length === 0) {
    console.error(`Không thấy ảnh nào trong ${thuMucVao}`);
    process.exit(1);
  }

  console.log(`Che ${tep.length} ảnh từ ${thuMucVao}`);
  console.log(`Dải che: cạnh ${canhKhai ?? "trên (mặc định)"}, dày ${Math.round(day * 100)}% cạnh`);
  console.log(`Ghi sang: ${thuMucRa}\n`);

  const trinhDuyet = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
  const trang = await (await trinhDuyet.newContext()).newPage();
  await trang.setContent("<!doctype html><title>che</title>");

  const daChe: string[] = [];
  const bo: string[] = [];

  for (const ten of tep) {
    if (!giaiMaDuocKhong(ten)) {
      do_(`${ten} — Chromium không giải mã được HEIC/HEIF. Xuất lại thành JPEG rồi chạy lại.`);
      bo.push(ten);
      continue;
    }
    const duoi = path.extname(ten).toLowerCase();
    const mime = DUOI_MIME[duoi] ?? "image/jpeg";
    const b64 = (await readFile(path.join(thuMucVao, ten))).toString("base64");

    // Đo trước, che sau. Phải biết ảnh dọc hay ngang mới quyết được che cạnh
    // nào, mà quyết định ấy nằm ở mã thuần (che-truoc-khi-vao.ts) để bài kiểm
    // thử chạy được không cần trình duyệt lẫn ảnh thật.
    const nguon = `data:${mime};base64,${b64}`;
    const co = await trang.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      try {
        await img.decode();
      } catch {
        return null;
      }
      return { rong: img.naturalWidth, cao: img.naturalHeight };
    }, nguon);

    if (!co) {
      do_(`${ten} — trình duyệt không giải mã được tệp này`);
      bo.push(ten);
      continue;
    }

    const qd = quyetDinhChe({ ten, rong: co.rong, cao: co.cao }, canhKhai, day);
    if (!qd.che) {
      do_(`${ten} — ${qd.lyDo}`);
      bo.push(ten);
      continue;
    }

    const veXong = await trang.evaluate(
      async ({ src, vung }) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        // Tô ĐÈ, không phủ một lớp hình bên trên: sau dòng này pixel gốc của
        // vùng đó không còn trong bộ nhớ canvas, nên không có đường lấy lại.
        ctx.fillStyle = "#000";
        ctx.fillRect(
          Math.round(vung.x * canvas.width), Math.round(vung.y * canvas.height),
          Math.round(vung.w * canvas.width), Math.round(vung.h * canvas.height),
        );
        // Chỉ chuỗi này ra khỏi trình duyệt, và nó đọc từ canvas ĐÃ tô đè.
        return canvas.toDataURL("image/jpeg", 0.92);
      },
      { src: nguon, vung: qd.vung },
    );

    const raTen = tenTepRa(ten);
    await writeFile(
      path.join(thuMucRa, raTen),
      Buffer.from(veXong.split(",")[1], "base64"),
    );
    daChe.push(raTen);
    xanh(`${ten} → ${raTen} (che cạnh ${qd.canh}, ${co.rong}×${co.cao})`);
  }

  await trinhDuyet.close();

  //
  // Trang xem lại. KHÔNG bỏ bước này, và cũng đừng biến nó thành một dòng "đạt".
  //
  // Phép che ở trên tô đè một dải ở đúng chỗ dải họ tên THƯỜNG nằm. "Thường"
  // không phải "luôn": trang vở có ngày tháng ở lề, có tên viết chen vào giữa,
  // có ảnh chụp lệch làm dải tên tụt xuống dưới vạch 16%. Không có phép đo tự
  // động nào ở đây đọc được chữ để mà chắc — mà nếu có thì chính nó đã đọc tên
  // trẻ rồi.
  //
  // Nên thứ duy nhất chốt được là một đôi mắt, một lần, trên một trang. Ít hơn
  // hẳn việc che tay từng ảnh, và đó là chỗ đổi được thời gian lấy sự chắc chắn.
  //
  if (daChe.length > 0) {
    const html =
      "<!doctype html><meta charset=utf-8><title>Xem lại phần đã che</title>" +
      "<style>body{font:16px/1.5 system-ui;margin:24px;background:#111;color:#eee}" +
      "h1{font-size:20px}p{max-width:60ch}figure{margin:0 0 24px}img{max-width:100%;border:1px solid #444}" +
      "figcaption{color:#aaa;font-size:14px;padding:4px 0}</style>" +
      "<h1>Xem lại phần đã che</h1>" +
      "<p>Nhìn từng ảnh một lần: dải đen đã phủ hết họ tên, lớp, trường chưa? " +
      "Ảnh nào còn sót thì <b>xóa khỏi bo-anh-do/</b> rồi chạy lại riêng nó với " +
      "<code>--canh</code> hoặc <code>--day</code> lớn hơn. Còn sót một chữ tên là " +
      "hỏng cả lô, vì thư mục này còn được trang gắn nhãn đọc và bộ đo gửi đi.</p>" +
      daChe
        .map((t) => `<figure><img src="./${encodeURIComponent(t)}" loading="lazy"><figcaption>${t}</figcaption></figure>`)
        .join("\n");
    await writeFile(path.join(thuMucRa, "xem-lai-che.html"), html, "utf8");
  }

  console.log(`\nĐã che ${daChe.length}/${tep.length} ảnh.`);
  if (bo.length > 0) vang(`${bo.length} ảnh bị bỏ qua — xem lý do ở trên. Chúng KHÔNG nằm trong bo-anh-do/.`);
  if (daChe.length > 0) {
    console.log(`\nMở trang này rồi nhìn qua một lượt trước khi đi tiếp:`);
    console.log(`  ${path.join(thuMucRa, "xem-lai-che.html")}`);
    console.log(`\nRồi gắn nhãn:  npm run dev   →   http://localhost:3000/gan-nhan`);
  }
  if (daChe.length === 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
