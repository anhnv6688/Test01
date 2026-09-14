import { Rng } from "../rng";
import type { BuiltItem, Template } from "../types";
import { chonViDu } from "./chung";

/**
 * Mạch Hình học — khuôn dạng bài.
 *
 * Quy tắc viết một khuôn dạng mới nằm ở ./chung.ts. Đọc phần đó trước khi thêm
 * vào tệp này.
 */

/** Đếm hình — dạy chiến lược đếm có hệ thống. */
const KD_010: Template = {
  id: "KD-010",
  version: 1,
  title: "Đếm số hình trong hình vẽ ghép",
  yccd: "T2.HH.01",
  grade: 2,
  term: 2,
  strand: "hinh-hoc",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Hình học",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-10T11:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const rows = r.int(2, 4);
    const perRow = r.int(3, 6);
    const shape = r.pick(["tron", "vuong", "tam-giac"] as const);
    const ten = shape === "tron" ? "hình tròn" : shape === "vuong" ? "hình vuông" : "hình tam giác";
    return {
      prompt: `Trong hình bên có tất cả bao nhiêu ${ten}?`,
      speech: `Con đếm xem trong hình bên có tất cả bao nhiêu ${ten} nhé.`,
      answer: rows * perRow,
      unit: "hình",
      visual: { kind: "nhom-hinh", rows, perRow, shape },
      hints: [
        {
          level: 1,
          text: "Con đừng đếm lung tung. Con đếm từ hàng trên cùng, hết hàng rồi mới xuống hàng dưới.",
          speech: "Con đếm từ hàng trên cùng, hết hàng rồi mới xuống hàng dưới nhé.",
        },
        {
          level: 2,
          text: "Nhìn hình: con đếm một hàng có mấy hình, rồi đếm xem có mấy hàng.",
          speech: "Con đếm một hàng có mấy hình, rồi xem có mấy hàng.",
          revealVisual: true,
        },
        chonViDu(rows * perRow, [
          {
            so: [3, 4, 12],
            text: "3 hàng, mỗi hàng 4 hình thì có 4 + 4 + 4 bằng 12 hình.",
            speech: "Con xem bài tương tự. Ba hàng, mỗi hàng bốn hình thì có mười hai hình.",
          },
          {
            so: [5, 7, 35],
            text: "5 hàng, mỗi hàng 7 hình thì có 7 nhân 5 bằng 35 hình.",
            speech: "Con xem bài tương tự. Năm hàng, mỗi hàng bảy hình thì có ba mươi lăm hình.",
          },
        ]),
        {
          level: 4,
          text: `Bước đầu tiên: con đếm riêng hàng trên cùng xem có mấy ${ten}.`,
          speech: "Con đếm riêng hàng trên cùng trước nhé.",
        },
      ],
      // Đếm thiếu một hàng là biểu hiện hay gặp của đếm lộn xộn.
      traps: [{ id: "BAY-DEM-TRUNG", wrongAnswer: (rows - 1) * perRow }],
    };
  },
};

/** Độ dài đường gấp khúc. */
const KD_012: Template = {
  id: "KD-012",
  version: 1,
  title: "Độ dài đường gấp khúc",
  yccd: "T2.HH.01",
  grade: 2,
  term: 2,
  strand: "hinh-hoc",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Hình học",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-11T16:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const n = r.int(2, 3);
    const doan: { label: string; length: number }[] = [];
    const nhan = ["AB", "BC", "CD"];
    for (let i = 0; i < n; i++) doan.push({ label: nhan[i], length: r.int(4, 25) });
    const answer = doan.reduce((s, d) => s + d.length, 0);
    const moTa = doan.map((d) => `${d.label} dài ${d.length} cm`).join(", ");
    return {
      prompt: `Đường gấp khúc có các đoạn: ${moTa}. Hỏi đường gấp khúc đó dài bao nhiêu xăng-ti-mét?`,
      speech: `Đường gấp khúc có các đoạn ${moTa}. Hỏi đường gấp khúc đó dài bao nhiêu xăng ti mét?`,
      answer,
      unit: "cm",
      visual: { kind: "doan-thang", segments: doan },
      hints: [
        {
          level: 1,
          text: "Con đọc lại đề: độ dài đường gấp khúc là độ dài của tất cả các đoạn gộp lại.",
          speech: "Độ dài đường gấp khúc là độ dài tất cả các đoạn gộp lại nhé con.",
        },
        {
          level: 2,
          text: "Nhìn hình: con nối các đoạn lại thành một đoạn thẳng dài.",
          speech: "Con hình dung nối các đoạn lại thành một đoạn thẳng dài.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [6, 9, 15],
            text: "đường gấp khúc có hai đoạn dài 6 cm và 9 cm thì dài 6 + 9 = 15 cm.",
            speech: "Con xem bài tương tự. Hai đoạn dài sáu và chín xăng ti mét thì đường gấp khúc dài mười lăm xăng ti mét.",
          },
          {
            so: [12, 20, 32],
            text: "đường gấp khúc có hai đoạn dài 12 cm và 20 cm thì dài 12 + 20 = 32 cm.",
            speech: "Con xem bài tương tự. Hai đoạn dài mười hai và hai mươi xăng ti mét thì đường gấp khúc dài ba mươi hai xăng ti mét.",
          },
        ]),
        {
          level: 4,
          text: `Bước đầu tiên: con cộng ${doan[0].label} với ${doan[1].label} trước đã.`,
          speech: "Con cộng hai đoạn đầu tiên trước đã nhé.",
        },
      ],
      traps: n === 3 ? [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: doan[0].length + doan[1].length }] : [],
    };
  },
};


/** Chu vi hình tam giác. */
const KD_027: Template = {
  id: "KD-027",
  version: 1,
  title: "Chu vi hình tam giác",
  yccd: "T2.HH.02",
  grade: 2,
  term: 2,
  strand: "hinh-hoc",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Hình học",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T11:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const canh = [r.int(3, 20), r.int(3, 20), r.int(3, 20)];
    const answer = canh[0] + canh[1] + canh[2];
    return {
      prompt: `Hình tam giác ABC có ba cạnh dài ${canh[0]} cm, ${canh[1]} cm và ${canh[2]} cm. Hỏi chu vi hình tam giác đó là bao nhiêu xăng-ti-mét?`,
      speech: `Hình tam giác có ba cạnh dài ${canh[0]}, ${canh[1]} và ${canh[2]} xăng ti mét. Hỏi chu vi bao nhiêu xăng ti mét?`,
      answer,
      unit: "cm",
      visual: {
        kind: "doan-thang",
        segments: [
          { label: "AB", length: canh[0] },
          { label: "BC", length: canh[1] },
          { label: "CA", length: canh[2] },
        ],
      },
      hints: [
        {
          level: 1,
          text: "Chu vi là quãng đường đi hết một vòng quanh hình. Con đi hết ba cạnh là về chỗ cũ.",
          speech: "Chu vi là đi hết một vòng quanh hình nhé con.",
        },
        {
          level: 2,
          text: "Nhìn ba đoạn thẳng bên cạnh: con nối cả ba lại thành một đoạn dài, đó chính là chu vi.",
          speech: "Con nối cả ba đoạn lại thành một đoạn dài, đó là chu vi.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [4, 6, 9, 19],
            text: "tam giác có ba cạnh 4 cm, 6 cm và 9 cm thì chu vi là 4 + 6 + 9 = 19 cm.",
            speech: "Con xem bài tương tự. Bốn cộng sáu cộng chín bằng mười chín xăng ti mét.",
          },
          {
            so: [11, 15, 22, 48],
            text: "tam giác có ba cạnh 11 cm, 15 cm và 22 cm thì chu vi là 11 + 15 + 22 = 48 cm.",
            speech: "Con xem bài tương tự. Mười một cộng mười lăm cộng hai mươi hai bằng bốn mươi tám.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con cộng hai cạnh đầu trước đã, rồi mới cộng tiếp cạnh thứ ba.",
          speech: "Con cộng hai cạnh đầu trước rồi mới cộng cạnh thứ ba nhé.",
        },
      ],
      // Quên mất một cạnh — lỗi hay gặp nhất ở dạng chu vi.
      traps: [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: canh[0] + canh[1] }],
    };
  },
};

/** Chu vi hình tứ giác. */
const KD_028: Template = {
  id: "KD-028",
  version: 1,
  title: "Chu vi hình tứ giác",
  yccd: "T2.HH.02",
  grade: 2,
  term: 2,
  strand: "hinh-hoc",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Hình học",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T11:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const canh = [r.int(3, 18), r.int(3, 18), r.int(3, 18), r.int(3, 18)];
    const answer = canh.reduce((x, y) => x + y, 0);
    return {
      prompt: `Hình tứ giác MNPQ có bốn cạnh dài ${canh[0]} cm, ${canh[1]} cm, ${canh[2]} cm và ${canh[3]} cm. Hỏi chu vi hình tứ giác đó là bao nhiêu xăng-ti-mét?`,
      speech: `Hình tứ giác có bốn cạnh dài ${canh[0]}, ${canh[1]}, ${canh[2]} và ${canh[3]} xăng ti mét. Hỏi chu vi bao nhiêu?`,
      answer,
      unit: "cm",
      visual: {
        kind: "doan-thang",
        segments: [
          { label: "MN", length: canh[0] },
          { label: "NP", length: canh[1] },
          { label: "PQ", length: canh[2] },
          { label: "QM", length: canh[3] },
        ],
      },
      hints: [
        {
          level: 1,
          text: "Tứ giác có BỐN cạnh. Con đếm lại xem đề cho mấy số đo, đừng bỏ sót cạnh nào.",
          speech: "Tứ giác có bốn cạnh, con đừng bỏ sót cạnh nào nhé.",
        },
        {
          level: 2,
          text: "Nhìn bốn đoạn thẳng bên cạnh: con nối cả bốn lại thành một đoạn dài.",
          speech: "Con nối cả bốn đoạn lại thành một đoạn dài nhé.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [3, 5, 7, 9, 24],
            text: "tứ giác có bốn cạnh 3 cm, 5 cm, 7 cm và 9 cm thì chu vi là 24 cm.",
            speech: "Con xem bài tương tự. Ba cộng năm cộng bảy cộng chín bằng hai mươi bốn.",
          },
          {
            so: [12, 14, 16, 18, 60],
            text: "tứ giác có bốn cạnh 12 cm, 14 cm, 16 cm và 18 cm thì chu vi là 60 cm.",
            speech: "Con xem bài tương tự. Mười hai cộng mười bốn cộng mười sáu cộng mười tám bằng sáu mươi.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con cộng dần từng cạnh một, cộng xong cạnh nào thì gạch cạnh đó đi cho khỏi sót.",
          speech: "Con cộng dần từng cạnh, cộng xong thì gạch đi cho khỏi sót nhé.",
        },
      ],
      traps: [{ id: "BAY-DEM-TRUNG", wrongAnswer: canh[0] + canh[1] + canh[2] }],
    };
  },
};

/** Đếm số đoạn thẳng trong một hình. */
const KD_029: Template = {
  id: "KD-029",
  version: 1,
  title: "Đếm số đoạn thẳng",
  yccd: "T2.HH.03",
  grade: 2,
  term: 2,
  strand: "hinh-hoc",
  ghiChuKhongGian:
    "Số điểm chỉ chạy từ ba tới tám, vì quá tám điểm thì đếm đoạn thẳng vượt " +
    "sức lớp 2. Không gian nhỏ là ràng buộc sư phạm, không phải thiếu sót.",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Hình học",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T11:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    // n điểm thẳng hàng tạo ra n(n-1)/2 đoạn thẳng.
    const soDiem = r.int(3, 8);
    const answer = (soDiem * (soDiem - 1)) / 2;
    const nhan = ["A", "B", "C", "D", "E", "G", "H", "K"].slice(0, soDiem).join(", ");
    return {
      prompt: `Trên một đường thẳng có ${soDiem} điểm ${nhan}. Hỏi có tất cả bao nhiêu đoạn thẳng?`,
      speech: `Trên một đường thẳng có ${soDiem} điểm. Hỏi có tất cả bao nhiêu đoạn thẳng?`,
      answer,
      unit: "đoạn",
      visual: { kind: "cay-va-khoang", trees: soDiem },
      hints: [
        {
          level: 1,
          text: "Cứ hai điểm bất kỳ là tạo ra một đoạn thẳng. Con đếm cho hết mọi cặp, đừng chỉ đếm các đoạn nằm cạnh nhau.",
          speech: "Cứ hai điểm bất kỳ là một đoạn thẳng nhé con.",
        },
        {
          level: 2,
          text: "Nhìn hình: con đếm có thứ tự — từ điểm đầu nối tới từng điểm còn lại, rồi mới sang điểm thứ hai.",
          speech: "Con đếm có thứ tự, từ điểm đầu nối tới từng điểm còn lại nhé.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [4, 6],
            text: "có 4 điểm thì được 6 đoạn thẳng. Cách đếm: từ điểm đầu nối sang mọi điểm còn lại, rồi sang điểm thứ hai và bỏ qua đoạn đã đếm.",
            speech: "Con xem bài tương tự. Bốn điểm thì được sáu đoạn thẳng.",
          },
          {
            so: [7, 21],
            text: "có 7 điểm thì được 21 đoạn thẳng. Cách đếm: từ điểm đầu nối sang mọi điểm còn lại, rồi sang điểm thứ hai và bỏ qua đoạn đã đếm.",
            speech: "Con xem bài tương tự. Bảy điểm thì được hai mươi mốt đoạn thẳng.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con đếm xem từ điểm đầu tiên nối được tới mấy điểm khác.",
          speech: "Con đếm từ điểm đầu tiên nối được tới mấy điểm khác nhé.",
        },
      ],
      // Chỉ đếm các đoạn nằm sát nhau, bỏ qua các đoạn dài bắc qua.
      traps: [{ id: "BAY-DEM-TRUNG", wrongAnswer: soDiem - 1 }],
    };
  },
};

export const KHUON_DANG: Template[] = [KD_010, KD_012, KD_027, KD_028, KD_029];
