import { Rng } from "../rng";
import { DO_VAT, NGUOI_LON, TEN_BAN } from "../names";
import type { BuiltItem, Template } from "../types";
import { chonViDu } from "./chung";

/**
 * Mạch Giải toán có lời văn — khuôn dạng bài.
 *
 * Quy tắc viết một khuôn dạng mới nằm ở ./chung.ts. Đọc phần đó trước khi thêm
 * vào tệp này.
 */

/** Nhiều hơn — ít hơn. */
const KD_008: Template = {
  id: "KD-008",
  version: 3,
  title: "Bài toán nhiều hơn — ít hơn",
  yccd: "T2.GT.01",
  grade: 2,
  term: 2,
  strand: "giai-toan",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Giải toán",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-11T15:00:00+07:00",
    templateVersion: 3,
    note: "Một nửa số bài phải là dạng ngược để bẫy từ khóa có tác dụng.",
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const [a, b] = r.shuffle(TEN_BAN).slice(0, 2);
    const dv = r.pick(DO_VAT);
    const soA = r.int(12, 40);
    const chenh = r.int(3, 12);
    // Dạng ngược: cho biết A nhiều hơn B, hỏi B — nghe "nhiều hơn" nhưng phải trừ.
    const dangNguoc = r.next() < 0.5;
    if (dangNguoc) {
      return {
        prompt: `${a} có ${soA} ${dv.ten}. ${a} có nhiều hơn ${b} ${chenh} ${dv.ten}. Hỏi ${b} có bao nhiêu ${dv.ten}?`,
        speech: `Bạn ${a} có ${soA} ${dv.ten}. Bạn ${a} có nhiều hơn bạn ${b} là ${chenh} ${dv.ten}. Hỏi bạn ${b} có bao nhiêu ${dv.ten}?`,
        answer: soA - chenh,
        unit: dv.dv,
        visual: {
          kind: "doan-thang",
          segments: [
            { label: a, length: soA },
            { label: b, length: soA - chenh },
          ],
        },
        hints: [
          {
            level: 1,
            text: `Con đọc lại đề: đề hỏi về ${b}, mà ${b} là người có ÍT hơn.`,
            speech: `Đề đang hỏi về bạn ${b}, và bạn ${b} là người có ít hơn nhé.`,
          },
          {
            level: 2,
            text: "Nhìn sơ đồ đoạn thẳng: đoạn của bạn được hỏi ngắn hơn hay dài hơn?",
            speech: "Con nhìn sơ đồ, đoạn của bạn được hỏi ngắn hơn hay dài hơn?",
            revealVisual: true,
          },
          chonViDu(soA - chenh, [
            {
              so: [20, 6, 14],
              text: "An có 20 cái kẹo, An nhiều hơn Bình 6 cái, vậy Bình có 20 − 6 = 14 cái.",
              speech: "Con xem bài tương tự. An có hai mươi cái kẹo, nhiều hơn Bình sáu cái, thì Bình có mười bốn cái.",
            },
            {
              so: [35, 8, 27],
              text: "An có 35 cái kẹo, An nhiều hơn Bình 8 cái, vậy Bình có 35 − 8 = 27 cái.",
              speech: "Con xem bài tương tự. An có ba mươi lăm cái kẹo, nhiều hơn Bình tám cái, thì Bình có hai mươi bảy cái.",
            },
          ]),
          {
            level: 4,
            text: "Bước đầu tiên: con xác định ai nhiều hơn, rồi mới chọn phép tính.",
            speech: "Con xác định ai nhiều hơn trước, rồi mới chọn phép tính.",
          },
        ],
        traps: [{ id: "BAY-NHIEU-HON-TRU", wrongAnswer: soA + chenh }],
      };
    }
    return {
      prompt: `${a} có ${soA} ${dv.ten}. ${b} có nhiều hơn ${a} ${chenh} ${dv.ten}. Hỏi ${b} có bao nhiêu ${dv.ten}?`,
      speech: `Bạn ${a} có ${soA} ${dv.ten}. Bạn ${b} có nhiều hơn bạn ${a} là ${chenh} ${dv.ten}. Hỏi bạn ${b} có bao nhiêu ${dv.ten}?`,
      answer: soA + chenh,
      unit: dv.dv,
      visual: {
        kind: "doan-thang",
        segments: [
          { label: a, length: soA },
          { label: b, length: soA + chenh },
        ],
      },
      hints: [
        {
          level: 1,
          text: `Con đọc lại đề: đề hỏi về ${b}, mà ${b} là người có nhiều hơn.`,
          speech: `Đề đang hỏi về bạn ${b}, và bạn ${b} là người có nhiều hơn nhé.`,
        },
        {
          level: 2,
          text: "Nhìn sơ đồ đoạn thẳng: đoạn của bạn được hỏi dài hơn hay ngắn hơn?",
          speech: "Con nhìn sơ đồ, đoạn của bạn được hỏi dài hơn hay ngắn hơn?",
          revealVisual: true,
        },
        chonViDu(soA + chenh, [
          {
            so: [20, 6, 26],
            text: "An có 20 cái kẹo, Bình nhiều hơn An 6 cái, vậy Bình có 20 + 6 = 26 cái.",
            speech: "Con xem bài tương tự. An có hai mươi cái kẹo, Bình nhiều hơn An sáu cái, thì Bình có hai mươi sáu cái.",
          },
          {
            so: [35, 8, 43],
            text: "An có 35 cái kẹo, Bình nhiều hơn An 8 cái, vậy Bình có 35 + 8 = 43 cái.",
            speech: "Con xem bài tương tự. An có ba mươi lăm cái kẹo, Bình nhiều hơn An tám cái, thì Bình có bốn mươi ba cái.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con xác định ai nhiều hơn, rồi mới chọn phép tính.",
          speech: "Con xác định ai nhiều hơn trước, rồi mới chọn phép tính.",
        },
      ],
      traps: [{ id: "BAY-NHIEU-HON-TRU", wrongAnswer: soA - chenh }],
    };
  },
};

/** Bài toán hai bước. */
const KD_009: Template = {
  id: "KD-009",
  version: 2,
  title: "Bài toán giải bằng hai phép tính",
  yccd: "T2.GT.02",
  grade: 2,
  term: 2,
  strand: "giai-toan",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Giải toán",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-11T15:20:00+07:00",
    templateVersion: 2,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const ban = r.pick(TEN_BAN);
    const nguoi = r.pick(NGUOI_LON);
    const dv = r.pick(DO_VAT);
    const dau = r.int(40, 90);
    const cho = r.int(5, 20);
    const nhan = r.int(5, 20);
    const answer = dau - cho + nhan;
    return {
      prompt: `${ban} có ${dau} ${dv.ten}. ${ban} cho bạn ${cho} ${dv.ten}, sau đó ${nguoi} cho ${ban} thêm ${nhan} ${dv.ten}. Hỏi bây giờ ${ban} có bao nhiêu ${dv.ten}?`,
      speech: `Bạn ${ban} có ${dau} ${dv.ten}. Bạn cho đi ${cho} ${dv.ten}, sau đó ${nguoi} cho thêm ${nhan} ${dv.ten}. Hỏi bây giờ bạn ${ban} có bao nhiêu ${dv.ten}?`,
      answer,
      unit: dv.dv,
      visual: { kind: "tia-so", from: 0, to: 120, step: 10, mark: dau },
      hints: [
        {
          level: 1,
          text: "Con đọc lại đề và kể ra: có mấy việc xảy ra với số đồ vật đó?",
          speech: "Con kể xem có mấy việc xảy ra nhé.",
        },
        {
          level: 2,
          text: "Nhìn tia số: cho bạn thì lùi về bên trái, được cho thêm thì tiến về bên phải.",
          speech: "Cho bạn thì lùi lại, được cho thêm thì tiến lên nhé con.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [30, 8, 22, 5, 27],
            text: "có 30 viên bi, cho đi 8 viên còn 22 viên, rồi được cho thêm 5 viên thành 27 viên.",
            speech: "Con xem bài tương tự. Có ba mươi viên bi, cho đi tám viên còn hai mươi hai, được thêm năm viên thành hai mươi bảy.",
          },
          {
            so: [60, 14, 46, 9, 55],
            text: "có 60 viên bi, cho đi 14 viên còn 46 viên, rồi được cho thêm 9 viên thành 55 viên.",
            speech: "Con xem bài tương tự. Có sáu mươi viên bi, cho đi mười bốn viên còn bốn mươi sáu, được thêm chín viên thành năm mươi lăm.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con tính xem sau khi cho bạn thì còn lại bao nhiêu đã, chưa vội tính tiếp.",
          speech: "Con tính xem sau khi cho bạn thì còn lại bao nhiêu đã nhé.",
        },
      ],
      // Làm tắt: chỉ làm một trong hai bước.
      traps: [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: dau - cho }],
    };
  },
};

/** Bài toán chia đều thành các phần bằng nhau. */
const KD_030: Template = {
  id: "KD-030",
  version: 1,
  title: "Bài toán chia đều",
  yccd: "T2.GT.01",
  grade: 2,
  term: 2,
  strand: "giai-toan",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Giải toán",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T11:30:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const soNhom = r.pick([2, 5] as const);
    const moiNhom = r.int(2, 9);
    const tong = soNhom * moiNhom;
    const dv = r.pick(DO_VAT);
    const nguoi = r.pick(NGUOI_LON);
    const ban = r.pick(TEN_BAN);
    return {
      prompt: `${nguoi[0].toUpperCase()}${nguoi.slice(1)} có ${tong} ${dv.ten}, chia đều cho ${ban} và các bạn, tất cả ${soNhom} người. Hỏi mỗi người được bao nhiêu ${dv.ten}?`,
      speech: `Có ${tong} ${dv.ten}, chia đều cho ${soNhom} người. Hỏi mỗi người được bao nhiêu ${dv.ten}?`,
      answer: moiNhom,
      unit: dv.dv,
      visual: { kind: "nhom-hinh", rows: soNhom, perRow: moiNhom, shape: "tron" },
      hints: [
        {
          level: 1,
          text: "Chia ĐỀU nghĩa là ai cũng được như nhau, không ai nhiều hơn ai. Đề hỏi MỖI người được bao nhiêu, không hỏi tất cả.",
          speech: "Chia đều nghĩa là ai cũng như nhau. Đề hỏi mỗi người được bao nhiêu nhé.",
        },
        {
          level: 2,
          text: "Nhìn hình: mỗi hàng là phần của một người. Con đếm số hình trong MỘT hàng thôi.",
          speech: "Mỗi hàng là phần của một người, con đếm một hàng thôi nhé.",
          revealVisual: true,
        },
        chonViDu(moiNhom, [
          {
            so: [12, 2, 6],
            text: "có 12 cái chia đều cho 2 người thì mỗi người được 6 cái.",
            speech: "Con xem bài tương tự. Mười hai cái chia đều cho hai người, mỗi người sáu cái.",
          },
          {
            so: [35, 5, 7],
            text: "có 35 cái chia đều cho 5 người thì mỗi người được 7 cái.",
            speech: "Con xem bài tương tự. Ba mươi lăm cái chia đều cho năm người, mỗi người bảy cái.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con lấy tất cả chia cho số người.",
          speech: "Con lấy tất cả chia cho số người nhé.",
        },
      ],
      // Trả lời tổng số thay vì phần của mỗi người.
      traps: [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: tong }],
    };
  },
};

/** Bài toán gấp lên nhiều lần, có lời văn. */
const KD_031: Template = {
  id: "KD-031",
  version: 1,
  title: "Bài toán gấp lên nhiều lần",
  yccd: "T2.GT.01",
  grade: 2,
  term: 2,
  strand: "giai-toan",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Giải toán",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T11:30:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const [a, b] = r.shuffle(TEN_BAN).slice(0, 2);
    const dv = r.pick(DO_VAT);
    const soA = r.int(3, 15);
    const lan = r.pick([2, 5] as const);
    const answer = soA * lan;
    return {
      prompt: `${a} có ${soA} ${dv.ten}. Số ${dv.ten} của ${b} gấp ${lan} lần số ${dv.ten} của ${a}. Hỏi ${b} có bao nhiêu ${dv.ten}?`,
      speech: `Bạn ${a} có ${soA} ${dv.ten}. Bạn ${b} có gấp ${lan} lần bạn ${a}. Hỏi bạn ${b} có bao nhiêu ${dv.ten}?`,
      answer,
      unit: dv.dv,
      visual: {
        kind: "doan-thang",
        segments: [
          { label: a, length: soA },
          { label: b, length: answer },
        ],
      },
      hints: [
        {
          level: 1,
          text: `Con đọc lại đề: đề hỏi về ${b}, và ${b} là người có NHIỀU hơn.`,
          speech: `Đề hỏi về bạn ${b}, và bạn ấy là người có nhiều hơn nhé.`,
        },
        {
          level: 2,
          text: "Nhìn sơ đồ: đoạn dưới dài gấp mấy lần đoạn trên? Đó chính là số lần đề cho.",
          speech: "Con nhìn sơ đồ, đoạn dưới dài gấp mấy lần đoạn trên?",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [4, 3, 12],
            text: "An có 4 cái, Bình gấp 3 lần An thì Bình có 4 × 3 = 12 cái.",
            speech: "Con xem bài tương tự. Bốn nhân ba bằng mười hai.",
          },
          {
            so: [9, 7, 63],
            text: "An có 9 cái, Bình gấp 7 lần An thì Bình có 9 × 7 = 63 cái.",
            speech: "Con xem bài tương tự. Chín nhân bảy bằng sáu mươi ba.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: gấp lên nhiều lần thì con dùng phép nhân, không dùng phép cộng.",
          speech: "Gấp lên nhiều lần thì con dùng phép nhân nhé.",
        },
      ],
      // "Gấp mấy lần" bị hiểu thành "nhiều hơn mấy cái".
      traps: [{ id: "BAY-NHIEU-HON-TRU", wrongAnswer: soA + lan }],
    };
  },
};

/** Bài toán hai bước: mua và trả lại tiền. */
const KD_032: Template = {
  id: "KD-032",
  version: 1,
  title: "Bài toán hai bước về tiền",
  yccd: "T2.GT.02",
  grade: 2,
  term: 2,
  strand: "giai-toan",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Giải toán",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T11:30:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const ban = r.pick(TEN_BAN);
    const nguoi = r.pick(NGUOI_LON);
    // Dùng đơn vị nghìn đồng cho số gọn, đúng cách sách giáo khoa lớp 2 làm.
    const mangDi = r.int(50, 95);
    const giaMon1 = r.int(10, 30);
    const giaMon2 = r.int(10, 30);
    const answer = mangDi - giaMon1 - giaMon2;
    if (answer <= 0) return KD_032.build(seed + 1);
    return {
      prompt: `${nguoi[0].toUpperCase()}${nguoi.slice(1)} đưa ${ban} ${mangDi} nghìn đồng đi chợ. ${ban} mua một quyển vở hết ${giaMon1} nghìn đồng và một hộp bút hết ${giaMon2} nghìn đồng. Hỏi ${ban} còn lại bao nhiêu nghìn đồng?`,
      speech: `Bạn ${ban} mang ${mangDi} nghìn đồng đi chợ, mua vở hết ${giaMon1} nghìn và mua bút hết ${giaMon2} nghìn. Hỏi còn lại bao nhiêu nghìn đồng?`,
      answer,
      unit: "nghìn đồng",
      visual: { kind: "tia-so", from: 0, to: 100, step: 10, mark: mangDi },
      hints: [
        {
          level: 1,
          text: "Con đọc lại đề và kể ra: bạn ấy mua mấy thứ? Mỗi thứ tiêu mất một ít tiền.",
          speech: "Bạn ấy mua mấy thứ hả con? Mỗi thứ tiêu mất một ít tiền.",
        },
        {
          level: 2,
          text: "Nhìn tia số: con đứng ở số tiền mang đi, rồi lùi lại hai lần, mỗi lần là một món đã mua.",
          speech: "Con đứng ở số tiền mang đi rồi lùi lại hai lần nhé.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [40, 12, 28, 15, 13],
            text: "mang 40 nghìn, mua hết 12 nghìn còn 28 nghìn, mua tiếp 15 nghìn thì còn 13 nghìn.",
            speech: "Con xem bài tương tự. Bốn mươi trừ mười hai còn hai mươi tám, trừ tiếp mười lăm còn mười ba.",
          },
          {
            so: [90, 24, 66, 17, 49],
            text: "mang 90 nghìn, mua hết 24 nghìn còn 66 nghìn, mua tiếp 17 nghìn thì còn 49 nghìn.",
            speech: "Con xem bài tương tự. Chín mươi trừ hai mươi tư còn sáu mươi sáu, trừ tiếp mười bảy còn bốn mươi chín.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con tính xem mua xong món thứ nhất thì còn bao nhiêu, chưa vội tính tiếp.",
          speech: "Con tính xem mua xong món thứ nhất còn bao nhiêu đã nhé.",
        },
      ],
      // Chỉ trừ một món rồi dừng.
      traps: [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: mangDi - giaMon1 }],
    };
  },
};

export const KHUON_DANG: Template[] = [KD_008, KD_009, KD_030, KD_031, KD_032];
