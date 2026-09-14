import { Rng } from "../rng";
import { DO_VAT, TEN_BAN } from "../names";
import type { BuiltItem, Template } from "../types";
import { chonViDu } from "./chung";

/**
 * Mạch Số và phép tính — khuôn dạng bài.
 *
 * Quy tắc viết một khuôn dạng mới nằm ở ./chung.ts. Đọc phần đó trước khi thêm
 * vào tệp này.
 */

/** Cộng có nhớ trong phạm vi 100. */
const KD_001: Template = {
  id: "KD-001",
  version: 3,
  title: "Cộng có nhớ trong phạm vi 100",
  yccd: "T2.SPT.02",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-10T09:00:00+07:00",
    templateVersion: 3,
    note: "Đã kiểm tra ràng buộc luôn có nhớ ở cột đơn vị.",
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    // Ràng buộc: cột đơn vị luôn vượt 9 để bài nào cũng có nhớ.
    const donViA = r.int(4, 9);
    const donViB = r.int(10 - donViA, 9);
    const chucA = r.int(1, 4);
    const chucB = r.int(1, 9 - chucA);
    const a = chucA * 10 + donViA;
    const b = chucB * 10 + donViB;
    const answer = a + b;
    const quenNho = answer - 10;
    return {
      prompt: `Đặt tính rồi tính: ${a} + ${b} = ?`,
      speech: `Con hãy tính ${a} cộng ${b} nhé. Nhớ đặt hàng đơn vị thẳng hàng đơn vị.`,
      answer,
      visual: {
        kind: "khoi-tram-chuc-donvi",
        hundreds: 0,
        tens: chucA + chucB,
        ones: donViA + donViB,
      },
      hints: [
        {
          level: 1,
          text: "Con đặt tính dọc trước nhé: hàng đơn vị thẳng hàng đơn vị, hàng chục thẳng hàng chục.",
          speech: "Con đặt tính dọc trước nhé. Hàng đơn vị thẳng hàng đơn vị.",
        },
        {
          level: 2,
          text: "Nhìn khối bên cạnh: gộp các khối lẻ lại, nếu đủ mười khối lẻ thì bó thành một chục.",
          speech: "Con nhìn hình bên cạnh. Đủ mười khối lẻ thì bó lại thành một chục.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [18, 15, 33],
            text: "18 + 15. Cột đơn vị cộng lại vượt quá 9 nên có một chục phải chuyển sang cột bên trái. Bài mẫu đó ra 33.",
            speech: "Con xem bài tương tự nhé. Mười tám cộng mười lăm bằng ba mươi ba.",
          },
          {
            so: [26, 47, 73],
            text: "26 + 47. Cột đơn vị cộng lại vượt quá 9 nên có một chục phải chuyển sang cột bên trái. Bài mẫu đó ra 73.",
            speech: "Con xem bài tương tự nhé. Hai mươi sáu cộng bốn mươi bảy bằng bảy mươi ba.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con cộng riêng cột đơn vị trước, xem kết quả có vượt quá chín không.",
          speech: "Con cộng cột đơn vị trước, xem có vượt quá chín không nhé.",
        },
      ],
      traps: [{ id: "BAY-QUEN-NHO", wrongAnswer: quenNho }],
    };
  },
};

/** Trừ có nhớ trong phạm vi 100. */
const KD_002: Template = {
  id: "KD-002",
  version: 2,
  title: "Trừ có nhớ trong phạm vi 100",
  yccd: "T2.SPT.02",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-10T09:20:00+07:00",
    templateVersion: 2,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    // Ràng buộc: cột đơn vị của số bị trừ nhỏ hơn, nên luôn phải mượn.
    const donViA = r.int(0, 4);
    const donViB = r.int(donViA + 1, 9);
    const chucA = r.int(3, 9);
    const chucB = r.int(1, chucA - 1);
    const a = chucA * 10 + donViA;
    const b = chucB * 10 + donViB;
    const answer = a - b;
    // Trẻ quên mượn thường lấy chữ số lớn trừ chữ số bé ở từng cột.
    const quenMuon = (chucA - chucB) * 10 + (donViB - donViA);
    return {
      prompt: `Đặt tính rồi tính: ${a} − ${b} = ?`,
      speech: `Con hãy tính ${a} trừ ${b} nhé.`,
      answer,
      visual: { kind: "tia-so", from: 0, to: 100, step: 10, mark: a },
      hints: [
        {
          level: 1,
          text: "Con đặt tính dọc, viết số lớn ở trên, số bé ở dưới, thẳng hàng với nhau.",
          speech: "Con đặt tính dọc, số lớn ở trên, số bé ở dưới nhé.",
        },
        {
          level: 2,
          text: "Nhìn tia số: con đứng ở số lớn rồi lùi dần về bên trái.",
          speech: "Con nhìn tia số, đứng ở số lớn rồi lùi dần về bên trái.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [52, 27, 25],
            text: "52 − 27. Ở cột đơn vị, chữ số trên nhỏ hơn chữ số dưới nên phải mượn một chục của cột bên cạnh rồi mới trừ được. Bài mẫu đó ra 25.",
            speech: "Con xem bài tương tự nhé. Năm mươi hai trừ hai mươi bảy bằng hai mươi lăm.",
          },
          {
            so: [84, 39, 45],
            text: "84 − 39. Ở cột đơn vị, chữ số trên nhỏ hơn chữ số dưới nên phải mượn một chục của cột bên cạnh rồi mới trừ được. Bài mẫu đó ra 45.",
            speech: "Con xem bài tương tự nhé. Tám mươi tư trừ ba mươi chín bằng bốn mươi lăm.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: ở cột đơn vị, chữ số ở trên có trừ được chữ số ở dưới không? Nếu không thì con phải mượn một chục.",
          speech: "Con xem cột đơn vị có trừ được không, nếu không thì phải mượn một chục.",
        },
      ],
      traps: [{ id: "BAY-QUEN-NHO", wrongAnswer: quenMuon }],
    };
  },
};

/** Cấu tạo số trăm — chục — đơn vị. */
const KD_003: Template = {
  id: "KD-003",
  version: 1,
  title: "Cấu tạo số trong phạm vi 1000",
  yccd: "T2.SPT.01",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-11T14:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const tram = r.int(1, 9);
    const chuc = r.int(1, 9);
    const donVi = r.int(1, 9);
    const so = tram * 100 + chuc * 10 + donVi;
    const hoi = r.pick(["trăm", "chục", "đơn vị"] as const);
    const answer = hoi === "trăm" ? tram : hoi === "chục" ? chuc : donVi;
    return {
      prompt: `Số ${so} gồm mấy ${hoi}?`,
      speech: `Số ${so} gồm mấy ${hoi}? Con chọn số đúng nhé.`,
      answer,
      unit: hoi,
      choices: r.shuffle([tram, chuc, donVi]),
      visual: { kind: "khoi-tram-chuc-donvi", hundreds: tram, tens: chuc, ones: donVi },
      hints: [
        {
          level: 1,
          text: `Con đọc lại đề: đề đang hỏi về hàng ${hoi}, không hỏi hàng khác.`,
          speech: `Đề đang hỏi về hàng ${hoi} nhé con.`,
        },
        {
          level: 2,
          text: "Nhìn hình: tấm vuông to là trăm, thanh dài là chục, ô nhỏ là đơn vị. Con đếm đúng loại mà đề hỏi.",
          speech: "Tấm vuông to là trăm, thanh dài là chục, ô nhỏ là đơn vị nhé con.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [472, 4, 7, 2],
            text: "số 472 gồm 4 trăm, 7 chục và 2 đơn vị.",
            speech: "Con xem bài tương tự. Số bốn trăm bảy mươi hai gồm bốn trăm, bảy chục và hai đơn vị.",
          },
          {
            so: [365, 3, 6, 5],
            text: "số 365 gồm 3 trăm, 6 chục và 5 đơn vị.",
            speech: "Con xem bài tương tự. Số ba trăm sáu mươi lăm gồm ba trăm, sáu chục và năm đơn vị.",
          },
        ]),
        {
          level: 4,
          text:
            hoi === "trăm"
              ? "Bước đầu tiên: con nhìn chữ số đứng đầu tiên bên trái."
              : hoi === "chục"
                ? "Bước đầu tiên: con nhìn chữ số đứng ở giữa."
                : "Bước đầu tiên: con nhìn chữ số đứng cuối cùng bên phải.",
          speech: "Con xem chữ số nào ứng với hàng mà đề hỏi nhé.",
        },
      ],
      traps: [],
    };
  },
};

/** Nhân trong bảng 2 và 5. */
const KD_004: Template = {
  id: "KD-004",
  version: 1,
  title: "Phép nhân trong bảng 2 và 5",
  yccd: "T2.SPT.03",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-11T14:10:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const bang = r.pick([2, 5] as const);
    const lan = r.int(2, 9);
    const dv = r.pick(DO_VAT);
    const ban = r.pick(TEN_BAN);
    const answer = bang * lan;
    return {
      prompt: `${ban} xếp ${lan} đĩa, mỗi đĩa có ${bang} ${dv.ten}. Hỏi có tất cả bao nhiêu ${dv.ten}?`,
      speech: `Bạn ${ban} xếp ${lan} đĩa, mỗi đĩa có ${bang} ${dv.ten}. Hỏi có tất cả bao nhiêu ${dv.ten}?`,
      answer,
      unit: dv.dv,
      visual: { kind: "nhom-hinh", rows: lan, perRow: bang, shape: "tron" },
      hints: [
        {
          level: 1,
          text: "Con đọc lại đề: mỗi đĩa có mấy cái, và có tất cả mấy đĩa?",
          speech: "Mỗi đĩa có mấy cái, và có tất cả mấy đĩa hả con?",
        },
        {
          level: 2,
          text: "Nhìn hình: mỗi hàng là một đĩa. Con đếm số hàng và số chấm trong một hàng.",
          speech: "Mỗi hàng trong hình là một đĩa nhé con.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [3, 5, 15],
            text: "3 đĩa, mỗi đĩa 5 quả thì có 5 nhân 3, bằng 15 quả.",
            speech: "Con xem bài tương tự. Ba đĩa, mỗi đĩa năm quả thì có mười lăm quả.",
          },
          {
            so: [4, 2, 8],
            text: "4 đĩa, mỗi đĩa 2 quả thì có 2 nhân 4, bằng 8 quả.",
            speech: "Con xem bài tương tự. Bốn đĩa, mỗi đĩa hai quả thì có tám quả.",
          },
        ]),
        {
          level: 4,
          text: `Bước đầu tiên: con lấy số trong mỗi đĩa là ${bang}, nhân với số đĩa.`,
          speech: "Con lấy số trong mỗi đĩa nhân với số đĩa nhé.",
        },
      ],
      // Trẻ hay cộng hai số thay vì nhân.
      traps: [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: bang + lan }],
    };
  },
};

/** Chia trong bảng 2 và 5. */
const KD_005: Template = {
  id: "KD-005",
  version: 1,
  title: "Phép chia trong bảng 2 và 5",
  yccd: "T2.SPT.03",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },
  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-11T14:20:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const chia = r.pick([2, 5] as const);
    const phan = r.int(2, 9);
    const tong = chia * phan;
    const dv = r.pick(DO_VAT);
    const ban = r.pick(TEN_BAN);
    return {
      prompt: `${ban} có ${tong} ${dv.ten}, chia đều vào ${chia} rổ. Hỏi mỗi rổ có bao nhiêu ${dv.ten}?`,
      speech: `Bạn ${ban} có ${tong} ${dv.ten}, chia đều vào ${chia} rổ. Mỗi rổ có bao nhiêu ${dv.ten}?`,
      answer: phan,
      unit: dv.dv,
      visual: { kind: "nhom-hinh", rows: chia, perRow: phan, shape: "tron" },
      hints: [
        {
          level: 1,
          text: "Con đọc lại đề: chia đều vào mấy rổ, và đề hỏi mỗi rổ hay hỏi tất cả?",
          speech: "Đề hỏi mỗi rổ có bao nhiêu, chứ không hỏi tất cả nhé con.",
        },
        {
          level: 2,
          text: "Nhìn hình: mỗi hàng là một rổ. Con chia đều cho tới khi các hàng bằng nhau.",
          speech: "Mỗi hàng là một rổ, con chia sao cho các hàng bằng nhau.",
          revealVisual: true,
        },
        chonViDu(phan, [
          {
            so: [12, 2, 6],
            text: "12 quả chia đều vào 2 rổ thì mỗi rổ có 6 quả.",
            speech: "Con xem bài tương tự. Mười hai quả chia đều vào hai rổ, mỗi rổ sáu quả.",
          },
          {
            so: [35, 5, 7],
            text: "35 quả chia đều vào 5 rổ thì mỗi rổ có 7 quả.",
            speech: "Con xem bài tương tự. Ba mươi lăm quả chia đều vào năm rổ, mỗi rổ bảy quả.",
          },
        ]),
        {
          level: 4,
          text: `Bước đầu tiên: con lấy tổng số là ${tong} rồi chia cho số rổ.`,
          speech: "Con lấy tổng số chia cho số rổ nhé.",
        },
      ],
      traps: [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: tong - chia }],
    };
  },
};

/** So sánh hai số trong phạm vi 1000. */
const KD_013: Template = {
  id: "KD-013",
  version: 1,
  title: "So sánh hai số trong phạm vi 1000",
  yccd: "T2.SPT.01",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T09:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const a = r.int(101, 999);
    // Ràng buộc: hai số phải khác nhau, và một nửa số bài cùng chữ số hàng trăm
    // để trẻ buộc phải so tiếp hàng chục chứ không dừng ở chữ số đầu.
    const cungTram = r.next() < 0.5;
    const b = cungTram
      ? Math.floor(a / 100) * 100 + r.int(0, 99)
      : r.int(101, 999);
    if (a === b) return KD_013.build(seed + 1);
    // Trẻ bấm thẳng vào con số lớn hơn. Cách này tự nhiên hơn hẳn việc bắt trẻ
    // quy ước "bấm 1 nếu là số thứ nhất" — thêm một tầng quy ước là thêm một
    // chỗ để trẻ sai vì lý do không liên quan gì tới toán.
    const answer = Math.max(a, b);
    return {
      prompt: `Trong hai số ${a} và ${b}, số nào lớn hơn? Con bấm vào số lớn hơn nhé.`,
      speech: `Trong hai số ${a} và ${b}, số nào lớn hơn hả con?`,
      answer,
      choices: r.shuffle([a, b]),
      visual: {
        kind: "khoi-tram-chuc-donvi",
        hundreds: Math.floor(a / 100),
        tens: Math.floor((a % 100) / 10),
        ones: a % 10,
      },
      hints: [
        {
          level: 1,
          text: "So hai số thì bắt đầu từ hàng cao nhất. Con xem chữ số hàng trăm của hai số, số nào có hàng trăm lớn hơn thì số đó lớn hơn.",
          speech: "Con so hàng trăm trước nhé. Hàng trăm nào lớn hơn thì số đó lớn hơn.",
        },
        {
          level: 2,
          text: "Nếu hàng trăm bằng nhau thì mới so tiếp hàng chục, rồi mới đến hàng đơn vị. Nhìn hình bên để thấy số thứ nhất gồm mấy trăm, mấy chục, mấy đơn vị.",
          speech: "Hàng trăm bằng nhau thì con so tiếp hàng chục nhé.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [345, 352, 4, 5],
            text: "so 345 với 352. Hàng trăm đều là 3 nên chưa quyết được; so tiếp hàng chục thì 4 bé hơn 5, vậy 345 bé hơn 352.",
            speech: "Con xem bài tương tự. Ba trăm bốn mươi lăm bé hơn ba trăm năm mươi hai.",
          },
          {
            so: [618, 671, 7],
            text: "so 618 với 671. Hàng trăm đều là 6 nên chưa quyết được; so tiếp hàng chục thì 1 bé hơn 7, vậy 618 bé hơn 671.",
            speech: "Con xem bài tương tự. Sáu trăm mười tám bé hơn sáu trăm bảy mươi mốt.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con che hàng chục và hàng đơn vị của cả hai số đi, chỉ nhìn hàng trăm thôi.",
          speech: "Con che hàng chục và hàng đơn vị, chỉ nhìn hàng trăm thôi nhé.",
        },
      ],
      // Trẻ hay so theo chữ số cuối thay vì so từ hàng cao nhất xuống.
      traps: [{ id: "BAY-DEM-TRUNG", wrongAnswer: a % 10 > b % 10 ? a : b }],
    };
  },
};

/** Số liền trước, số liền sau. */
const KD_014: Template = {
  id: "KD-014",
  version: 1,
  title: "Số liền trước, số liền sau",
  yccd: "T2.SPT.01",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T09:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    // Một phần ba số bài rơi đúng chỗ tròn chục, nơi trẻ hay vấp nhất.
    const so = r.next() < 0.34 ? r.int(2, 99) * 10 : r.int(11, 998);
    const truoc = r.next() < 0.5;
    const answer = truoc ? so - 1 : so + 1;
    return {
      prompt: `Số liền ${truoc ? "trước" : "sau"} của ${so} là số nào?`,
      speech: `Số liền ${truoc ? "trước" : "sau"} của ${so} là số nào hả con?`,
      answer,
      visual: { kind: "tia-so", from: Math.max(0, so - 5), to: so + 5, step: 1, mark: so },
      hints: [
        {
          level: 1,
          text: `Liền ${truoc ? "trước" : "sau"} nghĩa là ${truoc ? "lùi lại một bước" : "tiến lên một bước"} trên tia số.`,
          speech: `Liền ${truoc ? "trước là lùi lại một bước" : "sau là tiến lên một bước"} nhé con.`,
        },
        {
          level: 2,
          text: "Nhìn tia số: con tìm chấm đỏ, rồi bước sang ô bên cạnh theo đúng hướng.",
          speech: "Con tìm chấm đỏ trên tia số rồi bước sang ô bên cạnh nhé.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [47, 46, 48],
            text: "số liền trước của 47 là 46, số liền sau của 47 là 48.",
            speech: "Con xem bài tương tự. Liền trước của bốn mươi bảy là bốn mươi sáu.",
          },
          {
            so: [230, 229, 231],
            text: "số liền trước của 230 là 229, số liền sau của 230 là 231.",
            speech: "Con xem bài tương tự. Liền trước của hai trăm ba mươi là hai trăm hai mươi chín.",
          },
        ]),
        {
          level: 4,
          text: `Bước đầu tiên: con ${truoc ? "bớt đi" : "thêm vào"} một đơn vị.`,
          speech: `Con ${truoc ? "bớt đi" : "thêm vào"} một đơn vị nhé.`,
        },
      ],
      // Trẻ hay đi nhầm hướng: hỏi liền trước thì lại cộng thêm một.
      traps: [{ id: "BAY-NHIEU-HON-TRU", wrongAnswer: truoc ? so + 1 : so - 1 }],
    };
  },
};

/** Cộng trừ nhẩm với số tròn chục. */
const KD_015: Template = {
  id: "KD-015",
  version: 1,
  title: "Cộng trừ nhẩm với số tròn chục",
  yccd: "T2.SPT.02",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T10:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const chucA = r.int(2, 8);
    const cong = r.next() < 0.5;
    const chucB = cong ? r.int(1, 9 - chucA) : r.int(1, chucA - 1);
    const a = chucA * 10;
    const b = chucB * 10;
    const answer = cong ? a + b : a - b;
    return {
      prompt: `Tính nhẩm: ${a} ${cong ? "+" : "−"} ${b} = ?`,
      speech: `Con tính nhẩm ${a} ${cong ? "cộng" : "trừ"} ${b} nhé. Bài này không cần đặt tính.`,
      answer,
      visual: { kind: "tia-so", from: 0, to: 100, step: 10, mark: a },
      hints: [
        {
          level: 1,
          text: "Hai số này đều tròn chục, nên con chỉ cần tính theo chục là xong, không phải đặt tính.",
          speech: "Hai số đều tròn chục nên con tính theo chục thôi nhé.",
        },
        {
          level: 2,
          text: "Nhìn tia số: mỗi vạch là một chục. Con đếm xem phải đi mấy vạch.",
          speech: "Mỗi vạch trên tia số là một chục nhé con.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [3, 2, 5, 30, 20, 50],
            text: "30 + 20. Con nghĩ là 3 chục thêm 2 chục được 5 chục, tức là 50.",
            speech: "Con xem bài tương tự. Ba chục thêm hai chục là năm chục, tức ba mươi cộng hai mươi bằng năm mươi.",
          },
          {
            so: [8, 6, 80, 60, 140],
            text: "80 + 60. Con nghĩ là 8 chục thêm 6 chục được 14 chục, tức là 140.",
            speech: "Con xem bài tương tự. Tám chục thêm sáu chục là mười bốn chục, tức một trăm bốn mươi.",
          },
        ]),
        {
          level: 4,
          text: `Bước đầu tiên: con che số không ở cuối cả hai số đi, ${cong ? "cộng" : "trừ"} hai chữ số còn lại, rồi viết lại số không.`,
          speech: "Con che số không ở cuối đi, tính hai chữ số còn lại rồi viết số không lại nhé.",
        },
      ],
      traps: [],
    };
  },
};

/** Tính hàng ngang hai bước liên tiếp. */
const KD_016: Template = {
  id: "KD-016",
  version: 1,
  title: "Tính hàng ngang hai bước liên tiếp",
  yccd: "T2.SPT.02",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T10:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const a = r.int(30, 90);
    const b = r.int(5, 25);
    const c = r.int(5, 25);
    // Ràng buộc: kết quả trung gian và kết quả cuối đều không âm.
    const buoc1 = a - b;
    const answer = buoc1 + c;
    return {
      prompt: `Tính: ${a} − ${b} + ${c} = ?`,
      speech: `Con tính ${a} trừ ${b} cộng ${c} nhé. Làm lần lượt từ trái sang phải.`,
      answer,
      visual: { kind: "tia-so", from: 0, to: 120, step: 10, mark: a },
      hints: [
        {
          level: 1,
          text: "Dãy này có hai phép tính. Con làm từ trái sang phải, làm xong phép thứ nhất mới làm phép thứ hai.",
          speech: "Con làm từ trái sang phải nhé, xong phép thứ nhất mới tới phép thứ hai.",
        },
        {
          level: 2,
          text: "Nhìn tia số: con đứng ở số đầu, lùi lại theo phép trừ, rồi tiến lên theo phép cộng.",
          speech: "Con đứng ở số đầu, lùi lại rồi tiến lên nhé.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [40, 15, 25, 8, 33],
            text: "40 − 15 + 8. Bước một: 40 − 15 được 25. Bước hai: 25 + 8 được 33.",
            speech: "Con xem bài tương tự. Bốn mươi trừ mười lăm bằng hai mươi lăm, cộng tám bằng ba mươi ba.",
          },
          {
            so: [72, 19, 53, 6, 59],
            text: "72 − 19 + 6. Bước một: 72 − 19 được 53. Bước hai: 53 + 6 được 59.",
            speech: "Con xem bài tương tự. Bảy mươi hai trừ mười chín bằng năm mươi ba, cộng sáu bằng năm mươi chín.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con tính phép trừ ở bên trái trước đã, viết kết quả ra nháp rồi mới làm tiếp.",
          speech: "Con tính phép trừ trước đã, viết ra nháp rồi mới làm tiếp nhé.",
        },
      ],
      // Làm tắt: chỉ làm một trong hai phép.
      traps: [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: buoc1 }],
    };
  },
};

/** Tìm số hạng chưa biết. */
const KD_017: Template = {
  id: "KD-017",
  version: 1,
  title: "Tìm số hạng chưa biết",
  yccd: "T2.SPT.04",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T10:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const answer = r.int(11, 60);
    const biet = r.int(11, 39);
    const tong = answer + biet;
    const truoc = r.next() < 0.5;
    return {
      prompt: truoc
        ? `Tìm số còn thiếu:  ? + ${biet} = ${tong}`
        : `Tìm số còn thiếu:  ${biet} + ? = ${tong}`,
      speech: `Con tìm số còn thiếu nhé. ${truoc ? "Số nào" : `${biet} cộng với số nào`} thì được ${tong}?`,
      answer,
      visual: {
        kind: "doan-thang",
        segments: [
          { label: "cả hai", length: tong },
          { label: "đã biết", length: biet },
        ],
      },
      hints: [
        {
          level: 1,
          text: "Con đọc lại: hai số cộng lại bằng bao nhiêu, và con đã biết một trong hai số đó chưa?",
          speech: "Hai số cộng lại bằng bao nhiêu, và con đã biết số nào rồi?",
        },
        {
          level: 2,
          text: "Nhìn sơ đồ: đoạn dài là cả hai số gộp lại, đoạn ngắn là số đã biết. Phần còn thiếu chính là chỗ chênh nhau.",
          speech: "Đoạn dài là cả hai gộp lại, đoạn ngắn là số đã biết. Phần thiếu là chỗ chênh nhau.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [7, 10, 3],
            text: "? + 7 = 10. Muốn tìm số còn thiếu, con lấy 10 trừ đi 7, được 3.",
            speech: "Con xem bài tương tự. Muốn tìm số thiếu, con lấy mười trừ bảy bằng ba.",
          },
          {
            so: [82, 95, 13],
            text: "? + 82 = 95. Muốn tìm số còn thiếu, con lấy 95 trừ đi 82, được 13.",
            speech: "Con xem bài tương tự. Chín mươi lăm trừ tám mươi hai bằng mười ba.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: muốn tìm một số hạng, con lấy tổng trừ đi số hạng kia.",
          speech: "Muốn tìm một số hạng, con lấy tổng trừ đi số hạng kia nhé.",
        },
      ],
      // Trẻ hay cộng hai số nhìn thấy thay vì trừ.
      traps: [{ id: "BAY-NHIEU-HON-TRU", wrongAnswer: tong + biet }],
    };
  },
};

/** Tìm số bị trừ hoặc số trừ chưa biết. */
const KD_018: Template = {
  id: "KD-018",
  version: 1,
  title: "Tìm số bị trừ hoặc số trừ chưa biết",
  yccd: "T2.SPT.04",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Trần Thu Hà",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T10:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const hieu = r.int(11, 50);
    const soTru = r.int(11, 40);
    const soBiTru = hieu + soTru;
    const timSoBiTru = r.next() < 0.5;
    const answer = timSoBiTru ? soBiTru : soTru;
    return {
      prompt: timSoBiTru
        ? `Tìm số còn thiếu:  ? − ${soTru} = ${hieu}`
        : `Tìm số còn thiếu:  ${soBiTru} − ? = ${hieu}`,
      speech: "Con tìm số còn thiếu trong phép trừ này nhé.",
      answer,
      visual: {
        kind: "doan-thang",
        segments: [
          { label: "ban đầu", length: soBiTru },
          { label: "còn lại", length: hieu },
        ],
      },
      hints: [
        {
          level: 1,
          text: timSoBiTru
            ? "Con đang tìm số lúc đầu, tức là số lớn nhất trong phép trừ."
            : "Con đang tìm số bị bớt đi, tức là phần đã mất.",
          speech: timSoBiTru
            ? "Con đang tìm số lúc đầu, là số lớn nhất trong phép trừ."
            : "Con đang tìm phần đã bị bớt đi.",
        },
        {
          level: 2,
          text: "Nhìn sơ đồ: đoạn trên là lúc đầu, đoạn dưới là còn lại. Phần chênh nhau chính là phần đã bớt đi.",
          speech: "Đoạn trên là lúc đầu, đoạn dưới là còn lại nhé con.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [3, 7, 10],
            text: "? − 3 = 7 thì lấy 7 cộng 3 được 10. Còn 10 − ? = 7 thì lấy 10 trừ 7 được 3.",
            speech: "Con xem bài tương tự. Muốn tìm số lúc đầu thì cộng lại, muốn tìm phần bớt đi thì trừ đi.",
          },
          {
            so: [26, 45, 71],
            text: "? − 26 = 45 thì lấy 45 cộng 26 được 71. Còn 71 − ? = 45 thì lấy 71 trừ 45 được 26.",
            speech: "Con xem bài tương tự. Bốn mươi lăm cộng hai mươi sáu bằng bảy mươi mốt.",
          },
        ]),
        {
          level: 4,
          text: timSoBiTru
            ? "Bước đầu tiên: muốn tìm số lúc đầu, con cộng phần còn lại với phần đã bớt."
            : "Bước đầu tiên: muốn tìm phần đã bớt, con lấy số lúc đầu trừ phần còn lại.",
          speech: timSoBiTru
            ? "Muốn tìm số lúc đầu thì con cộng lại nhé."
            : "Muốn tìm phần đã bớt thì con trừ đi nhé.",
        },
      ],
      // Đi nhầm chiều: đáng cộng thì trừ, đáng trừ thì cộng.
      traps: [{ id: "BAY-NHIEU-HON-TRU", wrongAnswer: timSoBiTru ? hieu - soTru : soBiTru + hieu }],
    };
  },
};

/** Bảng nhân 2 và 5 — tính trực tiếp. */
const KD_019: Template = {
  id: "KD-019",
  version: 1,
  title: "Bảng nhân 2 và 5",
  yccd: "T2.SPT.03",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  ghiChuKhongGian:
    "Bảng nhân 2 và 5 chỉ có ngần ấy phép tính, nên không gian nhỏ là do chính " +
    "chương trình chứ không phải do khuôn dạng viết hẹp. Với dạng học thuộc bảng, " +
    "gặp lại nhiều lần là cách học chứ không phải là nhàm.",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T09:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const bang = r.pick([2, 5] as const);
    const lan = r.int(2, 10);
    const answer = bang * lan;
    // Đảo thứ tự ở một nửa số bài: trẻ phải nhận ra 2 × 7 và 7 × 2 cho cùng
    // kết quả, đó là một phần của việc học bảng nhân.
    const daoThuTu = r.next() < 0.5;
    const [truoc, sau] = daoThuTu ? [lan, bang] : [bang, lan];
    return {
      prompt: `Tính: ${truoc} × ${sau} = ?`,
      speech: `Con tính ${truoc} nhân ${sau} nhé.`,
      answer,
      visual: { kind: "nhom-hinh", rows: sau, perRow: truoc, shape: "vuong" },
      hints: [
        {
          level: 1,
          text: `Nhân là cộng nhiều lần giống nhau. ${truoc} × ${sau} nghĩa là lấy ${truoc} cộng với chính nó ${sau} lần.`,
          speech: "Nhân là cộng nhiều lần giống nhau nhé con.",
        },
        {
          level: 2,
          text: "Nhìn hình: mỗi hàng là một lần. Con đếm tổng số ô vuông.",
          speech: "Mỗi hàng trong hình là một lần nhé con.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [2, 3, 6],
            text: "2 × 3 nghĩa là 2 + 2 + 2, bằng 6.",
            speech: "Con xem bài tương tự. Hai nhân ba là hai cộng hai cộng hai, bằng sáu.",
          },
          {
            so: [5, 7, 35],
            text: "5 × 7 nghĩa là đếm cách 5 bảy lần: 5, 10, 15, 20, 25, 30, 35.",
            speech: "Con xem bài tương tự. Năm nhân bảy bằng ba mươi lăm.",
          },
        ]),
        {
          level: 4,
          text: `Bước đầu tiên: con đếm cách ${truoc}, đếm đủ ${sau} lần thì dừng.`,
          speech: `Con đếm cách ${truoc} nhé, đếm đủ ${sau} lần thì dừng.`,
        },
      ],
      traps: [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: truoc + sau }],
    };
  },
};

/** Gấp một số lên nhiều lần. */
const KD_020: Template = {
  id: "KD-020",
  version: 1,
  title: "Gấp một số lên nhiều lần",
  yccd: "T2.SPT.05",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T09:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const so = r.int(3, 15);
    const lan = r.pick([2, 5] as const);
    const ban = r.pick(TEN_BAN);
    const dv = r.pick(DO_VAT);
    const answer = so * lan;
    return {
      prompt: `${ban} có ${so} ${dv.ten}. Số ${dv.ten} của ${ban} được gấp lên ${lan} lần thì được bao nhiêu ${dv.ten}?`,
      speech: `Bạn ${ban} có ${so} ${dv.ten}. Gấp lên ${lan} lần thì được bao nhiêu ${dv.ten}?`,
      answer,
      unit: dv.dv,
      visual: { kind: "nhom-hinh", rows: lan, perRow: Math.min(so, 8), shape: "tron" },
      hints: [
        {
          level: 1,
          text: `Gấp lên ${lan} lần nghĩa là có thêm ${lan - 1} nhóm nữa giống hệt nhóm ban đầu, chứ không phải thêm ${lan} cái.`,
          speech: "Gấp lên mấy lần nghĩa là có thêm mấy nhóm giống hệt nhóm ban đầu nhé con.",
        },
        {
          level: 2,
          text: "Nhìn hình: mỗi hàng là một nhóm giống nhau. Con đếm xem có mấy hàng.",
          speech: "Mỗi hàng là một nhóm giống nhau nhé con.",
          revealVisual: true,
        },
        chonViDu(answer, [
          {
            so: [4, 2, 8],
            text: "4 gấp lên 2 lần thì được 4 + 4, tức là 8.",
            speech: "Con xem bài tương tự. Bốn gấp lên hai lần được tám.",
          },
          {
            so: [6, 5, 30],
            text: "6 gấp lên 5 lần thì được 6 nhân 5, tức là 30.",
            speech: "Con xem bài tương tự. Sáu gấp lên năm lần được ba mươi.",
          },
        ]),
        {
          level: 4,
          text: `Bước đầu tiên: con lấy ${so} nhân với số lần.`,
          speech: "Con lấy số ban đầu nhân với số lần nhé.",
        },
      ],
      // Nhầm "gấp lên" thành "thêm vào" — lỗi ngôn ngữ kinh điển của dạng này.
      traps: [{ id: "BAY-NHIEU-HON-TRU", wrongAnswer: so + lan }],
    };
  },
};

/** Một phần hai, một phần năm của một nhóm. */
const KD_021: Template = {
  id: "KD-021",
  version: 1,
  title: "Một phần hai, một phần năm",
  yccd: "T2.SPT.05",
  grade: 2,
  term: 2,
  strand: "so-va-phep-tinh",
  provenance: {
    source: "CTGDPT",
    reference: "Chương trình giáo dục phổ thông môn Toán, lớp 2, mạch Số và phép tính",
    authoredBy: "Nhóm nội dung Ô Ly",
    aiAssisted: false,
  },  approval: {
    reviewedBy: "Cô Nguyễn Thị Lan",
    reviewerRole: "giao-vien-tieu-hoc",
    reviewedAt: "2026-09-14T09:00:00+07:00",
    templateVersion: 1,
  },
  build(seed: number): BuiltItem {
    const r = new Rng(seed);
    const phan = r.pick([2, 5] as const);
    const moiPhan = r.int(2, 9);
    const tong = phan * moiPhan;
    const dv = r.pick(DO_VAT);
    return {
      prompt: `Có ${tong} ${dv.ten}. Hỏi một phần ${phan === 2 ? "hai" : "năm"} số ${dv.ten} đó là bao nhiêu ${dv.ten}?`,
      speech: `Có ${tong} ${dv.ten}. Một phần ${phan === 2 ? "hai" : "năm"} số đó là bao nhiêu ${dv.ten}?`,
      answer: moiPhan,
      unit: dv.dv,
      visual: { kind: "nhom-hinh", rows: phan, perRow: moiPhan, shape: "tron" },
      hints: [
        {
          level: 1,
          // Viết số phần bằng CHỮ chứ không bằng chữ số: đáp án của bài này là
          // một số bé, nên một chữ số lọt vào gợi ý là lọt đáp án (BR-03).
          text: `Một phần ${phan === 2 ? "hai" : "năm"} nghĩa là chia đều thành ${phan === 2 ? "hai" : "năm"} phần bằng nhau rồi lấy MỘT phần thôi.`,
          speech: `Con chia đều thành ${phan === 2 ? "hai" : "năm"} phần bằng nhau rồi lấy một phần thôi nhé.`,
        },
        {
          level: 2,
          text: "Nhìn hình: mỗi hàng là một phần bằng nhau. Con đếm số hình trong MỘT hàng.",
          speech: "Mỗi hàng là một phần bằng nhau, con đếm một hàng thôi nhé.",
          revealVisual: true,
        },
        chonViDu(moiPhan, [
          {
            so: [12, 2, 6],
            text: "một phần hai của 12 là chia 12 thành 2 phần bằng nhau, mỗi phần 6.",
            speech: "Con xem bài tương tự. Một phần hai của mười hai là sáu.",
          },
          {
            so: [35, 5, 7],
            text: "một phần năm của 35 là chia 35 thành 5 phần bằng nhau, mỗi phần 7.",
            speech: "Con xem bài tương tự. Một phần năm của ba mươi lăm là bảy.",
          },
        ]),
        {
          level: 4,
          text: "Bước đầu tiên: con lấy tất cả chia đều cho số phần.",
          speech: "Con lấy tổng chia cho số phần nhé.",
        },
      ],
      // Lấy cả nhóm thay vì một phần, hoặc trừ đi số phần.
      traps: [{ id: "BAY-THU-TU-PHEP-TINH", wrongAnswer: tong - phan }],
    };
  },
};

export const KHUON_DANG: Template[] = [
  KD_001, KD_002, KD_003, KD_004, KD_005, KD_013, KD_014, KD_015,
  KD_016, KD_017, KD_018, KD_019, KD_020, KD_021,
];
