/**
 * Chấm phép tính đặt theo cột dọc, chỉ ra SAI Ở BƯỚC NÀO.
 *
 * BR-28 nói rõ thước đo: với bài đặt tính theo cột dọc, hệ thống phải chỉ đúng
 * vị trí bước sai chứ không chỉ báo kết quả sai. Quan sát 4 của BRD là lý do:
 * trên giấy, "96 − 24 − 40 = 32" đúng kết quả nhưng giấu mất bước tư duy, còn
 * khi sai thì không ai biết sai ở đâu.
 *
 * BR-29: sai thì giải thích vì sao sai, đúng thì nói rõ đúng ở chỗ nào.
 */
export type PhepTinh = "+" | "-";

export interface BuocCot {
  /** 0 là cột đơn vị, 1 là cột chục, 2 là cột trăm. */
  cot: number;
  tenCot: string;
  chuSoTren: number;
  chuSoDuoi: number;
  nhoVao: number;
  chuSoDung: number;
  nhoRa: number;
  chuSoTre: number | null;
  dung: boolean;
  giaiThich: string;
}

export interface KetQuaChamCot {
  dung: boolean;
  ketQuaDung: number;
  ketQuaTre: number | null;
  buoc: BuocCot[];
  /** Bước sai đầu tiên, tính từ cột đơn vị. null nếu không sai bước nào. */
  buocSaiDauTien: number | null;
  /** Mã bẫy suy ra từ kiểu sai, dùng để nối vào bản tin tối (BR-04, BR-08). */
  trapId: string | null;
  /** Câu viết cho phụ huynh đọc. */
  choPhuHuynh: string;
}

const TEN_COT = ["đơn vị", "chục", "trăm", "nghìn"];

function chuSo(n: number, cot: number): number {
  return Math.floor(Math.abs(n) / 10 ** cot) % 10;
}

/**
 * @param chuSoTre Các chữ số trẻ viết ở dòng kết quả, TỪ PHẢI SANG TRÁI.
 *                 Dùng null cho ô trẻ bỏ trống.
 */
export function chamCotDoc(
  a: number,
  b: number,
  phep: PhepTinh,
  chuSoTre: (number | null)[],
): KetQuaChamCot {
  const ketQuaDung = phep === "+" ? a + b : a - b;
  const soCot = Math.max(String(Math.abs(ketQuaDung)).length, String(a).length, String(b).length);
  const buoc: BuocCot[] = [];
  let nho = 0;

  for (let c = 0; c < soCot; c++) {
    const tren = chuSo(a, c);
    const duoi = chuSo(b, c);
    let chuSoDung: number;
    let nhoRa = 0;
    if (phep === "+") {
      const tong = tren + duoi + nho;
      chuSoDung = tong % 10;
      nhoRa = tong >= 10 ? 1 : 0;
    } else {
      let hieu = tren - duoi - nho;
      if (hieu < 0) {
        hieu += 10;
        nhoRa = 1;
      }
      chuSoDung = hieu;
    }
    const viet = chuSoTre[c] ?? null;
    const dung = viet === chuSoDung;
    buoc.push({
      cot: c,
      tenCot: TEN_COT[c] ?? `hàng thứ ${c + 1}`,
      chuSoTren: tren,
      chuSoDuoi: duoi,
      nhoVao: nho,
      chuSoDung,
      nhoRa,
      chuSoTre: viet,
      dung,
      giaiThich: giaiThichCot(phep, tren, duoi, nho, chuSoDung, nhoRa, viet, TEN_COT[c] ?? "hàng này"),
    });
    nho = nhoRa;
  }

  const buocSai = buoc.find((x) => !x.dung) ?? null;
  const ketQuaTre = chuSoTre.every((d) => d === null)
    ? null
    : chuSoTre.reduce<number>((s, d, i) => s + (d ?? 0) * 10 ** i, 0);

  const trapId = suyRaBay(phep, buoc, buocSai);

  return {
    dung: buocSai === null,
    ketQuaDung,
    ketQuaTre,
    buoc,
    buocSaiDauTien: buocSai?.cot ?? null,
    trapId,
    choPhuHuynh: vietChoPhuHuynh(phep, buoc, buocSai, trapId),
  };
}

function giaiThichCot(
  phep: PhepTinh,
  tren: number,
  duoi: number,
  nhoVao: number,
  chuSoDung: number,
  nhoRa: number,
  viet: number | null,
  tenCot: string,
): string {
  const themNho = nhoVao > 0 ? ` cộng thêm ${nhoVao} nhớ` : "";
  if (phep === "+") {
    const tong = tren + duoi + nhoVao;
    const goc = `Cột ${tenCot}: ${tren} + ${duoi}${themNho} được ${tong}`;
    const sau = nhoRa ? `, viết ${chuSoDung} nhớ 1 sang cột bên trái` : `, viết ${chuSoDung}`;
    if (viet === chuSoDung) return `${goc}${sau}. Con viết đúng.`;
    if (viet === null) return `${goc}${sau}. Con bỏ trống ô này.`;
    return `${goc}${sau}. Con viết ${viet}.`;
  }
  const phaiMuon = tren - duoi - nhoVao < 0;
  const boTru = phaiMuon ? tren + 10 : tren;
  const bot = nhoVao > 0 ? `, rồi trả thêm 1 chục đã mượn ở cột bên phải,` : "";
  const goc = `Cột ${tenCot}: ${boTru} − ${duoi}${bot} được ${chuSoDung}`;
  const sau = phaiMuon ? " (phải mượn 1 chục của cột bên trái)" : "";
  if (viet === chuSoDung) return `${goc}${sau}. Con viết đúng.`;
  if (viet === null) return `${goc}${sau}. Con bỏ trống ô này.`;
  return `${goc}${sau}. Con viết ${viet}.`;
}

function suyRaBay(phep: PhepTinh, buoc: BuocCot[], sai: BuocCot | null): string | null {
  if (!sai) return null;
  // Cộng: viết đúng phần dư nhưng cột bên trái thiếu đúng 1 → quên nhớ.
  if (phep === "+") {
    const truoc = buoc[sai.cot - 1];
    if (truoc && truoc.nhoRa === 1 && sai.chuSoTre === (sai.chuSoDung + 9) % 10) return "BAY-QUEN-NHO";
    if (sai.nhoVao === 1 && sai.chuSoTre === (sai.chuSoDung + 9) % 10) return "BAY-QUEN-NHO";
  } else {
    // Trừ: lấy chữ số lớn trừ chữ số bé cho khỏi phải mượn.
    if (sai.chuSoTre === Math.abs(sai.chuSoTren - sai.chuSoDuoi)) return "BAY-QUEN-NHO";
  }
  return null;
}

function vietChoPhuHuynh(
  phep: PhepTinh,
  buoc: BuocCot[],
  sai: BuocCot | null,
  trapId: string | null,
): string {
  if (!sai) {
    const coNho = buoc.some((b) => b.nhoRa === 1);
    return coNho
      ? `Con làm đúng cả bài, và đúng cả ở chỗ khó nhất là bước ${phep === "+" ? "nhớ" : "mượn"} sang cột bên cạnh. Anh chị khen con đúng chỗ này nhé.`
      : "Con làm đúng cả bài. Bài này không có bước nhớ nên anh chị có thể cho con thử một bài có nhớ xem sao.";
  }
  if (trapId === "BAY-QUEN-NHO") {
    return phep === "+"
      ? `Con sai từ cột ${sai.tenCot}: cột bên phải đã vượt quá 9 nên có 1 chục phải chuyển sang, nhưng con chưa cộng thêm số nhớ đó. Đây là lỗi kỹ thuật, không phải con không hiểu bài.`
      : `Con sai từ cột ${sai.tenCot}: chữ số ở trên nhỏ hơn chữ số ở dưới nên phải mượn 1 chục, nhưng con lấy luôn số lớn trừ số bé cho khỏi phải mượn. Rất nhiều bạn làm tắt như vậy.`;
  }
  return `Con sai bắt đầu từ cột ${sai.tenCot}. Các cột bên phải cột đó con làm đúng rồi, nên anh chị chỉ cần chữa đúng một cột này thôi.`;
}
