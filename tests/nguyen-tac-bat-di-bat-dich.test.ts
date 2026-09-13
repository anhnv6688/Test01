import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Mục 7 của BRD — các ranh giới không thương lượng.
 *
 * "Mọi đề xuất tính năng mâu thuẫn với một trong các nguyên tắc dưới đây đều bị
 * loại, bất kể lợi ích thương mại."
 *
 * Một câu như vậy trong tài liệu chỉ có hiệu lực nếu có thứ gì đó kiểm tra nó ở
 * mỗi lần chạy kiểm thử. Bài dưới đây quét toàn bộ mã nguồn tìm dấu vết của
 * những thứ bị cấm. Nó không thể bắt được mọi cách vi phạm, nhưng nó bắt được
 * cách vi phạm phổ biến nhất: một người mới vào dự án thêm tính năng mà chưa
 * đọc mục 7.
 */
function tatCaTep(thuMuc: string): string[] {
  const ra: string[] = [];
  for (const ten of readdirSync(thuMuc)) {
    const d = join(thuMuc, ten);
    if (statSync(d).isDirectory()) ra.push(...tatCaTep(d));
    else if (/\.(tsx?|css)$/.test(ten)) ra.push(d);
  }
  return ra;
}

const NGUON = tatCaTep("src").map((d) => ({ duong: d, noiDung: readFileSync(d, "utf-8") }));

/** Bỏ qua phần chú thích, vì chú thích thường NHẮC tới điều cấm để giải thích. */
function boChuThich(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|\s)\/\/.*$/gm, " ");
}

function timTrongMa(mau: RegExp): string[] {
  return NGUON.filter((t) => mau.test(boChuThich(t.noiDung))).map((t) => t.duong);
}

describe("NT-01 — không quảng cáo, không vòng quay may mắn, không vật phẩm mua bằng tiền", () => {
  it("không có mã nào liên quan tới quảng cáo", () => {
    expect(timTrongMa(/\b(adsbygoogle|googletag|admob|adUnit|bannerAd|quangCao)\b/i)).toEqual([]);
  });

  it("không có vòng quay may mắn hay hộp quà ngẫu nhiên", () => {
    expect(timTrongMa(/\b(vongQuay|lootBox|gacha|spinWheel|mayMan)\b/i)).toEqual([]);
  });

  it("không có mua bán trong ứng dụng dành cho trẻ", () => {
    const nghiNgo = timTrongMa(/\b(inAppPurchase|muaVatPham|storekit|billingClient)\b/i);
    expect(nghiNgo).toEqual([]);
  });
});

describe("NT-02 — không bảng xếp hạng theo điểm tuyệt đối", () => {
  it("không có bảng xếp hạng giữa các trẻ", () => {
    expect(timTrongMa(/\b(leaderboard|bangXepHang|xepHangLop|topHocSinh)\b/i)).toEqual([]);
  });

  it("phần thưởng không nhận tỷ lệ đúng làm đầu vào (BR-06)", () => {
    const rewards = readFileSync("src/lib/domain/rewards.ts", "utf-8");
    const than = boChuThich(rewards);
    expect(than).not.toMatch(/tyLeDung|accuracy|diemSo\b/);
  });
});

describe("NT-03 — không thu thập ảnh khuôn mặt của trẻ", () => {
  it("không có luồng nào chụp ảnh bằng máy ảnh trước", () => {
    expect(timTrongMa(/facingMode:\s*["']user["']|capture=["']user["']/)).toEqual([]);
  });

  it("không có nhận dạng khuôn mặt", () => {
    expect(timTrongMa(/\b(faceDetector|FaceDetection|nhanDangKhuonMat)\b/i)).toEqual([]);
  });
});

describe("NT-04 — không dùng dữ liệu học của trẻ cho quảng cáo", () => {
  it("không có mã theo dõi hành vi của bên thứ ba", () => {
    expect(timTrongMa(/\b(fbq|gtag|mixpanel|amplitude|segment\.io|pixelId)\b/i)).toEqual([]);
  });
});

describe("NT-05, NT-06 — nguồn nội dung sạch", () => {
  it("không có công cụ thu thập nội dung tự động (NT-06, RB-03)", () => {
    expect(timTrongMa(/\b(puppeteer|playwright|cheerio|scrape|crawler|spiderBot)\b/i)).toEqual([]);
  });

  it("mọi khuôn dạng đều khai nguồn là chương trình hoặc hợp đồng biên soạn (BR-13)", async () => {
    const { TEMPLATES } = await import("@/lib/domain/templates");
    for (const t of TEMPLATES) {
      expect(["CTGDPT", "bien-soan-dat-hang"], t.id).toContain(t.provenance.source);
      expect(t.provenance.reference.toLowerCase(), t.id).not.toContain("sách giáo khoa");
    }
  });
});

describe("NT-09 — không tổ chức lớp học trực tuyến có giáo viên dạy", () => {
  it("không có mã gọi video hay lớp học trực tuyến", () => {
    expect(timTrongMa(/\b(webrtc|getUserMedia|jitsi|zoomSdk|liveClass|lopTrucTuyen)\b/i)).toEqual([]);
  });
});

describe("NT-10 — hai bề mặt tách bạch", () => {
  it("mô-đun lời giảng chỉ được dùng ở phía phụ huynh và ở máy chủ", () => {
    const dungTeaching = NGUON
      .filter((t) => /from\s+["'][^"']*domain\/teaching/.test(boChuThich(t.noiDung)))
      .map((t) => t.duong.replace(/\\/g, "/"));
    for (const d of dungTeaching) {
      const hopLe =
        d.includes("src/app/phu-huynh/") ||
        d.includes("src/app/api/") ||
        d.includes("src/lib/");
      expect(hopLe, `${d} dùng mô-đun lời giảng ngoài phạm vi cho phép`).toBe(true);
    }
  });

  it("cổng mã PIN là lối duy nhất vào phần của phụ huynh", () => {
    const layout = readFileSync("src/app/phu-huynh/layout.tsx", "utf-8");
    const trang = readFileSync("src/app/phu-huynh/page.tsx", "utf-8");
    expect(layout).toContain("daMoCong");
    expect(trang).toContain("CongPin");
  });
});
