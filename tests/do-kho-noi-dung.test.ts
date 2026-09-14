import { describe, expect, it } from "vitest";
import {
  NGUONG_BIEN_THE_TOI_THIEU, SO_BAI_BON_TUAN, demBienThe, doKhoNoiDung,
} from "@/lib/domain/do-kho-noi-dung";
import { khuonDangDaDuyet } from "@/lib/domain/generator";
import { TEMPLATES } from "@/lib/domain/templates";
import { YCCD } from "@/lib/domain/curriculum";

const BAO_CAO = doKhoNoiDung(600);

describe("điều kiện ra mắt số 4 — bốn tuần học không lặp bài", () => {
  it("bốn tuần là 160 bài trong 20 buổi", () => {
    expect(SO_BAI_BON_TUAN).toBe(160);
  });

  it("gần như không đề nào lặp lại trong bốn tuần", () => {
    // Ngưỡng đặt ở 5%: một hai bài trùng trong bốn tuần là chấp nhận được,
    // trùng hàng chục bài thì trẻ nhận ra ngay và mất hứng.
    const tyLeTrung = BAO_CAO.soDeTrungBonTuan / SO_BAI_BON_TUAN;
    expect(tyLeTrung, `trùng ${BAO_CAO.soDeTrungBonTuan} bài`).toBeLessThan(0.05);
  });

  it("mỗi dạng bài không lặp quá dày trong bốn tuần", () => {
    // Đây mới là con số trẻ CẢM NHẬN được. Đề khác nhau mà cứ một kiểu thì
    // trẻ vẫn chán. Dưới tám lần trong bốn tuần là ngưỡng chấp nhận được.
    expect(BAO_CAO.lanLapMoiDang, "một dạng lặp quá nhiều lần").toBeLessThan(8);
  });

  it("kho phủ hết mọi yêu cầu cần đạt đã khai trong chương trình", () => {
    expect(BAO_CAO.soYccdDuocPhu).toBe(YCCD.length);
  });

  it("mỗi yêu cầu cần đạt có ít nhất một khuôn dạng", () => {
    const co = new Set(TEMPLATES.map((t) => t.yccd));
    for (const y of YCCD) {
      expect(co.has(y.code), `${y.code} chưa có khuôn dạng nào`).toBe(true);
    }
  });
});

describe("không gian tham số của từng khuôn dạng", () => {
  it("không khuôn dạng nào quá bé mà chưa được giải thích", () => {
    const ten = BAO_CAO.khuonDangQuaBe.map((k) => `${k.id} (${k.bienThe} đề)`).join(", ");
    expect(BAO_CAO.khuonDangQuaBe, `cần mở rộng tham số: ${ten}`).toEqual([]);
  });

  it("khuôn dạng nhỏ có chủ đích phải nêu lý do đủ rõ, không phải ghi cho có", () => {
    for (const k of BAO_CAO.khuonDangNhoCoLyDo) {
      expect(k.lyDo.length, `${k.id} ghi lý do quá sơ sài`).toBeGreaterThan(60);
    }
  });

  it("phép đo vân tay cả hình vẽ, không chỉ chữ đề", () => {
    // Bài xem giờ hỏi đúng một câu như nhau mọi lần; cái đổi nằm hết ở hai kim
    // đồng hồ. Nếu phép đo chỉ nhìn chữ đề thì nó sẽ báo khuôn dạng này hỏng.
    const xemGio = TEMPLATES.find((t) => t.id === "KD-011");
    expect(xemGio).toBeDefined();
    expect(demBienThe(xemGio!, 500).khacNhau).toBeGreaterThan(NGUONG_BIEN_THE_TOI_THIEU);
  });

  it("đếm được cận dưới khi không gian lớn hơn số mẫu", () => {
    const lon = TEMPLATES.find((t) => t.id === "KD-008");
    const { khacNhau, daBaoHoa } = demBienThe(lon!, 200);
    expect(khacNhau).toBe(200);
    expect(daBaoHoa).toBe(false);
  });
});

describe("kho chỉ đo trên khuôn dạng đã được người thật duyệt", () => {
  it("bộ đo dùng đúng cổng phát hành mà trẻ đi qua (BR-15)", () => {
    expect(BAO_CAO.soKhuonDang).toBe(khuonDangDaDuyet().length);
  });
});
