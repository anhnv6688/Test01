/**
 * Kiểm một bản ĐÃ TRIỂN KHAI, qua mạng, đúng như người ngoài nhìn vào.
 *
 *   npm run kiem-moi-truong -- --goc https://oly.vn --cho that
 *   npm run kiem-moi-truong -- --goc https://thu.oly.vn --cho thu
 *   npm run kiem-moi-truong -- --goc https://109.123.233.46 --cho thu --chung-chi-tu-ky
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
 *
 * Cách đọc kết quả cũng đáng nói. Bộ kiểm KHÔNG nhìn xem giao diện có đổi hay
 * không, mà nhìn xem MÁY CHỦ CÓ PHÁT COOKIE PHIÊN hay không. Hai lý do:
 *
 *   Cookie phiên ở bản phát hành có cờ secure, nên khi soi qua HTTP thường thì
 *   trình duyệt vứt nó đi — giao diện không đổi, và bộ kiểm sẽ tưởng mã bị từ
 *   chối trong khi máy chủ vừa chấp nhận nó. Xanh, vì một lý do sai.
 *
 *   Máy chủ chỉ phát cookie phiên khi mã ĐÚNG. Nên sự có mặt của nó là bằng
 *   chứng trực tiếp rằng mã mặc định vẫn mở được, không phụ thuộc vào việc
 *   trình duyệt có giữ cookie hay giao diện kịp vẽ lại hay chưa.
 */
import { chromium, type Browser, type Page } from "playwright";
import { batHangRaoChoFetch, thongTinHangRao } from "./hang-rao";
import { MA_TRUC_MAC_DINH } from "../src/lib/server/moi-truong";
import { TEN_COOKIE as COOKIE_PHU_HUYNH } from "../src/lib/server/cong-phu-huynh";
import { TEN_COOKIE_TRUC } from "../src/lib/server/cong-truc";

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

/**
 * Chấp nhận chứng chỉ tự ký, và đây là một quyết định phải khai ra.
 *
 * Máy chưa có tên miền thì chỉ có chứng chỉ tự ký, nên fetch và trình duyệt đều
 * từ chối và bộ soi không soi được gì. Nhưng tắt kiểm chứng chỉ là BỎ phần xác
 * thực danh tính máy chủ — sau đó "đã soi xong" chỉ còn nghĩa là đã soi một máy
 * nào đó trả lời ở địa chỉ ấy.
 *
 * Vì vậy nó là một cờ phải gõ ra, không phải một suy đoán. Và mỗi lần bật, bộ
 * soi nói to rằng phần xác thực đã bị bỏ — để dòng "đạt" ở cuối không bị đọc
 * thành một lời bảo đảm rộng hơn thứ nó thật sự kiểm.
 */
const CHO_TU_KY = process.argv.includes("--chung-chi-tu-ky");

/*
 * Phải đặt NODE_TLS_REJECT_UNAUTHORIZED từ BÊN NGOÀI, không đặt được ở đây.
 *
 * Bản đầu gán process.env ngay tại chỗ này. Không ăn: trong ESM, mọi `import`
 * chạy TRƯỚC mọi câu lệnh, mà playwright kéo theo `tls` — nên tới lượt dòng gán
 * này thì `tls` đã đọc xong biến cũ. Triệu chứng là một dòng "fetch failed"
 * trống rỗng, trong khi cờ thì trông như đã bật.
 *
 * Nên chỗ gọi phải đặt biến môi trường thật. Nếu quên, nói ra ngay — một cờ
 * trông như có tác dụng mà không có tác dụng thì tệ hơn là không có cờ.
 */
if (CHO_TU_KY && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0") {
  console.error(
    "Có --chung-chi-tu-ky nhưng chưa đặt NODE_TLS_REJECT_UNAUTHORIZED=0.\n" +
      "Node đọc biến đó lúc nạp mô-đun tls, nên đặt trong mã là muộn. Chạy lại:\n" +
      "  NODE_TLS_REJECT_UNAUTHORIZED=0 npm run kiem-moi-truong -- --goc <địa-chỉ> --cho thu --chung-chi-tu-ky",
  );
  process.exit(2);
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
  if (CHO_TU_KY) {
    nhac(
      "CHỨNG CHỈ KHÔNG ĐƯỢC KIỂM (--chung-chi-tu-ky). Đường truyền có mã hóa nhưng " +
        "KHÔNG chứng minh được máy bên kia là ai. Chỉ chấp nhận được ở bản thử chưa " +
        "có tên miền; bản có phụ huynh thật vào thì phải có chứng chỉ thật.",
      false,
    );
  }

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
/** Rình xem máy chủ có phát cookie phiên nào mang tên này không. */
function rinhCookie(p: Page, ten: string): { daPhat: () => boolean } {
  let thay = false;
  p.on("response", (r) => {
    for (const [k, v] of Object.entries(r.headers())) {
      if (k.toLowerCase() === "set-cookie" && v.includes(`${ten}=`) && !v.includes(`${ten}=;`)) {
        thay = true;
      }
    }
  });
  return { daPhat: () => thay };
}

async function thuMaMacDinh(b: Browser, goc: string, cho: string): Promise<void> {
  console.log("\nThử mã mặc định của bản phát triển vào chính máy chủ này");
  const ctx = await b.newContext({
    httpCredentials: thongTinHangRao(),
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: CHO_TU_KY,
  });
  const p: Page = await ctx.newPage();

  // --- Cổng phụ huynh
  await p.goto(`${goc}/phu-huynh`, { waitUntil: "networkidle" });
  const oPin = p.locator('input[name="pin"]');
  const rinhPh = rinhCookie(p, COOKIE_PHU_HUYNH);
  if (await oPin.count()) {
    await oPin.fill(PIN_PHAT_TRIEN);
    await p.locator('button[type="submit"]').first().click();
    /*
     * Chờ ĐỦ LÂU rồi mới kết luận là không vào được.
     *
     * Bản đầu chỉ chờ networkidle rồi xem ô nhập mã còn không. Với một máy chủ
     * chậm hoặc ở xa, ô nhập vẫn còn đó đơn giản vì trang chưa kịp đổi — và bộ
     * kiểm sẽ kết luận "mã mặc định bị từ chối" trong khi thật ra nó chưa chờ
     * xong. Đó đúng là kiểu hỏng nguy hiểm nhất của một bộ kiểm an ninh: nó
     * xanh, và nó xanh vì lý do sai.
     *
     * Nên chờ hẳn cho tới khi ô nhập BIẾN MẤT, và chỉ khi hết thời gian chờ mới
     * kết luận là vào không được.
     */
    await p.locator('input[name="pin"]').waitFor({ state: "detached", timeout: 10_000 })
      .catch(() => { /* hết giờ: coi như không vào được, kiểm lại ngay dưới */ });
    const vaoDuoc = rinhPh.daPhat() || (await p.locator('input[name="pin"]').count()) === 0;
    if (cho === "that") {
      doi(`PIN ${PIN_PHAT_TRIEN} KHÔNG mở được phần của bố mẹ`, !vaoDuoc);
    } else {
      /*
       * Ở bản thử, PIN mặc định mở được hay không đều chấp nhận được — nên đây
       * là một dòng BÁO CÁO, không phải một phép kiểm.
       *
       * Nhưng nó phải báo cáo thứ VỪA XẢY RA. Bản đầu gọi nhac(..., true): một
       * hằng số, không đọc `vaoDuoc` lấy một lần. Nên nó in
       *
       *   ok   PIN 1234 vẫn mở được (chấp nhận được ở bản thử)
       *
       * kể cả khi máy chủ vừa từ chối 1234 — và nó in đúng như thế trong khi
       * trên máy thật không ai vào nổi phần của bố mẹ. Người đọc bản in ấy tin
       * rằng cổng phụ huynh đã được thử và đang chạy.
       *
       * Một dòng "ok" không đọc kết quả nào thì tệ hơn hẳn không có dòng nào:
       * nó biến một chỗ chưa được kiểm thành một chỗ tưởng đã kiểm.
       */
      nhac(
        vaoDuoc
          ? `PIN ${PIN_PHAT_TRIEN} vẫn mở được (chấp nhận được ở bản thử)`
          : `PIN ${PIN_PHAT_TRIEN} KHÔNG mở được — hộ mẫu đang dùng mã khác, xem OLY_PIN_MAU trong ~/o-ly/.env`,
        vaoDuoc,
      );
    }
  } else {
    nhac("không tìm thấy ô nhập mã PIN để thử", false);
  }

  // --- Cổng trực
  const p2 = await ctx.newPage();
  await p2.goto(`${goc}/truc`, { waitUntil: "networkidle" });
  const oMa = p2.locator('input[name="ma"]');
  const rinhTruc = rinhCookie(p2, TEN_COOKIE_TRUC);
  if (await oMa.count()) {
    const oTen = p2.locator('input[name="nguoiTruc"]');
    if (await oTen.count()) await oTen.fill("bộ kiểm môi trường");
    await oMa.fill(MA_TRUC_MAC_DINH);
    await p2.locator('button[type="submit"]').first().click();
    // Chờ đủ lâu, cùng lý do như ở cổng phụ huynh phía trên.
    await p2.locator('input[name="ma"]').waitFor({ state: "detached", timeout: 10_000 })
      .catch(() => { /* hết giờ: coi như không vào được */ });
    const vaoDuoc = rinhTruc.daPhat() || (await p2.locator('input[name="ma"]').count()) === 0;
    doi(
      `mã trực "${MA_TRUC_MAC_DINH}" KHÔNG mở được bảng trực — nơi xuất và xóa dữ liệu các hộ`,
      !vaoDuoc,
    );
  } else {
    nhac("không tìm thấy ô nhập mã trực để thử", false);
  }

  await ctx.close();
}

/**
 * Bản thử phải TỰ NÓI RA rằng nó là bản thử.
 *
 * Kiểm ở đây chứ không kiểm bằng vitest, vì thứ đáng hỏng nằm ngoài tầm của
 * vitest: cùng MỘT ảnh Docker chạy cả hai môi trường, nên dải báo phải đọc
 * biến môi trường LÚC CHẠY. Thiếu `connection()` ở
 * src/components/DaiBaoBanThu.tsx thì Next dựng sẵn trang lúc build — lúc đó
 * OLY_MOI_TRUONG chưa có, `moiTruong()` trả "that", và dải báo bị nướng cứng
 * thành "không hiện". Bản thử khi ấy im lặng đúng như bản thật, không lỗi nào,
 * và người test nội bộ không biết mình đang ở đâu.
 *
 * Chiều ngược lại cũng phải canh: bản thật mà hiện dải "BẢN THỬ" thì phụ huynh
 * thật đọc được dòng "dữ liệu có thể bị xóa bất cứ lúc nào".
 */
async function kiemDaiBaoBanThu(goc: string, cho: string): Promise<void> {
  console.log("\nDải báo bản thử");
  const chu = await (await fetch(goc)).text();
  const co = chu.includes("BẢN THỬ");
  if (cho === "thu") {
    doi("bản thử tự nói ra rằng nó là bản thử, ngay trên trang", co);
    doi(
      "dải báo nói rõ ảnh chụp có bị gửi ra ngoài hay không",
      chu.includes("ĐƯỢC GỬI RA") || chu.includes("không đi đâu cả"),
    );
    doi("dải báo dặn đừng chụp bài thật của con", chu.includes("đừng chụp bài thật"));
  } else {
    doi("bản thật KHÔNG hiện dải báo bản thử", !co);
  }
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
  // Nói ra là đã đi qua hàng rào. Không nói thì một dòng "đạt" ở cuối có thể là
  // của một máy chủ mở toang — người đọc cần biết bộ soi đã phải gõ mã mới vào.
  if (batHangRaoChoFetch(goc)) console.log("Đi qua hàng rào mật khẩu của bản thử.");

  const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
  try {
    await kiemDuongTruyen(goc);
    await kiemRobots(goc, cho);
    await thuMaMacDinh(b, goc, cho);
    await kiemDaiBaoBanThu(goc, cho);
    await kiemLoRi(goc);
  } catch (e) {
    /*
     * In cả `cause`, vì `fetch` của Node gói lỗi thật vào đó và chỉ để lại
     * đúng hai chữ "fetch failed" ở ngoài. Hai chữ đó không phân biệt nổi
     * chứng chỉ tự ký, máy chủ đóng cổng, hay bắt tay TLS đứt — ba nguyên nhân
     * cần ba cách sửa khác hẳn nhau.
     */
    const nguyenNhan = (x: unknown): string => {
      if (!(x instanceof Error)) return String(x);
      const goc = (x as { cause?: unknown }).cause;
      const ma = goc && typeof goc === "object" && "code" in goc ? String(goc.code) : "";
      const chi = goc instanceof Error ? goc.message : goc ? String(goc) : "";
      return [x.message.split("\n")[0], ma, chi].filter(Boolean).join(" · ");
    };
    doi(`chạy hết được bộ kiểm (${nguyenNhan(e)})`, false);
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
