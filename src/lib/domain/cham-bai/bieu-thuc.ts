/**
 * Đọc và tính một biểu thức số học do trẻ viết trên giấy.
 *
 * Viết riêng thay vì dùng một thư viện có sẵn vì ba lẽ: trẻ lớp 1–2 viết dấu
 * nhân là "x" và dấu chia là ":" theo đúng sách giáo khoa chứ không viết "*" và
 * "/"; máy đọc ảnh hay trả về dấu "−" nửa dài hoặc "×" thay vì dấu trừ và dấu
 * nhân thường; và tuyệt đối không được dùng eval trên chuỗi đến từ ảnh của
 * người dùng.
 *
 * Trả về null khi không đọc được, và null ở đây có nghĩa là "chưa kết luận"
 * chứ không phải "sai" — phần chấm sẽ nói thẳng với phụ huynh như vậy.
 */
type Toan = "+" | "-" | "x" | ":";

interface The {
  loai: "so" | "toan" | "mo" | "dong";
  gia: number | Toan;
}

/** Chuẩn hóa các biến thể ký tự mà máy đọc ảnh hay trả về. */
export function chuanHoaBieuThuc(s: string): string {
  return s
    .replace(/[−–—]/g, "-")
    .replace(/[×✕✖]/g, "x")
    .replace(/[÷]/g, ":")
    .replace(/[*]/g, "x")
    .replace(/[/]/g, ":")
    .replace(/[,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tachThe(s: string): The[] | null {
  const the: The[] = [];
  let i = 0;
  const t = chuanHoaBieuThuc(s);
  while (i < t.length) {
    const c = t[i];
    if (c === " ") { i += 1; continue; }
    if (c >= "0" && c <= "9") {
      let j = i;
      while (j < t.length && t[j] >= "0" && t[j] <= "9") j += 1;
      the.push({ loai: "so", gia: Number(t.slice(i, j)) });
      i = j;
      continue;
    }
    if (c === "+" || c === "-" || c === "x" || c === ":") {
      the.push({ loai: "toan", gia: c });
      i += 1;
      continue;
    }
    if (c === "(") { the.push({ loai: "mo", gia: 0 }); i += 1; continue; }
    if (c === ")") { the.push({ loai: "dong", gia: 0 }); i += 1; continue; }
    // Bất kỳ ký tự lạ nào cũng làm biểu thức không đọc được. Thà nói không biết.
    return null;
  }
  return the.length > 0 ? the : null;
}

/**
 * Tính biểu thức. Nhân chia trước, cộng trừ sau, cùng mức thì từ trái sang phải
 * — đúng thứ tự mà sách giáo khoa dạy.
 */
export function tinhBieuThuc(s: string): number | null {
  const the = tachThe(s);
  if (!the) return null;
  let vt = 0;

  const nguyenTo = (): number | null => {
    const t = the[vt];
    if (!t) return null;
    if (t.loai === "so") { vt += 1; return t.gia as number; }
    if (t.loai === "mo") {
      vt += 1;
      const trong = cong();
      if (trong === null) return null;
      if (the[vt]?.loai !== "dong") return null;
      vt += 1;
      return trong;
    }
    // Dấu trừ đứng đầu: trẻ lớp 1–2 không viết số âm, nên coi là không đọc được.
    return null;
  };

  const nhan = (): number | null => {
    let gia = nguyenTo();
    if (gia === null) return null;
    while (the[vt]?.loai === "toan" && (the[vt].gia === "x" || the[vt].gia === ":")) {
      const toan = the[vt].gia as Toan;
      vt += 1;
      const phai = nguyenTo();
      if (phai === null) return null;
      if (toan === ":") {
        if (phai === 0) return null;
        gia = gia / phai;
      } else {
        gia = gia * phai;
      }
    }
    return gia;
  };

  const cong = (): number | null => {
    let gia = nhan();
    if (gia === null) return null;
    while (the[vt]?.loai === "toan" && (the[vt].gia === "+" || the[vt].gia === "-")) {
      const toan = the[vt].gia as Toan;
      vt += 1;
      const phai = nhan();
      if (phai === null) return null;
      gia = toan === "+" ? gia + phai : gia - phai;
    }
    return gia;
  };

  const kq = cong();
  if (kq === null || vt !== the.length) return null;
  return Number.isFinite(kq) ? kq : null;
}

/**
 * Tách một dòng dạng "32 - 8 = 24" thành vế trái và con số sau dấu bằng.
 * Trẻ hay viết nhiều dấu bằng liên tiếp, nên lấy vế cuối cùng làm kết quả.
 */
export function tachDangThuc(s: string): { veTrai: string; ketQua: number | null } | null {
  const t = chuanHoaBieuThuc(s);
  if (!t.includes("=")) return null;
  const phan = t.split("=").map((x) => x.trim()).filter((x) => x.length > 0);
  if (phan.length < 2) return null;
  const cuoi = phan[phan.length - 1];
  const so = /^\d+$/.test(cuoi) ? Number(cuoi) : null;
  return { veTrai: phan.slice(0, -1).join("="), ketQua: so };
}

/** Lấy con số đầu tiên trong một chuỗi, ví dụ "24 quả" cho ra 24. */
export function soDauTien(s: string | null): number | null {
  if (!s) return null;
  const m = chuanHoaBieuThuc(s).match(/\d+/);
  return m ? Number(m[0]) : null;
}
