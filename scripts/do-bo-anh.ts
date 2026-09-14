/**
 * Chạy bộ đo ảnh và in báo cáo.
 *
 *   npm run do-anh                              # diễn tập, không gọi ra mạng
 *   npm run do-anh -- --thu-muc bo-anh-do       # chạy bộ ảnh thật trong thư mục đó
 *   npm run do-anh -- --thu-muc X --ket-qua r.json
 *
 * Thư mục ảnh thật phải có tệp nhan.json theo mẫu ở docs/bo-do-anh.md.
 *
 * Mặc định là DIỄN TẬP vì một lý do: lệnh này tiêu tiền thật và gửi ảnh ra
 * ngoài. Muốn làm điều đó thì phải gõ ra, không được để nó xảy ra vì gõ nhầm.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chayBoDo } from "../src/lib/do-anh/chay";
import { ghiBoAnhDienTap, NHAN_DIEN_TAP } from "../src/lib/do-anh/bo-dien-tap";
import { inBaoCao } from "../src/lib/do-anh/in-bao-cao";
import { doPhuDang } from "../src/lib/do-anh/nhan";
import { NhaCungCapDienTap } from "../src/lib/do-anh/nha-cung-cap-dien-tap";
import { kiemBoDo } from "../src/lib/do-anh/tu-kiem";
import { layNhaCungCap } from "../src/lib/vision/chon-nha-cung-cap";
import type { NhaCungCapXuLyAnh } from "../src/lib/vision/provider";

function doiSo(ten: string): string | null {
  const i = process.argv.indexOf(`--${ten}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

async function main() {
  const thuMucThat = doiSo("thu-muc");
  let thuMuc: string;
  let nhan: unknown;
  let ncc: NhaCungCapXuLyAnh;
  let dienTap: NhaCungCapDienTap | null = null;

  if (thuMucThat) {
    thuMuc = path.resolve(thuMucThat);
    nhan = JSON.parse(await readFile(path.join(thuMuc, "nhan.json"), "utf8"));
    ncc = layNhaCungCap();
    console.log(`Nhà cung cấp: ${ncc.ten}`);
    console.log(
      "Nhắc: ảnh trang vở của trẻ phải được che phần ghi tên, lớp, trường TRƯỚC KHI\n" +
        "đưa vào thư mục này. Bộ đo không che giúp — lớp che nằm ở máy khách (BR-32).",
    );
  } else {
    thuMuc = path.join(process.cwd(), ".bo-anh-dien-tap");
    const anh = await ghiBoAnhDienTap(thuMuc);
    dienTap = new NhaCungCapDienTap(NHAN_DIEN_TAP, anh);
    ncc = dienTap;
    nhan = NHAN_DIEN_TAP;
    console.log("CHẾ ĐỘ DIỄN TẬP — số liệu dưới đây không nói gì về sản phẩm thật.");
    console.log("Nó chỉ chứng minh bộ đo chạy và bắt được lỗi. Xem docs/bo-do-anh.md.\n");
  }

  const phu = doPhuDang(nhan as never);
  console.log(`Bộ ảnh phủ ${phu.size} dạng bài: ${[...phu.entries()].map(([k, v]) => `${k} ${v}`).join(", ")}\n`);

  const { dong, baoCao } = await chayBoDo({
    thuMuc,
    nhan,
    nhaCungCap: ncc,
    baoTien: (xong, tong, tep) => console.log(`  [${xong}/${tong}] ${tep}`),
  });

  console.log(`\n${inBaoCao(baoCao)}`);

  if (dienTap) {
    const g = dienTap.tongDaGai();
    const lech = kiemBoDo(dong, dienTap);
    console.log("");
    console.log("KIỂM LẠI CHÍNH BỘ ĐO (chỉ có ở chế độ diễn tập)");
    console.log(
      `  Đã gài: sai chữ số ${g.saiChuSo}, bỏ bài ${g.boBai}, ` +
        `từ chối oan ${g.tuChoiOan}, đọc bừa ${g.docBua}` +
        ` — trên ${dienTap.daGai.size}/${dong.length} tấm ảnh`,
    );
    if (lech.length === 0) {
      console.log(
        "  → Khớp từng ảnh: mọi ảnh có gài lỗi đều bị bộ đo nêu ra, mọi ảnh sạch đều im.",
      );
    } else {
      for (const l of lech) console.log(`  → LỆCH ${l.tep}: ${l.moTa}`);
      console.log("  Sửa bộ đo trước khi dùng nó trên ảnh thật.");
      process.exitCode = 1;
    }
  }

  const raTep = doiSo("ket-qua");
  if (raTep) {
    await writeFile(raTep, JSON.stringify({ baoCao, dong }, null, 2), "utf8");
    console.log(`\nĐã ghi kết quả thô vào ${raTep}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
