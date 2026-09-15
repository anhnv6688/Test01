/**
 * Kiểm một bản ĐÃ TRIỂN KHAI, qua mạng, đúng như người ngoài nhìn vào.
 *
 *   npm run kiem-moi-truong -- --goc https://oly.vn --cho that
 *   npm run kiem-moi-truong -- --goc https://thu.oly.vn --cho thu
 *
 * Vì sao cần bộ kiểm này dù đã có cau-hinh-phat-hanh.test.ts: bài kiểm thử kia
 * chứng minh HÀM trả về đúng, nhưng nó chạy trong Node trên máy người viết mã.
 * Nó không biết gì về việc máy chủ ngoài kia được khởi động với biến môi trường
 * nào. Một bản triển khai quên đặt OLY_MA_TRUC, hoặc lỡ bật OLY_DU_LIEU_MAU
 * trên bản thật, sẽ qua sạch mọi bài kiểm thử rồi mở toang cửa trên mạng.
 *
 * Nguyên tắc: bộ kiểm này TỰ TẤN CÔNG máy chủ của chính mình bằng đúng những
 * mã mặc định mà kho mã từng dùng. Nói "chúng tôi đã tắt PIN 1234" thì nhẹ hơn
 * hẳn so với "chúng tôi đã thử đăng nhập bằng 1234 vào máy thật và bị từ chối".
 */
import { chromium, type Browser, type Page } from "playwright";
import { MA_TRUC_MAC_DINH } from "../src/lib/server/moi-truong";

const CHROME = process.env.OLY_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
/** Mã PIN mà bản phát triển dùng. Trên bản thật, mã này PHẢI bị từ chối. */
const PIN_PHAT_TRIEN = "1234";

function doiSo(ten: string): string | null {
  const i = process.argv.indexOf(`--${ten}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const loi: string[] = [];
const canhBao: string[] = [];

function doi(dieu: string, dung: boolean): void {
  console.log(dung ? `  ok   ${dieu}` : `  HỎNG ${dieu}`);
  if (!dung) loi.push(dieu);
}
function nhac(dieu: string, dung: boolean): void {
  console.log(dung ? `  ok   ${dieu}` : `  nhắc ${dieu}`);
  if (!dung) canhBao.push(dieu);
}

/* ------------------------------------------------------------------ */

/** Đang soi chính máy mình, không phải một bản đã triển khai. */
function laTaiCho(goc: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(goc);
}

async function kiemDuongTruyen(goc: string): Promise<void> {
  console.log("\nĐường truyền");
  if (laTaiCho(goc)) {
    // Máy tại chỗ không có chứng chỉ, nên đòi HTTPS ở đây là đòi một điều không
    // làm được. Nhắc để người chạy nhớ rằng bản trên mạng thì phải có.
    nhac("đang soi máy tại chỗ nên bỏ qua phần HTTPS — bản trên mạng BẮT BUỘC phải có", true);
    return;
  }
  if (!goc.startsWith("https://")) {
    doi("dùng HTTPS — mã PIN, mã một lần và ảnh trang vở đều đi qua đường này", false);
    return;
  }
  doi("dùng HTTPS", true);

  const r = await fetch(goc, { redirect: "manual" });
  const hsts = r.headers.get("strict-transport-security");
  nhac(
    `có Strict-Transport-Security để trình duyệt không thử HTTP lần sau${hsts ? ` (${hsts})` : ""}`,
    Boolean(hsts),
  );

  // Thử bản HTTP: phải chuyển hướng sang HTTPS, không được phục vụ thẳng.
  try {
    const http = await fetch(goc.replace("https://", "http://"), { redirect: "manual" });
    const den = http.headers.get("location") ?? "";
    doi(
      `vào bằng HTTP thì bị đẩy sang HTTPS (nhận ${http.status}${den ? ` → ${den}` : ""})`,
      http.status >= 300 && http.status < 400 && den.startsWith("https://"),
    );
  } catch {
    doi("vào bằng HTTP thì không phục vụ (cổng đóng)", true);
  }
}

async function kiemRobots(goc: string, cho: string): Promise<void> {
  console.log("\nMáy tìm kiếm");
  const r = await fetch(`${goc}/robots.txt`);
  const chu = await r.text();
  if (!r.ok) {
    doi("có robots.txt", false);
    return;
  }
  if (cho === "thu") {
    doi(
      "bản thử chặn toàn bộ máy quét — trang thử không được nằm trên máy tìm kiếm",
      /^\s*Disallow:\s*\/\s*$/m.test(chu),
    );
    return;
  }
  for (const duong of ["/be", "/phu-huynh", "/truc", "/api"]) {
    doi(`chặn máy quét vào ${duong}`, chu.includes(`Disallow: ${duong}`));
  }
}

/**
 * Thử đúng những mã mặc định của bản phát triển, vào chính máy chủ này.
 *
 * Dùng trình duyệt thật chứ không gửi biểu mẫu bằng tay, vì hai cổng đều là
 * hành động máy chủ của Next — gọi thẳng bằng HTTP sẽ cần bắt chước phần mã hóa
 * riêng của nó, mà bắt chước sai thì bộ kiểm báo "không vào được" trong khi
 * thật ra nó chưa thử gì cả. Đó là kiểu sai nguy hiểm nhất với một bộ kiểm an
 * ninh: nó luôn xanh.
 */
async function thuMaMacDinh(b: Browser, goc: string, cho: string): Promise<void> {
  console.log("\nThử mã mặc định của bản phát triển vào chính máy chủ này");
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p: Page = await ctx.newPage();

  // --- Cổng phụ huynh
  await p.goto(`${goc}/phu-huynh`, { waitUntil: "networkidle" });
  const oPin = p.locator('input[name="pin"]');
  if (await oPin.count()) {
    await oPin.fill(PIN_PHAT_TRIEN);
    await p.locator('button[type="submit"]').first().click();
    await p.waitForLoadState("networkidle");
    await p.waitForTimeout(400);
    const vaoDuoc = (await p.locator('input[name="pin"]').count()) === 0;
    if (cho === "that") {
      doi(`PIN ${PIN_PHAT_TRIEN} KHÔNG mở được phần của bố mẹ`, !vaoDuoc);
    } else {
      nhac(`PIN ${PIN_PHAT_TRIEN} vẫn mở được (chấp nhận được ở bản thử)`, true);
    }
  } else {
    nhac("không tìm thấy ô nhập mã PIN để thử", false);
  }

  // --- Cổng trực
  const p2 = await ctx.newPage();
  await p2.goto(`${goc}/truc`, { waitUntil: "networkidle" });
  const oMa = p2.locator('input[name="ma"]');
  if (await oMa.count()) {
    const oTen = p2.locator('input[name="nguoiTruc"]');
    if (await oTen.count()) await oTen.fill("bộ kiểm môi trường");
    await oMa.fill(MA_TRUC_MAC_DINH);
    await p2.locator('button[type="submit"]').first().click();
    await p2.waitForLoadState("networkidle");
    await p2.waitForTimeout(400);
    const vaoDuoc = (await p2.locator('input[name="ma"]').count()) === 0;
    doi(
      `mã trực "${MA_TRUC_MAC_DINH}" KHÔNG mở được bảng trực — nơi xuất và xóa dữ liệu các hộ`,
      !vaoDuoc,
    );
  } else {
    nhac("không tìm thấy ô nhập mã trực để thử", false);
  }

  await ctx.close();
}

async function kiemLoRi(goc: string): Promise<void> {
  console.log("\nRò rỉ thông tin ra ngoài");
  const r = await fetch(goc);
  for (const h of ["x-powered-by", "server"]) {
    const v = r.headers.get(h);
    nhac(`không khoe phần mềm máy chủ ở tiêu đề ${h}${v ? ` (đang là "${v}")` : ""}`, !v);
  }
}

/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const goc = (doiSo("goc") ?? "").replace(/\/+$/, "");
  const cho = doiSo("cho") ?? "that";
  if (!goc) {
    console.error("Thiếu --goc. Ví dụ: npm run kiem-moi-truong -- --goc https://oly.vn --cho that");
    process.exit(2);
  }
  if (cho !== "thu" && cho !== "that") {
    console.error(`--cho phải là "thu" hoặc "that", nhận được "${cho}"`);
    process.exit(2);
  }
  console.log(`Kiểm ${goc}, khai là bản ${cho === "that" ? "THẬT" : "THỬ"}`);

  const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
  try {
    await kiemDuongTruyen(goc);
    await kiemRobots(goc, cho);
    await thuMaMacDinh(b, goc, cho);
    await kiemLoRi(goc);
  } catch (e) {
    doi(`chạy hết được bộ kiểm (${e instanceof Error ? e.message.split("\n")[0] : e})`, false);
  } finally {
    await b.close();
  }

  console.log("");
  if (canhBao.length) {
    console.log(`${canhBao.length} điều nên xem lại (không chặn):`);
    for (const c of canhBao) console.log(`  - ${c}`);
    console.log("");
  }
  if (loi.length) {
    console.log(`${loi.length} điều KHÔNG ĐẠT:`);
    for (const l of loi) console.log(`  - ${l}`);
    console.log("\nĐừng mở cho người dùng vào trước khi sửa xong.");
    process.exit(1);
  }
  console.log("Môi trường đạt.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
