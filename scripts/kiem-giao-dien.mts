/**
 * Kiểm giao diện bằng trình duyệt thật.
 *
 *   npm run kiem-giao-dien                    # dựng bản phát hành rồi kiểm
 *   npm run kiem-giao-dien -- --dev           # kiểm ở chế độ phát triển
 *   npm run kiem-giao-dien -- --goc http://localhost:3000
 *
 * Vì sao phải có bộ kiểm này, dù kho đã có hơn ba trăm bài kiểm thử: toàn bộ
 * số đó chạy trong Node và KHÔNG dựng lấy một điểm ảnh nào. Chúng chứng minh
 * được phép cộng đúng, đáp án không rò rỉ, sự đồng ý đúng luật — rồi để lọt một
 * lỗi khiến MỌI hình minh họa co về bề rộng 0 trên màn hình của trẻ. Bài toán
 * "Bi có gấp 5 lần số kẹo của Linh" hiện ra thành hai chữ "Linh" và "Bi" với
 * hai vạch vô hình.
 *
 * Đó đúng là thứ tệ nhất có thể lọt, vì tiền đề của cả sản phẩm là KHÔNG chặn
 * con ở khâu đọc (BR-01). Hình mất đi thì bài hình học lặng lẽ biến thành bài
 * đọc hiểu, và không bài kiểm thử nào trong Node thấy được điều đó.
 *
 * Nguyên tắc của bộ kiểm này: chỉ khẳng định những điều KHÔNG phụ thuộc vào bài
 * nào được sinh ra. "Nếu có hình thì hình phải đủ rộng" luôn đúng, nên không
 * bao giờ đỏ oan dù mỗi lần chạy gặp một bài khác.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { ghiBoAnhDienTap } from "../src/lib/do-anh/bo-dien-tap";

/*
 * Đường dẫn trình duyệt.
 *
 * Trong máy dựng sẵn của môi trường phát triển, Chromium nằm sẵn ở một chỗ cố
 * định và bản Playwright cài theo dự án lại đi tìm một số hiệu bản khác. Đặt
 * OLY_CHROME="" để bỏ qua và dùng bản Playwright tự tải — đó là cách máy chủ
 * tích hợp liên tục chạy.
 */
const CHROME = process.env.OLY_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BE_RONG_TOI_THIEU = 100;
const SO_LOAI_HINH_TOI_THIEU = 3;
const SO_LAN_THU = 14;

const NHAN_HINH = [
  '[aria-label="Sơ đồ đoạn thẳng"]',
  '[aria-label^="Tia số"]',
  '[aria-label$="trồng thành hàng"]',
  '[aria-label="Thước đo chia theo mét"]',
  '[aria-label="Đồng hồ kim"]',
  '[aria-label="Khối trăm, chục và đơn vị"]',
  '[aria-label*="mỗi hàng"]',
].join(", ");

function doiSo(ten: string): string | null {
  const i = process.argv.indexOf(`--${ten}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

/*
 * Vì sao kiểm cả hai chế độ.
 *
 * Bản phát hành và bản phát triển chạy khác nhau ở một điểm quan trọng: chế độ
 * phát triển gọi các hiệu ứng của React HAI lần để lộ ra những chỗ phụ thuộc
 * vào việc chỉ chạy một lần. Một thay đổi có thể qua bản phát hành mà treo cứng
 * màn hình của trẻ ở bản phát triển — đã xảy ra đúng một lần như vậy, xem chú
 * thích ở chỗ mở phiên trong src/app/be/hoc/PhienHoc.tsx. Người viết mã ngồi
 * với bản phát triển cả ngày, nên bỏ qua chế độ đó là bỏ qua đúng chỗ họ sống.
 */
const loi: string[] = [];
function doi(dieu: string, dung: boolean): void {
  if (dung) console.log(`  ok   ${dieu}`);
  else {
    console.log(`  HỎNG ${dieu}`);
    loi.push(dieu);
  }
}

async function doiMayChu(goc: string, giay = 90): Promise<void> {
  for (let i = 0; i < giay * 2; i++) {
    try {
      const r = await fetch(goc, { signal: AbortSignal.timeout(2000) });
      if (r.ok) return;
    } catch { /* chưa lên, thử tiếp */ }
    await new Promise((t) => setTimeout(t, 500));
  }
  throw new Error(`Máy chủ không lên ở ${goc}`);
}

type KetQuaVaoHoc = "vao-duoc" | "khong-co-ban" | "treo-o-man-cho";

/**
 * Bấm vào một bạn rồi đợi màn hình học hiện ra.
 *
 * Trả về lý do cụ thể chứ không trả về true/false. Bản đầu chỉ trả true/false,
 * nên một màn hình TREO CỨNG hiện ra trong báo cáo thành câu "không gặp bài nào
 * có hình minh họa" — đúng là không gặp, nhưng đó là triệu chứng, không phải
 * bệnh. Người đọc báo cáo sẽ đi tìm lỗi ở phần vẽ hình trong khi hỏng nằm ở
 * chỗ mở phiên.
 */
async function vaoHoc(p: Page, goc: string): Promise<KetQuaVaoHoc> {
  await p.goto(`${goc}/be`, { waitUntil: "networkidle" });
  const ban = p.locator("a, button").filter({ hasText: /Bống|Cu Tí/ }).first();
  if (!(await ban.count())) return "khong-co-ban";
  await ban.click();
  /*
   * Chờ thứ PHẢI CÓ, không chờ thứ phải biến mất.
   *
   * Bản đầu chờ cho chữ "Đang mở vở…" biến mất. Nghe thì hợp lý, nhưng nó đua
   * với chính việc chuyển trang: ngay sau khi bấm, tài liệu vẫn còn là trang
   * chọn bạn — trang đó vốn KHÔNG có chữ ấy — nên điều kiện đúng ngay lập tức
   * và bộ kiểm tưởng đã vào được. Kết quả là một màn hình treo cứng được báo
   * cáo là "vào được 14/14 lần", rồi phần hình báo "không gặp bài nào" — bộ
   * kiểm nói dối một cách rất thuyết phục.
   *
   * Dòng "Bài 1 trong 8" chỉ có trên màn hình học, nên chờ nó là chờ đúng thứ.
   */
  try {
    await p.getByText(/Bài \d+ trong \d+/).first().waitFor({ timeout: 15_000 });
  } catch {
    return "treo-o-man-cho";
  }
  await p.waitForTimeout(250);
  return "vao-duoc";
}

async function kiemBeMatTre(b: Browser, goc: string): Promise<void> {
  console.log("\nBề mặt của trẻ");
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const daThay = new Map<string, number>();
  let hepNhat = Number.POSITIVE_INFINITY;
  let tenHepNhat = "";

  let soLanVaoDuoc = 0;
  let treo = 0;
  for (let lan = 0; lan < SO_LAN_THU; lan++) {
    const p = await ctx.newPage();
    const vao = await vaoHoc(p, goc);
    if (vao !== "vao-duoc") {
      if (vao === "treo-o-man-cho") treo++;
      await p.close();
      // Treo một lần là đủ để kết luận; chờ thêm 13 lần nữa chỉ tốn thời gian.
      if (treo >= 2) break;
      continue;
    }
    soLanVaoDuoc++;

    const hinh = await p.evaluate((chon) => {
      const el = document.querySelector(chon);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { nhan: el.getAttribute("aria-label") ?? "?", w: Math.round(r.width), h: Math.round(r.height) };
    }, NHAN_HINH);

    if (hinh) {
      const loai = hinh.nhan.replace(/\d+/g, "N");
      daThay.set(loai, Math.min(daThay.get(loai) ?? Infinity, hinh.w));
      if (hinh.w < hepNhat) { hepNhat = hinh.w; tenHepNhat = hinh.nhan; }
    }
    await p.close();
  }
  await ctx.close();

  doi(
    `vào được màn hình học (${soLanVaoDuoc}/${SO_LAN_THU} lần thử` +
      `${treo ? `, ${treo} lần đứng mãi ở "Đang mở vở…"` : ""})`,
    soLanVaoDuoc > 0 && treo === 0,
  );
  if (daThay.size === 0) {
    doi("gặp được ít nhất một bài có hình minh họa", false);
    return;
  }
  console.log(`       đã gặp ${daThay.size} loại hình: ${[...daThay.keys()].join(", ")}`);
  doi(
    `mọi hình minh họa rộng ít nhất ${BE_RONG_TOI_THIEU}px (hẹp nhất: ${tenHepNhat} = ${hepNhat}px)`,
    hepNhat >= BE_RONG_TOI_THIEU,
  );
  doi(
    `bộ kiểm phủ được ít nhất ${SO_LOAI_HINH_TOI_THIEU} loại hình`,
    daThay.size >= SO_LOAI_HINH_TOI_THIEU,
  );
}

async function kiemManHinhChinh(b: Browser, goc: string): Promise<void> {
  console.log("\nCác màn hình chính");
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const loiTrang: string[] = [];
  p.on("pageerror", (e) => loiTrang.push(String(e)));

  /*
   * Mỗi trang kiểm một điều CỤ THỂ của chính trang đó.
   *
   * Bản đầu của bộ kiểm này đếm số ký tự trên trang và đòi hơn 80. Trang chọn
   * bạn có đúng 80 ký tự nên nó trượt, dù trang hoàn toàn bình thường. Đếm ký
   * tự là một con số tùy tiện: nó vừa báo động nhầm, vừa không phát hiện được
   * một trang đầy chữ mà mất hẳn nút bấm.
   */
  const TRANG: { ten: string; duong: string; phaiCo: string; moTa: string }[] = [
    { ten: "trang chủ", duong: "/", phaiCo: 'a[href="/be"]', moTa: "lối vào cho trẻ" },
    { ten: "trang chủ", duong: "/", phaiCo: 'a[href^="/phu-huynh"]', moTa: "lối vào cho phụ huynh" },
    { ten: "chọn bạn", duong: "/be", phaiCo: 'a[href*="/be/hoc"], button', moTa: "nút chọn bạn" },
    { ten: "cổng phụ huynh", duong: "/phu-huynh", phaiCo: 'input[name="pin"]', moTa: "ô nhập mã PIN" },
    { ten: "cách chấm bài", duong: "/cach-cham-bai", phaiCo: "h1", moTa: "tiêu đề" },
    { ten: "gỡ bỏ nội dung", duong: "/go-bo-noi-dung", phaiCo: "form", moTa: "biểu mẫu gửi yêu cầu" },
  ];

  for (const t of TRANG) {
    const r = await p.goto(goc + t.duong, { waitUntil: "networkidle" });
    const co = await p.locator(t.phaiCo).count();
    doi(`${t.ten} mở được và có ${t.moTa}`, Boolean(r?.ok()) && co > 0);
  }

  // Bảng màu phải thật sự được nạp; nền trắng trơn nghĩa là CSS không tới nơi.
  await p.goto(`${goc}/`, { waitUntil: "networkidle" });
  const nen = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  doi(`biểu định kiểu đã nạp (nền = ${nen})`, nen !== "rgba(0, 0, 0, 0)" && nen !== "rgb(255, 255, 255)");

  // Không được tràn ngang trên màn hình điện thoại.
  const tran = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  doi(`không tràn ngang ở bề rộng 390px (thừa ${tran}px)`, tran <= 1);

  doi("không có lỗi JavaScript trên các trang chính", loiTrang.length === 0);
  if (loiTrang.length) console.log(loiTrang.join("\n"));
  await ctx.close();
}

/**
 * Bản phát hành phải KHÔNG CÓ trang gắn nhãn.
 *
 * Bài kiểm thử trong Node chứng minh được hàm chốt trả về false khi
 * NODE_ENV=production. Nó không chứng minh được rằng một bản ĐÃ DỰNG, chạy
 * bằng `next start`, thật sự trả 404 — giữa hai thứ đó còn có việc định tuyến,
 * việc dựng sẵn trang, và một dòng cấu hình ai đó thêm vào sau này. Trang này
 * phục vụ ảnh trang vở chưa che, đọc thẳng từ đĩa, nên chỗ duy nhất đáng tin là
 * gõ vào chính máy chủ đã dựng rồi xem nó trả gì.
 */
async function kiemCongCuGanNhanDaKhoa(goc: string): Promise<void> {
  console.log("\nCông cụ gắn nhãn (phải khóa ở bản phát hành)");
  for (const duong of ["/gan-nhan", "/api/gan-nhan", "/api/gan-nhan/anh?tep=a.jpg"]) {
    const r = await fetch(goc + duong, { redirect: "manual" });
    doi(`${duong} trả 404 (thật ra trả ${r.status})`, r.status === 404);
  }
}

/**
 * Bản phát triển thì trang gắn nhãn phải chạy được thật.
 *
 * Kiểm đúng thứ không bài kiểm thử nào trong Node thấy được: ảnh có HIỆN RA hay
 * không. `naturalWidth` bằng 0 nghĩa là trình duyệt nhận được thẻ ảnh nhưng
 * không tải nổi tệp — địa chỉ sai, tên tệp bị chặn, kiểu nội dung sai. Lúc đó
 * người gắn nhãn ngồi trước một khung trắng và không có gì để gõ, mà mọi bài
 * kiểm thử vẫn xanh.
 */
async function kiemTrangGanNhan(b: Browser, goc: string): Promise<void> {
  console.log("\nTrang gắn nhãn");
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const loiTrang: string[] = [];
  p.on("pageerror", (e) => loiTrang.push(String(e)));

  const r = await p.goto(`${goc}/gan-nhan`, { waitUntil: "networkidle" });
  doi("mở được /gan-nhan ở bản phát triển", Boolean(r?.ok()));

  const anh = p.locator('img[alt^="Trang vở"]').first();
  try {
    await anh.waitFor({ timeout: 15_000 });
  } catch {
    doi("hiện được tấm ảnh đầu tiên trong thư mục", false);
    await ctx.close();
    return;
  }
  const rong = await anh.evaluate((el) => (el as HTMLImageElement).naturalWidth);
  doi(`ảnh tải được thật, không phải khung trắng (naturalWidth = ${rong})`, rong > 0);

  // Gõ một nhãn rồi lưu, và hỏi lại máy chủ xem nó có thật sự vào tệp không.
  await p.getByRole("button", { name: "Đặt tính cột dọc" }).click();
  await p.getByPlaceholder("ví dụ 75").fill("75");
  await p.getByRole("button", { name: "Lưu nhãn tấm này" }).click();
  await p.waitForTimeout(600);

  const sau = await (await fetch(`${goc}/api/gan-nhan`)).json();
  doi(
    `nhãn đã ghi vào nhan.json (đã gắn ${sau.tienDo?.daGanNhan} ảnh, ` +
      `${sau.tienDo?.theoDang?.["cot-doc"]} bài cột dọc)`,
    sau.tienDo?.daGanNhan === 1 && sau.tienDo?.theoDang?.["cot-doc"] === 1,
  );

  doi("không có lỗi JavaScript trên trang gắn nhãn", loiTrang.length === 0);
  if (loiTrang.length) console.log(loiTrang.join("\n"));
  await ctx.close();
}

async function main(): Promise<void> {
  const gocNgoai = doiSo("goc");
  const cheDoDev = process.argv.includes("--dev");
  const cong = cheDoDev ? 3211 : 3210;
  const goc = gocNgoai ?? `http://localhost:${cong}`;
  let mayChu: ChildProcess | null = null;

  /*
   * Bộ kiểm tự khai báo hộ mẫu cho máy chủ nó dựng lên.
   *
   * Từ khi có chốt ở src/lib/server/moi-truong.ts, bản phát hành KHÔNG tự dựng
   * hộ mẫu nữa — đó là chủ đích, vì một hộ có PIN biết trước nằm trên địa chỉ
   * công khai là một tài khoản không chủ. Nhưng bộ kiểm giao diện thì cần có
   * một bạn để bấm vào, nên nó phải nói rõ là mình muốn hộ mẫu, đúng như người
   * dựng bản trình diễn phải làm.
   */
  /*
   * Thư mục ảnh riêng, dựng bằng bộ ảnh diễn tập.
   *
   * Tuyệt đối không trỏ vào bo-anh-do/: đó là ảnh trang vở của trẻ thật, và một
   * bộ kiểm tự động thì phải chạy được ở máy tích hợp liên tục, nơi không có —
   * và không được có — một tấm nào trong đó.
   */
  const thuMucAnh = await mkdtemp(path.join(tmpdir(), "oly-kiem-gan-nhan-"));
  await ghiBoAnhDienTap(thuMucAnh);

  const bienMoiTruong = {
    ...process.env,
    OLY_DU_LIEU_MAU: "true",
    OLY_PIN_MAU: "884417",
    OLY_MA_TRUC: "ma-truc-cua-bo-kiem",
    OLY_THU_MUC_ANH: thuMucAnh,
    /*
     * Chạy máy chủ của bộ kiểm như một bản THỬ.
     *
     * Đúng với sự thật — đây là máy chủ dựng lên để bấm thử rồi tắt. Và nhờ
     * vậy dải báo bản thử cũng nằm trong khung hình lúc đo bề rộng hình minh
     * họa: một dải chiếm chỗ ở đầu trang là thứ có thể đẩy bố cục vỡ, mà không
     * bài kiểm thử nào trong Node thấy được.
     */
    OLY_MOI_TRUONG: "thu",
  };

  if (!gocNgoai) {
    if (cheDoDev) {
      console.log("Chạy ở chế độ phát triển…");
      mayChu = spawn("npx", ["next", "dev", "-p", String(cong)], {
        stdio: "ignore", detached: true, env: bienMoiTruong,
      });
    } else {
      console.log("Dựng bản phát hành rồi chạy thử…");
      await new Promise<void>((xong, hong) => {
        const d = spawn("npm", ["run", "build"], { stdio: "inherit" });
        d.on("exit", (m) => (m === 0 ? xong() : hong(new Error(`dựng hỏng, mã ${m}`))));
      });
      mayChu = spawn("npx", ["next", "start", "-p", String(cong)], {
        stdio: "ignore", detached: true, env: bienMoiTruong,
      });
    }
  }
  console.log(`Chế độ: ${gocNgoai ? "máy chủ có sẵn" : cheDoDev ? "phát triển" : "phát hành"}`);

  const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
  try {
    await doiMayChu(goc);
    await kiemManHinhChinh(b, goc);
    await kiemBeMatTre(b, goc);
    if (cheDoDev) await kiemTrangGanNhan(b, goc);
    else await kiemCongCuGanNhanDaKhoa(goc);
  } catch (e) {
    // Một ngoại lệ ở giữa chừng cũng là một điều KHÔNG ĐẠT, và phải nói ra nó
    // là điều gì. Bản đầu để ngoại lệ bay thẳng lên, rồi lệnh dừng máy chủ ở
    // khối finally lại ném một lỗi khác đè lên — bộ kiểm đỏ mà không ai biết vì
    // sao đỏ.
    doi(`chạy hết được bộ kiểm (${e instanceof Error ? e.message.split("\n")[0] : e})`, false);
  } finally {
    await b.close();
    if (mayChu?.pid) {
      try {
        process.kill(-mayChu.pid, "SIGTERM");
      } catch {
        // Máy chủ đã tự tắt. Không phải lỗi, và không được che mất lỗi thật.
      }
    }
    await rm(thuMucAnh, { recursive: true, force: true });
  }

  console.log("");
  if (loi.length) {
    console.log(`${loi.length} điều không đạt:`);
    for (const l of loi) console.log(`  - ${l}`);
    process.exit(1);
  }
  console.log("Giao diện đạt.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
