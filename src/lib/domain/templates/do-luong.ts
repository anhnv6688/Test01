import { Rng } from "../rng";
import {
  BOI_CANH, CAY, DO_VAT_CAN, DO_VAT_DONG, NGUOI_LON, TEN_BAN, THU_TRONG_TUAN,
} from "../names";
import type { BuiltItem, Template } from "../types";
import { chonViDu } from "./chung";

/**
 * Mạch Đo lường — khuôn dạng bài.
 *
 * Quy tắc viết một khuôn dạng mới nằm ở ./chung.ts. Đọc phần đó trước khi thêm
 * vào tệp này.
 */

/** Đổi đơn vị đo độ dài — bẫy kinh điển của bộ đề. */
const KD_006: Template = {
  id: "KD-006",
  version: 4,
  title: "Đổi đơn vị đo độ dài",
  yccd: "T2.DL.01",
  grade: 2,
  term: 2,
  strand: "do-luong",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Đo lường",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-10T10:00:00+07:00",
    templateVersion: 4,
    note: "Bẫy đơn vị là lỗi mất điểm nhiều nhất trong bộ ảnh đề gốc.",
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const soMet = r.int(2, 9);
    const themCm = r.pick([0, 0, 20, 30, 50] as const);
    const tongCm = soMet * 100 + themCm;
    const ban = r.pick(TEN_BAN);
    const doiTuong = r.pick(["sợi dây", "tấm vải", "đoạn ruy băng", "hàng rào"] as const);
    return {
      prompt: `${ban} có một ${doiTuong} dài ${tongCm} cm. Hỏi ${doiTuong} đó dài bao nhiêu mét và bao nhiêu xăng-ti-mét? Con điền số mét vào ô trả lời.`,
      speech: `Bạn ${ban} có một ${doiTuong} dài ${tongCm} xăng-ti-mét. Hỏi dài bao nhiêu mét? Con điền số mét thôi nhé.`,
      answer: soMet,
      unit: "m",
      visual: { kind: "thuoc-do", totalCm: tongCm, markCm: soMet * 100 },
      hints: [
        {
          level: 1,
          text: "Con đọc lại câu hỏi cuối cùng: đề cho xăng-ti-mét nhưng đang hỏi con bao nhiêu MÉT.",
          speech: "Đề cho xăng ti mét nhưng đang hỏi con bao nhiêu mét nhé.",
        },
        {
          level: 2,
          text: "Nhìn thước: mỗi đoạn tô đậm là một mét, tức là một trăm xăng-ti-mét.",
          speech: "Mỗi đoạn tô đậm trên thước là một mét, bằng một trăm xăng ti mét.",
          revealVisual: true,
        },
        chonViDu(soMet, [
          {
            so: [320, 3, 20],
            text: "320 cm thì đổi được 3 m và còn dư 20 cm.",
            speech: "Con xem bài tương tự. Ba trăm hai mươi xăng ti mét bằng ba mét và hai mươi xăng ti mét.",
          },
          {
            so: [450, 4, 50],
            text: "450 cm thì đổi được 4 m và còn dư 50 cm.",
            speech: "Con xem bài tương tự. Bốn trăm năm mươi xăng ti mét bằng bốn mét và năm mươi xăng ti mét.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con xem trong số đã cho có bao nhiêu lần một trăm.",
          speech: "Con xem trong số đã cho có bao nhiêu lần một trăm nhé.",
        },
      ],
      // Mắc bẫy đơn vị: chép luôn số xăng-ti-mét vào ô hỏi mét.
      traps: [{ id: "BAY-DON-VI", wrongAnswer: tongCm }],
    };
  },
};

/** Cây và khoảng — lỗi lệch một đơn vị. */
const KD_007: Template = {
  id: "KD-007",
  version: 2,
  title: "Số cây và số khoảng cách",
  yccd: "T2.DL.01",
  grade: 2,
  term: 2,
  strand: "do-luong",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Đo lường",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-10T10:30:00+07:00",
    templateVersion: 2,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const soCay = r.int(4, 8);
    const khoang = r.pick([2, 3, 4, 5] as const);
    const loai = r.pick(CAY);
    const canh = r.pick(BOI_CANH);
    const answer = (soCay - 1) * khoang;
    return {
      prompt: `${canh[0].toUpperCase()}${canh.slice(1)} người ta trồng ${soCay} ${loai} thành một hàng thẳng, hai ${loai} cạnh nhau cách nhau ${khoang} m. Hỏi ${loai} đầu hàng cách ${loai} cuối hàng bao nhiêu mét?`,
      speech: `Người ta trồng ${soCay} ${loai} thành một hàng, hai cây cạnh nhau cách nhau ${khoang} mét. Hỏi cây đầu hàng cách cây cuối hàng bao nhiêu mét?`,
      answer,
      unit: "m",
      visual: { kind: "cay-va-khoang", trees: soCay },
      hints: [
        {
          level: 1,
          text: "Con đọc lại đề: đề hỏi khoảng cách từ cây đầu tới cây cuối, không hỏi có mấy cây.",
          speech: "Đề hỏi khoảng cách từ cây đầu tới cây cuối nhé con.",
        },
        {
          level: 2,
          text: "Nhìn hình: con đếm xem giữa các cây có mấy khoảng trống. Số khoảng không bằng số cây đâu.",
          speech: "Con đếm xem giữa các cây có mấy khoảng trống nhé.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [3, 10, 2, 20],
            text: "3 cột đèn cách nhau 10 m thì chỉ có 2 khoảng, nên cột đầu cách cột cuối 20 m.",
            speech: "Con xem bài tương tự. Ba cột đèn cách nhau mười mét thì cột đầu cách cột cuối hai mươi mét.",
          },
          {
            so: [4, 6, 18],
            text: "4 cái cây cách nhau 6 m thì chỉ có 3 khoảng, nên cây đầu cách cây cuối 18 m.",
            speech: "Con xem bài tương tự. Bốn cái cây cách nhau sáu mét thì cây đầu cách cây cuối mười tám mét.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con đếm số khoảng trống trước, rồi mới nhân với khoảng cách mỗi đoạn.",
          speech: "Con đếm số khoảng trống trước nhé.",
        },
      ],
      traps: [{ id: "BAY-KHOANG-CACH", wrongAnswer: soCay * khoang }],
    };
  },
};

/** Xem giờ. */
const KD_011: Template = {
  id: "KD-011",
  version: 1,
  title: "Xem giờ trên đồng hồ kim",
  yccd: "T2.DL.02",
  grade: 2,
  term: 2,
  strand: "do-luong",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Đo lường",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-10T11:20:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const hour = r.int(1, 12);
    const minute = r.pick([0, 15, 30] as const);
    return {
      prompt: `Đồng hồ bên chỉ mấy giờ? Con điền số giờ vào ô trả lời.`,
      speech: `Con nhìn đồng hồ bên cạnh và cho biết đồng hồ chỉ mấy giờ nhé. Con chỉ cần điền số giờ thôi.`,
      answer: hour,
      unit: "giờ",
      visual: { kind: "dong-ho", hour, minute },
      hints: [
        {
          level: 1,
          text: "Con nhớ lại: kim ngắn chỉ giờ, kim dài chỉ phút. Đề hỏi số giờ nên con nhìn kim ngắn.",
          speech: "Kim ngắn chỉ giờ, kim dài chỉ phút. Đề hỏi giờ nên con nhìn kim ngắn nhé.",
        },
        {
          level: 2,
          text: "Nhìn đồng hồ: kim ngắn đang ở số nào, hoặc đã đi qua số nào?",
          speech: "Kim ngắn đang ở số nào, hoặc đã đi qua số nào hả con?",
          revealVisual: true,
        },
        chonViDu(hour, [
          {
            so: [4, 6, 30],
            text: "kim ngắn đã đi qua số 4 một chút, kim dài chỉ số 6, thì đó là 4 giờ 30 phút.",
            speech: "Con xem bài tương tự. Kim ngắn qua số bốn, kim dài chỉ số sáu, là bốn giờ ba mươi phút.",
          },
          {
            so: [9, 3, 15],
            text: "kim ngắn đã đi qua số 9 một chút, kim dài chỉ số 3, thì đó là 9 giờ 15 phút.",
            speech: "Con xem bài tương tự. Kim ngắn qua số chín, kim dài chỉ số ba, là chín giờ mười lăm phút.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con tìm kim ngắn hơn trong hai kim, đừng nhìn kim dài vội.",
          speech: "Con tìm kim ngắn hơn trong hai kim trước nhé.",
        },
      ],
      // Đọc nhầm sang số mà kim dài đang chỉ.
      traps: minute === 0 ? [] : [{ id: "BAY-DOC-GIO", wrongAnswer: minute / 5 }],
    };
  },
};

/** Cộng trừ hai số đo cùng đơn vị độ dài. */
const KD_022: Template = {
  id: "KD-022",
  version: 1,
  title: "Cộng trừ số đo độ dài",
  yccd: "T2.DL.01",
  grade: 2,
  term: 2,
  strand: "do-luong",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Đo lường",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T09:30:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const dv = r.pick(["cm", "dm", "m"] as const);
    const cong = r.next() < 0.5;
    const a = r.int(15, 60);
    const b = cong ? r.int(5, 35) : r.int(5, a - 5);
    const answer = cong ? a + b : a - b;
    return {
      prompt: `Tính: ${a} ${dv} ${cong ? "+" : "−"} ${b} ${dv} = ?  Con điền số rồi nhớ đơn vị là ${dv}.`,
      speech: `Con tính ${a} ${dv} ${cong ? "cộng" : "trừ"} ${b} ${dv} nhé.`,
      answer,
      unit: dv,
      visual: {
        kind: "doan-thang",
        segments: [
          { label: "đoạn 1", length: a },
          { label: "đoạn 2", length: b },
        ],
      },
      hints: [
        {
          level: 1,
          text: "Hai số đo này cùng một đơn vị, nên con tính hai con số như bình thường rồi viết lại đơn vị vào sau.",
          speech: "Hai số đo cùng đơn vị nên con tính bình thường rồi viết đơn vị vào sau nhé.",
        },
        {
          level: 2,
          text: "Nhìn sơ đồ hai đoạn thẳng: phép cộng là nối hai đoạn lại, phép trừ là bớt đi một phần.",
          speech: "Cộng là nối hai đoạn lại, trừ là bớt đi một phần nhé con.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [12, 7, 19],
            text: "12 cm + 7 cm. Con tính 12 cộng 7 được 19, rồi viết đơn vị vào thành 19 cm.",
            speech: "Con xem bài tương tự. Mười hai xăng ti mét cộng bảy xăng ti mét bằng mười chín xăng ti mét.",
          },
          {
            so: [84, 26, 58],
            text: "84 m − 26 m. Con tính 84 trừ 26 được 58, rồi viết đơn vị vào thành 58 m.",
            speech: "Con xem bài tương tự. Tám mươi tư mét trừ hai mươi sáu mét bằng năm mươi tám mét.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con che đơn vị đi, chỉ tính hai con số thôi. Đơn vị viết lại sau cùng.",
          speech: "Con che đơn vị đi, tính hai con số trước nhé.",
        },
      ],
      traps: [],
    };
  },
};

/** Khối lượng đo bằng ki-lô-gam. */
const KD_023: Template = {
  id: "KD-023",
  version: 1,
  title: "Khối lượng đo bằng ki-lô-gam",
  yccd: "T2.DL.03",
  grade: 2,
  term: 2,
  strand: "do-luong",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Đo lường",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T09:30:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const vat = r.pick(DO_VAT_CAN);
    const nguoi = r.pick(NGUOI_LON);
    const a = r.int(5, 40);
    const b = r.int(3, 25);
    const cong = r.next() < 0.5;
    const answer = cong ? a + b : Math.max(a, b) - Math.min(a, b);
    return {
      prompt: cong
        ? `${nguoi[0].toUpperCase()}${nguoi.slice(1)} mua một ${vat.ten} nặng ${a} kg và một ${vat.ten} nữa nặng ${b} kg. Hỏi cả hai nặng bao nhiêu ki-lô-gam?`
        : `${nguoi[0].toUpperCase()}${nguoi.slice(1)} có một ${vat.ten} nặng ${Math.max(a, b)} kg. ${nguoi[0].toUpperCase()}${nguoi.slice(1)} dùng hết ${Math.min(a, b)} kg. Hỏi còn lại bao nhiêu ki-lô-gam?`,
      speech: cong
        ? `Một ${vat.ten} nặng ${a} ki lô gam, một ${vat.ten} nữa nặng ${b} ki lô gam. Hỏi cả hai nặng bao nhiêu ki lô gam?`
        : `Một ${vat.ten} nặng ${Math.max(a, b)} ki lô gam, dùng hết ${Math.min(a, b)} ki lô gam. Hỏi còn lại bao nhiêu ki lô gam?`,
      answer,
      unit: "kg",
      visual: {
        kind: "doan-thang",
        segments: [
          { label: "cái thứ nhất", length: Math.max(a, b) },
          { label: "cái thứ hai", length: Math.min(a, b) },
        ],
      },
      hints: [
        {
          level: 1,
          text: `Con đọc lại đề: ${cong ? "gộp cả hai lại thì nặng hơn hay nhẹ hơn?" : "dùng bớt đi rồi thì còn nhiều hơn hay ít hơn lúc đầu?"}`,
          speech: cong
            ? "Gộp cả hai lại thì nặng hơn hay nhẹ hơn hả con?"
            : "Dùng bớt đi rồi thì còn nhiều hơn hay ít hơn lúc đầu?",
        },
        {
          level: 2,
          text: "Nhìn sơ đồ: mỗi đoạn là một khối lượng. Con so hai đoạn rồi nghĩ xem nên gộp hay nên bớt.",
          speech: "Con nhìn sơ đồ, so hai đoạn rồi nghĩ xem nên gộp hay nên bớt.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [9, 4, 13],
            text: "một bao nặng 9 kg, một bao nặng 4 kg thì cả hai nặng 9 + 4 = 13 kg.",
            speech: "Con xem bài tương tự. Chín ki lô gam cộng bốn ki lô gam bằng mười ba ki lô gam.",
          },
          {
            so: [52, 27, 79],
            text: "một thùng nặng 52 kg, một thùng nặng 27 kg thì cả hai nặng 52 + 27 = 79 kg.",
            speech: "Con xem bài tương tự. Năm mươi hai cộng hai mươi bảy bằng bảy mươi chín ki lô gam.",
          },
        ]),
        {
          level: 4,
          text: `Bước đầu tiên: con viết phép tính ra đã, dùng dấu ${cong ? "cộng" : "trừ"}, rồi mới tính.`,
          speech: "Con viết phép tính ra trước rồi mới tính nhé.",
        },
      ],
      traps: cong ? [] : [{ id: "BAY-NHIEU-HON-TRU", wrongAnswer: a + b }],
    };
  },
};

/** Dung tích đo bằng lít. */
const KD_024: Template = {
  id: "KD-024",
  version: 1,
  title: "Dung tích đo bằng lít",
  yccd: "T2.DL.03",
  grade: 2,
  term: 2,
  strand: "do-luong",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Đo lường",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T10:30:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const vat = r.pick(DO_VAT_DONG);
    const moiCai = r.int(2, 9);
    const soCai = r.int(2, 6);
    const answer = moiCai * soCai;
    return {
      prompt: `Mỗi ${vat.ten} đựng được ${moiCai} l. Hỏi ${soCai} ${vat.dv} như thế đựng được bao nhiêu lít?`,
      speech: `Mỗi ${vat.ten} đựng được ${moiCai} lít. Hỏi ${soCai} ${vat.dv} như thế đựng được bao nhiêu lít?`,
      answer,
      unit: "l",
      visual: { kind: "nhom-hinh", rows: soCai, perRow: moiCai, shape: "vuong" },
      hints: [
        {
          level: 1,
          text: "Mỗi cái đựng như nhau, nên con không phải cộng từng cái một — đây là bài nhân.",
          speech: "Mỗi cái đựng như nhau nên đây là bài nhân nhé con.",
        },
        {
          level: 2,
          text: "Nhìn hình: mỗi hàng là một cái, mỗi ô vuông là một lít. Con đếm tổng số ô.",
          speech: "Mỗi hàng là một cái, mỗi ô vuông là một lít nhé.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [3, 4, 12],
            text: "mỗi can đựng 3 l, có 4 can thì đựng được 3 × 4 = 12 l.",
            speech: "Con xem bài tương tự. Ba lít nhân bốn can bằng mười hai lít.",
          },
          {
            so: [7, 5, 35],
            text: "mỗi xô đựng 7 l, có 5 xô thì đựng được 7 × 5 = 35 l.",
            speech: "Con xem bài tương tự. Bảy lít nhân năm xô bằng ba mươi lăm lít.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con lấy số lít của một cái, nhân với số cái.",
          speech: "Con lấy số lít của một cái nhân với số cái nhé.",
        },
      ],
      traps: [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: moiCai + soCai }],
    };
  },
};

/** Tính khoảng thời gian giữa hai mốc giờ. */
const KD_025: Template = {
  id: "KD-025",
  version: 1,
  title: "Tính khoảng thời gian",
  yccd: "T2.DL.02",
  grade: 2,
  term: 2,
  strand: "do-luong",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Đo lường",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T10:30:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const batDau = r.int(1, 8);
    const keoDai = r.int(1, 4);
    const ketThuc = batDau + keoDai;
    const ban = r.pick(TEN_BAN);
    const viec = r.pick(["học bài", "tập đàn", "chơi ở sân", "đọc truyện"] as const);
    return {
      prompt: `${ban} ${viec} từ ${batDau} giờ đến ${ketThuc} giờ. Hỏi ${ban} ${viec} trong bao nhiêu giờ?`,
      speech: `Bạn ${ban} ${viec} từ ${batDau} giờ đến ${ketThuc} giờ. Hỏi bạn ấy ${viec} trong bao nhiêu giờ?`,
      answer: keoDai,
      unit: "giờ",
      visual: { kind: "tia-so", from: 0, to: 12, step: 1, mark: batDau },
      hints: [
        {
          level: 1,
          text: "Đề hỏi KHOẢNG thời gian, tức là bao lâu, chứ không hỏi lúc mấy giờ.",
          speech: "Đề hỏi bao lâu, chứ không hỏi lúc mấy giờ nhé con.",
        },
        {
          level: 2,
          text: "Nhìn tia số: con đặt ngón tay ở giờ bắt đầu rồi đếm từng bước tới giờ kết thúc.",
          speech: "Con đặt ngón tay ở giờ bắt đầu rồi đếm từng bước tới giờ kết thúc.",
          revealVisual: true,
        },
        chonViDu(keoDai, [
          {
            so: [7, 9, 2],
            text: "từ 7 giờ đến 9 giờ thì được 2 giờ, vì 9 trừ 7 bằng 2.",
            speech: "Con xem bài tương tự. Từ bảy giờ đến chín giờ là hai giờ.",
          },
          {
            so: [4, 10, 6],
            text: "từ 4 giờ đến 10 giờ thì được 6 giờ, vì 10 trừ 4 bằng 6.",
            speech: "Con xem bài tương tự. Từ bốn giờ đến mười giờ là sáu giờ.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con lấy giờ kết thúc trừ đi giờ bắt đầu.",
          speech: "Con lấy giờ kết thúc trừ giờ bắt đầu nhé.",
        },
      ],
      // Trẻ hay trả lời luôn giờ kết thúc thay vì khoảng thời gian.
      traps: [{ id: "BAY-DOC-GIO", wrongAnswer: ketThuc }],
    };
  },
};

/** Ngày trong tuần. */
const KD_026: Template = {
  id: "KD-026",
  version: 1,
  title: "Ngày trong tuần",
  yccd: "T2.DL.04",
  grade: 2,
  term: 2,
  strand: "do-luong",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Đo lường",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T10:30:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const ngay = r.int(1, 24);
    const them = r.int(1, 6);
    const answer = ngay + them;
    const thu = THU_TRONG_TUAN[r.int(0, 6)];
    return {
      prompt: `Hôm nay là ${thu}, ngày ${ngay} trong tháng. Hỏi ${them} ngày nữa là ngày bao nhiêu?`,
      speech: `Hôm nay là ${thu}, ngày ${ngay}. Hỏi ${them} ngày nữa là ngày bao nhiêu?`,
      answer,
      unit: "ngày",
      visual: { kind: "tia-so", from: Math.max(1, ngay - 2), to: ngay + 8, step: 1, mark: ngay },
      hints: [
        {
          level: 1,
          text: "Đề hỏi NGÀY bao nhiêu, không hỏi thứ mấy. Con để ý chỗ này nhé.",
          speech: "Đề hỏi ngày bao nhiêu, không hỏi thứ mấy nhé con.",
        },
        {
          level: 2,
          text: "Nhìn tia số: con đặt ngón tay ở ngày hôm nay rồi đếm tiến từng ngày một.",
          speech: "Con đặt ngón tay ở ngày hôm nay rồi đếm tiến lên nhé.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [8, 3, 11],
            text: "hôm nay là ngày 8, thì 3 ngày nữa là ngày 11.",
            speech: "Con xem bài tương tự. Hôm nay ngày tám thì ba ngày nữa là ngày mười một.",
          },
          {
            so: [19, 5, 24],
            text: "hôm nay là ngày 19, thì 5 ngày nữa là ngày 24.",
            speech: "Con xem bài tương tự. Hôm nay ngày mười chín thì năm ngày nữa là ngày hai mươi tư.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con cộng số ngày hôm nay với số ngày phải chờ thêm.",
          speech: "Con cộng ngày hôm nay với số ngày chờ thêm nhé.",
        },
      ],
      // Đếm cả ngày hôm nay thành một ngày chờ — lỗi lệch một đơn vị quen thuộc.
      traps: [{ id: "BAY-KHOANG-CACH", wrongAnswer: answer - 1 }],
    };
  },
};

export const KHUON_DANG: Template[] = [
  KD_006, KD_007, KD_011, KD_022, KD_023, KD_024, KD_025, KD_026,
];
