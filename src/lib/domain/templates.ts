import { Rng } from "./rng";
import { BOI_CANH, CAY, DO_VAT, NGUOI_LON, TEN_BAN } from "./names";
import type { BuiltItem, HintRung, Template } from "./types";

/**
 * Kho khuôn dạng bài — giai đoạn 1, lớp 2 học kỳ 2.
 *
 * Mỗi khuôn dạng chỉ mô tả CẤU TRÚC toán học cùng tham số và ràng buộc; từ một
 * khuôn dạng sinh ra vô hạn bài cụ thể khác nhau. Đây là lý do kho nội dung
 * hữu hạn nhưng trẻ học bốn tuần liên tục không gặp lại bài cũ (điều kiện ra
 * mắt số 4).
 *
 * Ba quy tắc bất di bất dịch khi viết một khuôn dạng mới:
 *   1. Không bậc gợi ý nào được chứa đáp án của chính bài đang làm (BR-03).
 *      Bậc 3 làm mẫu bài TƯƠNG TỰ với con số khác hẳn.
 *   2. Mọi tên riêng lấy từ src/lib/domain/names.ts, không tự đặt (BR-07).
 *   3. Mỗi bẫy gài vào bài phải khai kèm con số mà trẻ viết ra khi mắc bẫy,
 *      để việc nhận diện là tra bảng chứ không phải suy đoán (BR-04).
 */

/**
 * Bài mẫu cho bậc gợi ý thứ ba.
 *
 * BR-03 nói bậc ba làm mẫu một bài TƯƠNG TỰ. "Tương tự" ở đây là một ràng buộc
 * đo được chứ không phải lời khuyên: không con số nào trong bài mẫu được trùng
 * với đáp án của bài trẻ đang làm. Một bài mẫu ra đúng con số trẻ đang phải tìm
 * chính là đưa đáp án, chỉ khác cách gói.
 *
 * Vì vậy mỗi khuôn dạng khai vài phương án bài mẫu kèm đầy đủ các số xuất hiện
 * trong đó, và hàm này chọn phương án đầu tiên không đụng đáp án. Các phương án
 * phải rời nhau về tập số; nếu không, hàm ném lỗi ngay tại chỗ thay vì lặng lẽ
 * trả về một bài mẫu có đáp án.
 */
interface ViDu {
  so: number[];
  text: string;
  speech: string;
}

function chonViDu(dapAn: number, viDu: ViDu[]): HintRung {
  const an = viDu.find((v) => !v.so.includes(dapAn));
  if (!an) {
    throw new Error(
      `Mọi phương án bài mẫu đều chứa đáp án ${dapAn}. Khuôn dạng cần thêm một phương án rời nhau.`,
    );
  }
  return { level: 3, text: `Xem bài tương tự: ${an.text}`, speech: an.speech };
}

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

export const TEMPLATES: Template[] = [
  KD_001, KD_002, KD_003, KD_004, KD_005, KD_006,
  KD_007, KD_008, KD_009, KD_010, KD_011, KD_012,
];

export const TEMPLATE_BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));
