import { chamCotDoc } from "../column-marking";
import { chuanHoaBieuThuc, soDauTien, tachDangThuc, tinhBieuThuc } from "./bieu-thuc";
import { chuaKetLuan, timBuocSai, type BuocCham, type KetQuaCham } from "./ket-qua";
import type {
  BaiGiaiLoiVan, ChuaNhanDang, CotDoc, DemHinh, DienSo, DoiDonVi,
  HangNgang, NoiGhep, SoSanh, TracNghiem, XemGio,
} from "./dang-bai-lam";

/** Hệ số quy đổi về đơn vị nhỏ nhất của cùng một đại lượng. */
const QUY_DOI: Record<string, { nhom: string; heSo: number }> = {
  cm: { nhom: "do-dai", heSo: 1 },
  dm: { nhom: "do-dai", heSo: 10 },
  m: { nhom: "do-dai", heSo: 100 },
  g: { nhom: "khoi-luong", heSo: 1 },
  kg: { nhom: "khoi-luong", heSo: 1000 },
  l: { nhom: "dung-tich", heSo: 1 },
};

const viet = (x: number | null | string): string =>
  x === null || x === "" ? "bỏ trống" : String(x);

/* ------------------------------------------------------------------ */
/* Cột dọc — dạng duy nhất đã có từ bản đầu, nay gói vào khuôn chung.   */
/* ------------------------------------------------------------------ */

export function chamCotDocChung(b: CotDoc): KetQuaCham {
  const kq = chamCotDoc(b.soA, b.soB, b.phep, b.chuSoTre);
  const buoc: BuocCham[] = kq.buoc
    .slice()
    .reverse()
    .map((c) => ({
      nhan: `cột ${c.tenCot}`,
      conViet: viet(c.chuSoTre),
      oLyTinh: String(c.chuSoDung),
      dung: c.dung,
      giaiThich: c.giaiThich,
    }));
  return {
    dang: "cot-doc",
    tenDang: "Đặt tính rồi tính",
    dung: kq.dung,
    buoc,
    buocSaiDauTien: timBuocSai(buoc),
    trapId: kq.trapId,
    choPhuHuynh: kq.choPhuHuynh,
    // Tính lại từng cột là phép tính thuần túy, không có chỗ cho suy đoán.
    doTinCay: "cao",
    ngoaiTamKiem: [],
  };
}

/* ------------------------------------------------------------------ */
/* Hàng ngang: 12 - 4 + 2 = 10                                         */
/* ------------------------------------------------------------------ */

export function chamHangNgang(b: HangNgang): KetQuaCham {
  const dung = tinhBieuThuc(b.veTrai);
  if (dung === null) {
    return chuaKetLuan(
      "hang-ngang",
      "Tính hàng ngang",
      `Ô Ly đọc được dòng "${b.veTrai}" nhưng chưa chắc đã đọc đúng từng ký hiệu, nên không dám chấm. Anh chị xem giúp con dòng này nhé.`,
      [],
      ["Phép tính con viết, vì Ô Ly đọc chưa chắc chắn"],
    );
  }
  const buoc: BuocCham[] = [
    {
      nhan: "kết quả",
      conViet: viet(b.ketQuaTre),
      oLyTinh: String(dung),
      dung: b.ketQuaTre === null ? null : b.ketQuaTre === dung,
      giaiThich:
        b.ketQuaTre === null
          ? `Con chưa viết kết quả. Ô Ly tính ${chuanHoaBieuThuc(b.veTrai)} được ${dung}.`
          : b.ketQuaTre === dung
            ? `Ô Ly tính lại ${chuanHoaBieuThuc(b.veTrai)} cũng được ${dung}. Con làm đúng.`
            : `Ô Ly tính lại ${chuanHoaBieuThuc(b.veTrai)} được ${dung}, con viết ${b.ketQuaTre}.`,
    },
  ];
  const lech = b.ketQuaTre !== null ? Math.abs(b.ketQuaTre - dung) : null;
  return {
    dang: "hang-ngang",
    tenDang: "Tính hàng ngang",
    dung: b.ketQuaTre === null ? null : b.ketQuaTre === dung,
    buoc,
    buocSaiDauTien: timBuocSai(buoc),
    // Lệch đúng 10 gần như luôn là quên nhớ hoặc quên mượn một chục.
    trapId: lech === 10 ? "BAY-QUEN-NHO" : null,
    choPhuHuynh:
      b.ketQuaTre === null
        ? "Con chưa điền kết quả cho dòng này. Anh chị nhắc con làm nốt nhé."
        : b.ketQuaTre === dung
          ? `Con tính đúng dòng này: ${chuanHoaBieuThuc(b.veTrai)} bằng ${dung}.`
          : lech === 10
            ? `Con lệch đúng 10 đơn vị — gần như chắc chắn là quên một chục khi nhớ hoặc khi mượn. Anh chị cho con làm lại riêng cột đơn vị là ra.`
            : `Con ra ${b.ketQuaTre}, Ô Ly tính được ${dung}. Anh chị cho con tính lại chậm từng bước một.`,
    doTinCay: "cao",
    ngoaiTamKiem: [],
  };
}

/* ------------------------------------------------------------------ */
/* Điền số vào chỗ trống: 5 + ? = 8                                    */
/* ------------------------------------------------------------------ */

export function chamDienSo(b: DienSo): KetQuaCham {
  const bt = chuanHoaBieuThuc(b.bieuThuc);
  const soODau = (bt.match(/\?/g) ?? []).length;
  if (soODau !== 1 || !bt.includes("=")) {
    return chuaKetLuan(
      "dien-so",
      "Điền số vào chỗ trống",
      "Ô Ly chưa đọc rõ chỗ trống của bài này nên không dám chấm. Anh chị xem giúp con nhé.",
    );
  }

  // Thử mọi giá trị trong phạm vi lớp 1–2 để tìm số làm đẳng thức đúng.
  let dapAn: number | null = null;
  let soNghiem = 0;
  for (let thu = 0; thu <= 1000; thu++) {
    const [trai, phai] = bt.replace(/\?/g, String(thu)).split("=");
    const vt = tinhBieuThuc(trai);
    const vp = tinhBieuThuc(phai);
    if (vt !== null && vp !== null && vt === vp) {
      soNghiem += 1;
      if (dapAn === null) dapAn = thu;
      if (soNghiem > 1) break;
    }
  }

  if (dapAn === null || soNghiem > 1) {
    return chuaKetLuan(
      "dien-so",
      "Điền số vào chỗ trống",
      "Ô Ly đọc được bài nhưng không tìm ra đúng một số điền vào là hợp lý, nên không dám chấm.",
    );
  }

  const buoc: BuocCham[] = [
    {
      nhan: "số cần điền",
      conViet: viet(b.soTre),
      oLyTinh: String(dapAn),
      dung: b.soTre === null ? null : b.soTre === dapAn,
      giaiThich: `Điền ${dapAn} vào chỗ trống thì hai vế bằng nhau.`,
    },
  ];
  return {
    dang: "dien-so",
    tenDang: "Điền số vào chỗ trống",
    dung: b.soTre === null ? null : b.soTre === dapAn,
    buoc,
    buocSaiDauTien: timBuocSai(buoc),
    trapId: null,
    choPhuHuynh:
      b.soTre === dapAn
        ? "Con điền đúng. Dạng này đòi con phải tính ngược, khó hơn tính xuôi, nên anh chị khen con nhé."
        : `Con điền ${viet(b.soTre)}. Anh chị hỏi con: "Phải thêm bao nhiêu nữa thì hai bên bằng nhau?" — cho con thử vài số rồi tự tìm ra.`,
    doTinCay: "cao",
    ngoaiTamKiem: [],
  };
}

/* ------------------------------------------------------------------ */
/* So sánh: 45 ... 54                                                  */
/* ------------------------------------------------------------------ */

export function chamSoSanh(b: SoSanh): KetQuaCham {
  const t = tinhBieuThuc(b.veTrai);
  const p = tinhBieuThuc(b.vePhai);
  if (t === null || p === null) {
    return chuaKetLuan(
      "so-sanh",
      "So sánh",
      "Ô Ly chưa đọc rõ hai vế của bài so sánh này nên không dám chấm.",
    );
  }
  const dau = t > p ? ">" : t < p ? "<" : "=";
  const buoc: BuocCham[] = [
    {
      nhan: "dấu so sánh",
      conViet: viet(b.dauTre),
      oLyTinh: dau,
      dung: b.dauTre === null ? null : b.dauTre === dau,
      giaiThich: `Vế trái bằng ${t}, vế phải bằng ${p}, nên dấu đúng là ${dau}.`,
    },
  ];
  return {
    dang: "so-sanh",
    tenDang: "So sánh",
    dung: b.dauTre === null ? null : b.dauTre === dau,
    buoc,
    buocSaiDauTien: timBuocSai(buoc),
    trapId: null,
    choPhuHuynh:
      b.dauTre === dau
        ? `Con điền đúng dấu ${dau}. Anh chị hỏi thêm con vì sao chọn dấu đó — nói ra được lý do mới là hiểu, chứ dạng này đoán bừa vẫn trúng một nửa số lần.`
        : b.dauTre === null
          ? "Con chưa điền dấu cho bài này."
          : `Con điền dấu ${b.dauTre}, dấu đúng là ${dau}. Mẹo của cô giáo: miệng cá sấu luôn há về phía số lớn hơn — anh chị nhắc con câu đó.`,
    doTinCay: "cao",
    ngoaiTamKiem: [],
  };
}

/* ------------------------------------------------------------------ */
/* Trắc nghiệm                                                         */
/* ------------------------------------------------------------------ */

const CHU_CAI = ["A", "B", "C", "D", "E"];

export function chamTracNghiem(b: TracNghiem): KetQuaCham {
  if (b.chonTre === -1) {
    return chuaKetLuan(
      "trac-nghiem",
      "Trắc nghiệm",
      "Con khoanh nhiều hơn một đáp án nên Ô Ly không biết con chọn cái nào. Anh chị hỏi lại con nhé.",
    );
  }
  if (b.dapAnDung === null) {
    return chuaKetLuan(
      "trac-nghiem",
      "Trắc nghiệm",
      `Con khoanh ${b.chonTre === null ? "chưa có đáp án nào" : CHU_CAI[b.chonTre]}. Ô Ly không đọc được đề đầy đủ nên chưa biết đáp án đúng là gì, không dám chấm bài này.`,
      [],
      ["Đáp án đúng, vì Ô Ly không đọc được đủ đề trên ảnh"],
    );
  }
  const dung = b.chonTre === b.dapAnDung;
  const buoc: BuocCham[] = [
    {
      nhan: "đáp án khoanh",
      conViet: b.chonTre === null ? "bỏ trống" : CHU_CAI[b.chonTre],
      oLyTinh: CHU_CAI[b.dapAnDung],
      dung: b.chonTre === null ? null : dung,
      giaiThich: `Đáp án đúng là ${CHU_CAI[b.dapAnDung]}: ${b.luaChon[b.dapAnDung] ?? ""}`,
    },
  ];
  return {
    dang: "trac-nghiem",
    tenDang: "Trắc nghiệm",
    dung: b.chonTre === null ? null : dung,
    buoc,
    buocSaiDauTien: timBuocSai(buoc),
    trapId: null,
    choPhuHuynh: dung
      ? "Con khoanh đúng. Anh chị hỏi thêm con vì sao chọn đáp án đó — trắc nghiệm đúng mà không hiểu thì lần sau vẫn sai."
      : `Con khoanh ${b.chonTre === null ? "chưa có đáp án nào" : CHU_CAI[b.chonTre]}, đáp án đúng là ${CHU_CAI[b.dapAnDung]}. Anh chị đừng nói đáp án ngay, hỏi con vì sao loại các đáp án kia trước.`,
    doTinCay: "trung-binh",
    ngoaiTamKiem: ["Việc con hiểu bài hay khoanh may, vì trắc nghiệm không lộ ra bước làm"],
  };
}

/* ------------------------------------------------------------------ */
/* Bài giải có lời văn — dạng chiếm 6 trên 10 điểm của đề lớp 2         */
/* ------------------------------------------------------------------ */

export function chamBaiGiaiLoiVan(b: BaiGiaiLoiVan): KetQuaCham {
  const buoc: BuocCham[] = [];

  // Bước 1 — câu lời giải. Chỉ kiểm có hay không, không kiểm hay dở.
  const coLoiGiai = Boolean(b.cauLoiGiai && b.cauLoiGiai.trim().length >= 3);
  buoc.push({
    nhan: "câu lời giải",
    conViet: b.cauLoiGiai?.trim() || "bỏ trống",
    oLyTinh: coLoiGiai ? "có" : "cần có một câu lời giải",
    dung: coLoiGiai ? true : false,
    giaiThich: coLoiGiai
      ? "Con có viết câu lời giải trước phép tính, đúng như cô giáo yêu cầu."
      : "Bài toán có lời văn phải có câu lời giải trước phép tính. Thiếu câu này là mất điểm dù tính đúng.",
  });

  // Bước 2 — phép tính. Kiểm bằng cách tính lại, nên chắc chắn.
  const dangThuc = b.phepTinh ? tachDangThuc(b.phepTinh) : null;
  const veTraiTinh = dangThuc ? tinhBieuThuc(dangThuc.veTrai) : null;
  let ketQuaPhepTinh: number | null = null;

  if (!b.phepTinh) {
    buoc.push({
      nhan: "phép tính",
      conViet: "bỏ trống",
      oLyTinh: "cần có phép tính",
      dung: false,
      giaiThich: "Con chưa viết phép tính nào.",
    });
  } else if (!dangThuc || veTraiTinh === null) {
    buoc.push({
      nhan: "phép tính",
      conViet: b.phepTinh,
      oLyTinh: "không đọc được",
      dung: null,
      giaiThich: "Ô Ly đọc được dòng này nhưng không chắc đã đọc đúng từng ký hiệu nên không tính lại được.",
    });
  } else {
    ketQuaPhepTinh = veTraiTinh;
    const khop = dangThuc.ketQua === null ? null : dangThuc.ketQua === veTraiTinh;
    buoc.push({
      nhan: "phép tính",
      conViet: b.phepTinh,
      oLyTinh: `${dangThuc.veTrai} = ${veTraiTinh}`,
      dung: khop,
      giaiThich:
        khop === null
          ? "Con viết phép tính nhưng chưa viết kết quả."
          : khop
            ? `Ô Ly tính lại ${dangThuc.veTrai} cũng được ${veTraiTinh}. Con tính đúng.`
            : `Ô Ly tính lại ${dangThuc.veTrai} được ${veTraiTinh}, con viết ${dangThuc.ketQua}.`,
    });
  }

  // Bước 3 — đáp số phải khớp kết quả phép tính của chính con.
  const soDapSo = soDauTien(b.dapSo);
  const moc = dangThuc?.ketQua ?? ketQuaPhepTinh;
  buoc.push({
    nhan: "đáp số",
    conViet: b.dapSo?.trim() || "bỏ trống",
    oLyTinh: moc === null ? "chưa xác định" : String(moc),
    dung: b.dapSo === null || b.dapSo.trim() === "" ? false : moc === null ? null : soDapSo === moc,
    giaiThich:
      !b.dapSo || b.dapSo.trim() === ""
        ? "Bài toán có lời văn phải có dòng đáp số. Thiếu dòng này là mất điểm."
        : moc === null
          ? "Ô Ly chưa đối chiếu được đáp số với phép tính."
          : soDapSo === moc
            ? "Đáp số khớp với kết quả phép tính con vừa làm."
            : `Đáp số con ghi là ${soDapSo}, nhưng phép tính con vừa làm ra ${moc}. Con chép nhầm khi sang dòng đáp số.`,
  });

  const coDonViTrongDapSo = Boolean(b.dapSo && /[a-zA-ZÀ-ỹ]/.test(b.dapSo));
  if (b.dapSo && b.dapSo.trim() !== "" && !coDonViTrongDapSo) {
    buoc.push({
      nhan: "đơn vị ở đáp số",
      conViet: b.dapSo.trim(),
      oLyTinh: "cần kèm đơn vị",
      dung: false,
      giaiThich: "Đáp số phải kèm đơn vị, ví dụ 24 quả chứ không phải 24. Đây là lỗi mất điểm rất hay gặp.",
    });
  }

  const buocSai = timBuocSai(buoc);
  const coChuaKetLuan = buoc.some((x) => x.dung === null);
  const dung = coChuaKetLuan && buocSai === null ? null : buocSai === null;

  return {
    dang: "bai-giai-loi-van",
    tenDang: "Bài giải có lời văn",
    dung,
    buoc,
    buocSaiDauTien: buocSai,
    // Sai ở bước đáp số mà phép tính đúng là lỗi chép nhầm, không phải lỗi hiểu bài.
    trapId:
      buocSai !== null && buoc[buocSai].nhan === "đáp số" && buoc[1]?.dung === true
        ? null
        : buocSai !== null && buoc[buocSai].nhan === "phép tính"
          ? "BAY-QUEN-NHO"
          : null,
    choPhuHuynh: loiKhuyenBaiGiai(buoc, buocSai, dung),
    // Ô Ly tính lại được phép tính, nhưng không kết luận được phép tính ĐÓ có
    // hợp với đề hay không — đó là chỗ cần mắt của người lớn.
    doTinCay: "trung-binh",
    ngoaiTamKiem: [
      "Phép tính con chọn đã hợp với đề chưa — Ô Ly chỉ kiểm được phép tính đó tính có đúng không",
      "Câu lời giải con viết đã đúng ý chưa — Ô Ly chỉ kiểm được con có viết hay không",
    ],
  };
}

function loiKhuyenBaiGiai(buoc: BuocCham[], buocSai: number | null, dung: boolean | null): string {
  if (dung === true) {
    return "Con làm đủ ba phần: câu lời giải, phép tính và đáp số có đơn vị. Anh chị khen con đúng ở chỗ làm đủ ba phần — rất nhiều bạn tính đúng nhưng mất điểm vì thiếu phần.";
  }
  if (buocSai === null) {
    return "Ô Ly đọc được bài nhưng chưa kết luận được. Anh chị xem giúp con nhé.";
  }
  const b = buoc[buocSai];
  switch (b.nhan) {
    case "câu lời giải":
      return "Con làm thẳng vào phép tính mà bỏ câu lời giải. Anh chị nhắc con: đọc xong đề thì viết một câu nói rõ mình đang đi tìm cái gì, rồi mới tính.";
    case "phép tính":
      return `Con sai ở phép tính: ${b.giaiThich} Anh chị cho con đặt tính ra nháp rồi tính lại chậm từng cột.`;
    case "đáp số":
      return `${b.giaiThich} Đây là lỗi chép nhầm chứ không phải con không hiểu bài, nên anh chị đừng giảng lại cả bài — chỉ cần nhắc con đọc lại dòng trên trước khi ghi đáp số.`;
    default:
      return `${b.giaiThich} Anh chị nhắc con phần này nhé.`;
  }
}

/* ------------------------------------------------------------------ */
/* Đổi đơn vị đo                                                       */
/* ------------------------------------------------------------------ */

export function chamDoiDonVi(b: DoiDonVi): KetQuaCham {
  const nguon = QUY_DOI[b.donViNguon];
  const dich = QUY_DOI[b.donViDich];
  if (!nguon || !dich || nguon.nhom !== dich.nhom) {
    return chuaKetLuan(
      "doi-don-vi",
      "Đổi đơn vị đo",
      "Ô Ly chưa đọc rõ hai đơn vị của bài này nên không dám chấm.",
    );
  }
  const dapAn = (b.soNguon * nguon.heSo) / dich.heSo;
  const tron = Number.isInteger(dapAn);
  const buoc: BuocCham[] = [
    {
      nhan: "số sau khi đổi",
      conViet: viet(b.ketQuaTre),
      oLyTinh: tron ? String(dapAn) : `${dapAn} (không tròn)`,
      dung: b.ketQuaTre === null || !tron ? null : b.ketQuaTre === dapAn,
      giaiThich: `${b.soNguon} ${b.donViNguon} bằng ${dapAn} ${b.donViDich}.`,
    },
  ];
  const macBayDonVi = b.ketQuaTre === b.soNguon && dapAn !== b.soNguon;
  return {
    dang: "doi-don-vi",
    tenDang: "Đổi đơn vị đo",
    dung: b.ketQuaTre === null || !tron ? null : b.ketQuaTre === dapAn,
    buoc,
    buocSaiDauTien: timBuocSai(buoc),
    trapId: macBayDonVi ? "BAY-DON-VI" : null,
    choPhuHuynh: macBayDonVi
      ? `Con chép nguyên con số sang mà chưa đổi đơn vị — đề cho ${b.donViNguon} nhưng hỏi ${b.donViDich}. Đây là lỗi mất điểm nhiều nhất ở lứa tuổi này. Anh chị hỏi con: "Đề hỏi con bao nhiêu ${b.donViDich} hay bao nhiêu ${b.donViNguon}?"`
      : b.ketQuaTre === dapAn
        ? "Con đổi đúng đơn vị. Đây là chỗ rất nhiều bạn mất điểm, anh chị khen con nhé."
        : `Con viết ${viet(b.ketQuaTre)}, số đúng là ${dapAn}. Anh chị nhắc con quy tắc: 1 ${b.donViDich} bằng bao nhiêu ${b.donViNguon}?`,
    doTinCay: "cao",
    ngoaiTamKiem: [],
  };
}

/* ------------------------------------------------------------------ */
/* Đếm hình, xem giờ, nối ghép — phụ thuộc vào việc đọc được ĐỀ        */
/* ------------------------------------------------------------------ */

export function chamDemHinh(b: DemHinh): KetQuaCham {
  if (b.soThat === null) {
    return chuaKetLuan(
      "dem-hinh",
      "Đếm hình",
      `Con đếm được ${viet(b.ketQuaTre)}. Ô Ly đọc được con số con viết nhưng không đếm chắc chắn được số hình trong ảnh, nên không dám chấm. Anh chị đếm cùng con một lượt nhé.`,
      [],
      ["Số hình thật trong đề, vì đếm hình trên ảnh chụp nghiêng rất dễ sai"],
    );
  }
  const buoc: BuocCham[] = [
    {
      nhan: "số hình đếm được",
      conViet: viet(b.ketQuaTre),
      oLyTinh: String(b.soThat),
      dung: b.ketQuaTre === null ? null : b.ketQuaTre === b.soThat,
      giaiThich: `Ô Ly đếm được ${b.soThat} hình trong đề.`,
    },
  ];
  const lech = b.ketQuaTre !== null ? b.ketQuaTre - b.soThat : null;
  return {
    dang: "dem-hinh",
    tenDang: "Đếm hình",
    dung: b.ketQuaTre === null ? null : b.ketQuaTre === b.soThat,
    buoc,
    buocSaiDauTien: timBuocSai(buoc),
    trapId: lech !== null && lech !== 0 && Math.abs(lech) <= 2 ? "BAY-DEM-TRUNG" : null,
    choPhuHuynh:
      b.ketQuaTre === b.soThat
        ? "Con đếm đúng. Anh chị hỏi con đếm theo thứ tự nào — đếm có thứ tự mới là cái cần giữ."
        : lech !== null && lech > 0
          ? "Con đếm thừa, thường là do đếm một hình hai lần. Anh chị bảo con lấy bút đánh dấu từng hình đã đếm."
          : "Con đếm thiếu, thường là do bỏ sót hàng dưới cùng. Anh chị bảo con đếm hết hàng trên rồi mới xuống hàng dưới.",
    doTinCay: "thap",
    ngoaiTamKiem: ["Số hình thật, nếu ảnh chụp nghiêng hoặc thiếu một phần trang"],
  };
}

export function chamXemGio(b: XemGio): KetQuaCham {
  if (b.gioThat === null) {
    return chuaKetLuan(
      "xem-gio",
      "Xem giờ",
      `Con đọc là ${viet(b.gioTre)} giờ${b.phutTre !== null ? ` ${b.phutTre} phút` : ""}. Ô Ly không nhìn rõ hai kim đồng hồ trong ảnh nên không dám chấm.`,
      [],
      ["Vị trí hai kim trên đồng hồ trong đề"],
    );
  }
  const buoc: BuocCham[] = [
    {
      nhan: "số giờ",
      conViet: viet(b.gioTre),
      oLyTinh: String(b.gioThat),
      dung: b.gioTre === null ? null : b.gioTre === b.gioThat,
      giaiThich: `Kim ngắn chỉ ${b.gioThat} giờ.`,
    },
  ];
  if (b.phutThat !== null) {
    buoc.push({
      nhan: "số phút",
      conViet: viet(b.phutTre),
      oLyTinh: String(b.phutThat),
      dung: b.phutTre === null ? null : b.phutTre === b.phutThat,
      giaiThich: `Kim dài chỉ ${b.phutThat} phút.`,
    });
  }
  const doiKim = b.gioTre !== null && b.phutThat !== null && b.gioTre === b.phutThat / 5;
  return {
    dang: "xem-gio",
    tenDang: "Xem giờ",
    dung: buoc.every((x) => x.dung === true) ? true : buoc.some((x) => x.dung === false) ? false : null,
    buoc,
    buocSaiDauTien: timBuocSai(buoc),
    trapId: doiKim ? "BAY-DOC-GIO" : null,
    choPhuHuynh: doiKim
      ? "Con đọc nhầm kim dài thành kim giờ. Anh chị chỉ vào hai kim và hỏi con: kim nào ngắn hơn, và kim ngắn chỉ cái gì?"
      : buoc.every((x) => x.dung === true)
        ? `Con đọc đúng ${b.gioThat} giờ. Con phân biệt được kim ngắn với kim dài rồi, đó mới là chỗ khó của dạng này.`
        : `Con đọc là ${viet(b.gioTre)} giờ, đồng hồ chỉ ${b.gioThat} giờ. Anh chị lấy đồng hồ thật trong nhà cho con xoay kim vài lần là nhớ.`,
    doTinCay: "thap",
    ngoaiTamKiem: ["Vị trí kim trên hình vẽ, vì kim in mảnh rất dễ đọc nhầm trên ảnh chụp"],
  };
}

export function chamNoiGhep(b: NoiGhep): KetQuaCham {
  if (b.capDung === null) {
    return chuaKetLuan(
      "noi-ghep",
      "Nối cho đúng",
      `Ô Ly thấy con nối ${b.capTre.length} cặp nhưng không đọc được đủ hai cột trong đề nên không dám chấm.`,
      [],
      ["Nội dung đầy đủ của hai cột trong đề"],
    );
  }
  const dungMap = new Map(b.capDung.map((c) => [c.trai, c.phai]));
  const buoc: BuocCham[] = b.capTre.map((c) => ({
    nhan: `nối từ "${c.trai}"`,
    conViet: c.phai,
    oLyTinh: dungMap.get(c.trai) ?? "không có trong đề",
    dung: dungMap.has(c.trai) ? dungMap.get(c.trai) === c.phai : null,
    giaiThich: dungMap.has(c.trai)
      ? dungMap.get(c.trai) === c.phai
        ? `Con nối đúng: "${c.trai}" ứng với "${c.phai}".`
        : `"${c.trai}" phải nối với "${dungMap.get(c.trai)}", con nối sang "${c.phai}".`
      : `Ô Ly không tìm thấy "${c.trai}" trong đề.`,
  }));
  const thieu = b.capDung.length - b.capTre.length;
  if (thieu > 0) {
    buoc.push({
      nhan: "số cặp đã nối",
      conViet: String(b.capTre.length),
      oLyTinh: String(b.capDung.length),
      dung: false,
      giaiThich: `Đề có ${b.capDung.length} cặp, con mới nối ${b.capTre.length} cặp.`,
    });
  }
  const soSai = buoc.filter((x) => x.dung === false).length;
  return {
    dang: "noi-ghep",
    tenDang: "Nối cho đúng",
    dung: soSai === 0 ? (buoc.some((x) => x.dung === null) ? null : true) : false,
    buoc,
    buocSaiDauTien: timBuocSai(buoc),
    trapId: null,
    choPhuHuynh:
      soSai === 0
        ? "Con nối đúng hết các cặp. Anh chị hỏi con một cặp bất kỳ xem con giải thích được vì sao nối như vậy không."
        : `Con nối sai ${soSai} chỗ. Anh chị đừng chỉ chỗ sai ngay — bảo con đọc lại từng cặp một và tự kiểm tra, dạng này con tự tìm ra được.`,
    doTinCay: "trung-binh",
    ngoaiTamKiem: ["Các nét nối con vẽ, nếu nét mờ hoặc cắt qua nhau trên ảnh"],
  };
}

/* ------------------------------------------------------------------ */
/* Dạng chưa nhận ra — nhánh bắt buộc phải có                          */
/* ------------------------------------------------------------------ */

export function chamChuaNhanDang(b: ChuaNhanDang): KetQuaCham {
  return chuaKetLuan(
    "chua-nhan-dang",
    "Dạng bài Ô Ly chưa nhận ra",
    `Ô Ly đọc được nội dung trên trang nhưng chưa xếp được vào dạng bài nào đã biết, nên không chấm để khỏi chấm sai. Đây là phần Ô Ly đọc được: "${b.docDuoc}". Lần chụp này không bị trừ lượt.`,
    [
      {
        nhan: "nội dung đọc được",
        conViet: b.docDuoc,
        oLyTinh: "chưa xếp được dạng",
        dung: null,
        giaiThich: b.ghiChu ?? "Ô Ly sẽ ghi nhận dạng bài này để bổ sung.",
      },
    ],
    ["Toàn bộ bài này, vì Ô Ly chưa nhận ra dạng"],
  );
}
