/**
 * Chặn những thứ tuyệt đối không được nằm trong kho mã.
 *
 *   npm run khong-ro-ri
 *
 * Vì sao cần một bộ canh riêng chứ .gitignore là chưa đủ: .gitignore chỉ ngăn
 * việc thêm vô tình, còn `git add -f` thì đi qua nó, và một tệp đã lỡ vào lịch
 * sử thì không gỡ ra được bằng một lần xóa. Với một sản phẩm mà dữ liệu đầu vào
 * là ẢNH TRANG VỞ CỦA TRẺ EM, đây không phải chuyện dọn dẹp cho gọn — đây là
 * chuyện một tấm ảnh có tên và lớp của một đứa trẻ nằm vĩnh viễn trong một kho
 * mã công khai.
 *
 * Bộ canh chạy trên danh sách tệp mà git ĐANG theo dõi, nên nó bắt cả trường
 * hợp ai đó thêm bằng -f.
 */
import { execFileSync } from "node:child_process";

export interface Luat {
  ten: string;
  /** Khớp thì chặn. */
  khop: (duongDan: string) => boolean;
  viSao: string;
}

/** Thư mục duy nhất được phép chứa ảnh: tài nguyên giao diện của chính sản phẩm. */
const THU_MUC_ANH_HOP_LE = ["public/", "docs/hinh/"];

const DUOI_ANH = [".png", ".jpg", ".jpeg", ".webp", ".heic", ".heif", ".gif", ".bmp", ".tif", ".tiff"];

export const LUAT: Luat[] = [
  {
    ten: "Ảnh nằm ngoài thư mục tài nguyên",
    khop: (p) =>
      DUOI_ANH.some((d) => p.toLowerCase().endsWith(d)) &&
      !THU_MUC_ANH_HOP_LE.some((t) => p.startsWith(t)),
    viSao:
      "Ảnh trang vở của trẻ không bao giờ được vào kho mã. Ảnh giao diện thì để trong public/.",
  },
  {
    ten: "Cơ sở dữ liệu cục bộ",
    khop: (p) => /\.sqlite(-wal|-shm)?$/.test(p) || p.startsWith(".data/"),
    viSao: "Tệp này chứa dữ liệu thật của hộ gia đình: tên con, lịch sử học, sự đồng ý.",
  },
  {
    ten: "Tệp môi trường có khóa thật",
    khop: (p) => /(^|\/)\.env($|\.)/.test(p) && !p.endsWith(".example"),
    viSao: "Khóa API nằm trong đó. Chỉ .env.example được vào kho mã.",
  },
  {
    ten: "Thư mục bộ ảnh đo",
    khop: (p) => p.startsWith("bo-anh-do/") || p.startsWith(".bo-anh-dien-tap/"),
    viSao: "Thư mục ảnh đo là ảnh thật của trẻ, kể cả tệp nhãn đi kèm.",
  },
  {
    ten: "Báo cáo đo có thể kèm nội dung bài của trẻ",
    khop: (p) => p.endsWith(".bao-cao.json"),
    viSao: "Bản báo cáo thô chứa nguyên văn đề bài và bài làm đọc được từ ảnh.",
  },
];

/** Soát một danh sách đường dẫn. Tách khỏi git để kiểm thử được. */
export function soat(tep: string[]): { tep: string; luat: Luat }[] {
  const viPham: { tep: string; luat: Luat }[] = [];
  for (const p of tep) {
    for (const l of LUAT) if (l.khop(p)) viPham.push({ tep: p, luat: l });
  }
  return viPham;
}

function tepDangTheoDoi(): string[] {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

function main(): void {
  const tep = tepDangTheoDoi();
  const viPham = soat(tep);

  if (viPham.length === 0) {
    console.log(`Đã soát ${tep.length} tệp git đang theo dõi. Không có gì không nên nằm ở đây.`);
    return;
  }

  console.error("CÓ TỆP KHÔNG ĐƯỢC NẰM TRONG KHO MÃ:\n");
  for (const v of viPham) {
    console.error(`  ${v.tep}`);
    console.error(`    ${v.luat.ten} — ${v.luat.viSao}\n`);
  }
  console.error(
    "Gỡ tệp khỏi git (git rm --cached), rồi kiểm lại .gitignore.\n" +
      "Nếu tệp đã lỡ được đẩy lên, xóa thôi là chưa đủ — nó vẫn nằm trong lịch sử,\n" +
      "và với ảnh trang vở của trẻ thì phải coi là đã lộ.",
  );
  process.exit(1);
}

if (process.argv[1]?.endsWith("khong-ro-ri.ts")) main();
