import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CUA_SO, NGUONG_TUOT, NGUONG_VUNG, demVung, mocDatTrongNgay, moTaMoc, tinhMocVung,
} from "@/lib/domain/moc-vung";
import { YCCD } from "@/lib/domain/curriculum";
import { viPhamNT07 } from "@/lib/domain/digest";
import type { Attempt } from "@/lib/domain/types";

const MA = "T2.SPT.02";
let dem = 0;

/** Một lần làm bài. `ngay` để dựng các mốc thời gian khác nhau. */
function lan(correct: boolean, ngay = "2026-03-01", attemptNo = 1, yccd = MA): Attempt {
  dem += 1;
  return {
    itemId: `bai-${dem}`, templateId: "kd", yccd, given: 0, correct,
    trapId: null, hintsUsed: 0, attemptNo, elapsedMs: 1000,
    at: `${ngay}T08:00:${String(dem % 60).padStart(2, "0")}.000Z`,
  };
}

const chuoi = (ketQua: boolean[], ngay = "2026-03-01") => ketQua.map((c) => lan(c, ngay));
const cua = (ma: string, moc: ReturnType<typeof tinhMocVung>) => moc.find((m) => m.yccd === ma)!;

describe("mốc đã vững", () => {
  it("chưa đủ mười bài thì không kết luận gì", () => {
    // Nói "con đã vững" sau ba bài đúng là một lời hứa không có gì đỡ. Thà im.
    const m = cua(MA, tinhMocVung(chuoi(Array(CUA_SO - 1).fill(true))));
    expect(m.trangThai).toBe("chua-du");
    expect(m.tyLe).toBeNull();
  });

  it("đúng ngay tám trên mười thì đạt mốc", () => {
    const m = cua(MA, tinhMocVung(chuoi([true, true, false, true, true, true, false, true, true, true])));
    expect(m.trangThai).toBe("vung");
    expect(m.tyLe).toBe(NGUONG_VUNG);
    expect(m.datLuc).not.toBeNull();
  });

  it("bảy trên mười thì chưa, vẫn là đang luyện", () => {
    const m = cua(MA, tinhMocVung(chuoi([true, true, false, true, true, true, false, false, true, true])));
    expect(m.trangThai).toBe("dang-luyen");
  });

  it("đã vững thì không mất ngay khi tụt xuống dưới 80%", () => {
    /**
     * Đây là lý do có hai ngưỡng thay vì một.
     *
     * Chung một ngưỡng thì trẻ dao động quanh 80% sẽ thấy mốc bật tắt mỗi ngày:
     * 8/10 hôm nay là "đã vững", 7/10 ngày mai là mất. Phụ huynh đọc cái đó
     * không ra thông tin, chỉ ra cảm giác con mình trồi sụt thất thường — mà
     * thứ trồi sụt là phép đo, không phải đứa trẻ.
     */
    const dat = chuoi(Array(CUA_SO).fill(true));
    // Thêm ba bài sai: cửa sổ còn 7/10, dưới 0,8 nhưng trên 0,6.
    const sau = [...dat, ...chuoi([false, false, false], "2026-03-02")];
    const m = cua(MA, tinhMocVung(sau));
    expect(m.tyLe).toBeLessThan(NGUONG_VUNG);
    expect(m.tyLe).toBeGreaterThanOrEqual(NGUONG_TUOT);
    expect(m.trangThai).toBe("vung");
  });

  it("rơi hẳn xuống dưới 60% thì mới tuột mốc", () => {
    const dat = chuoi(Array(CUA_SO).fill(true));
    const sau = [...dat, ...chuoi(Array(5).fill(false), "2026-03-02")];
    const m = cua(MA, tinhMocVung(sau));
    expect(m.tyLe).toBeLessThan(NGUONG_TUOT);
    expect(m.trangThai).toBe("dang-luyen");
    expect(m.datLuc).toBeNull();
  });

  it("chỉ đếm lần thử ĐẦU, không đếm lần làm lại", () => {
    /**
     * "Vững" tuyên bố con TỰ LÀM ĐƯỢC NGAY. Một bài sai rồi thử lại đúng không
     * chứng minh điều đó, nên lần thử lại không được vào mẫu số lẫn tử số.
     *
     * Khác với yccdDangYeu() ở session.ts, và khác có chủ ý — xem chú thích ở
     * moc-vung.ts. Đừng sửa cho hai bên giống nhau.
     */
    const co = [
      ...chuoi(Array(CUA_SO).fill(true)),
      ...Array(20).fill(0).map(() => lan(false, "2026-03-02", 2)),
    ];
    const m = cua(MA, tinhMocVung(co));
    expect(m.soLan).toBe(CUA_SO);
    expect(m.trangThai).toBe("vung");
  });

  it("liệt kê đủ MỌI yêu cầu cần đạt, kể cả phần chưa gặp", () => {
    // Chỉ liệt kê phần đã làm thì bảng này thành danh sách thành tích và giấu
    // mất phần còn lại của học kỳ — phụ huynh cần thấy cả chỗ chưa đụng tới.
    const moc = tinhMocVung(chuoi(Array(CUA_SO).fill(true)));
    expect(moc).toHaveLength(YCCD.length);
    expect(demVung(moc)).toEqual({ vung: 1, tong: YCCD.length });
    const chuaGap = moc.find((m) => m.yccd !== MA)!;
    expect(chuaGap.trangThai).toBe("chua-du");
    expect(chuaGap.soLan).toBe(0);
  });

  it("nêu đúng những mốc VỪA đạt trong ngày", () => {
    const co = [
      ...chuoi(Array(CUA_SO).fill(true), "2026-03-01"),
      ...chuoi(Array(CUA_SO).fill(true), "2026-03-02").map((a) => ({ ...a, yccd: "T2.DL.02" })),
    ];
    const moi = mocDatTrongNgay(co, "2026-03-02");
    expect(moi.map((m) => m.yccd)).toEqual(["T2.DL.02"]);
    // Mốc đạt từ hôm trước không được báo lại — nó không còn là tin của tối nay.
    expect(mocDatTrongNgay(co, "2026-03-01").map((m) => m.yccd)).toEqual([MA]);
  });

  it("câu mô tả không phạm điều cấm NT-07", () => {
    // Không chẩn đoán, không nhận định về đứa trẻ — chỉ mô tả việc đã xảy ra.
    const moc = tinhMocVung([
      ...chuoi(Array(CUA_SO).fill(true)),
      ...chuoi([true, false, true], "2026-03-02").map((a) => ({ ...a, yccd: "T2.DL.02" })),
    ]);
    for (const m of moc) {
      const cau = moTaMoc(m);
      expect(viPhamNT07(cau), cau).toEqual([]);
      // Và không gọi tên thất bại: đang luyện là chuyện bình thường của việc học.
      expect(cau, cau).not.toMatch(/kém|chưa đạt|yếu|dốt/i);
    }
  });
});

describe("mốc vững không được rò sang màn hình của trẻ", () => {
  /**
   * Mốc vững là một dạng đếm điểm. Bề mặt của trẻ cố ý KHÔNG có ô "đúng mấy
   * trên mấy" (BR-06, NT-02): đếm điểm là cách nhanh nhất dạy trẻ né bài khó.
   * Một bảng "con đã vững 5/14 phần" đặt trước mặt đứa bảy tuổi làm đúng cái
   * việc mà ô đếm điểm kia bị cấm để tránh.
   */
  it("không tệp nào trong src/app/be nhập moc-vung", () => {
    const tep: string[] = [];
    const quet = (thuMuc: string) => {
      for (const e of readdirSync(thuMuc, { withFileTypes: true })) {
        const duong = join(thuMuc, e.name);
        if (e.isDirectory()) quet(duong);
        else if (/\.tsx?$/.test(e.name)) tep.push(duong);
      }
    };
    quet("src/app/be");
    expect(tep.length, "phải quét được ít nhất vài tệp").toBeGreaterThan(2);
    for (const t of tep) {
      expect(readFileSync(t, "utf8"), t).not.toMatch(/moc-vung/);
    }
  });
});
