import { createHash } from "node:crypto";
import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";
import { DO_VAT } from "@/lib/domain/names";
import { Rng } from "@/lib/domain/rng";
import { TEMPLATES } from "@/lib/domain/templates";
import { sinhBai } from "@/lib/domain/generator";
import type { GoiGuiDi } from "@/lib/privacy/envelope";
import {
  GIAI_THICH_LOI,
  tienKiemChatLuong,
  type ChatLuongAnh,
  type KetQuaXuLy,
  type NhaCungCapXuLyAnh,
} from "./provider";

/**
 * Nhà cung cấp giả lập dùng cho môi trường phát triển và trình diễn.
 *
 * Bản dựng này KHÔNG gọi ra dịch vụ bên ngoài nào. Nó có hai việc:
 *   1. Cho phép chạy trọn vẹn luồng nghiệp vụ nhóm F mà chưa cần ký hợp đồng
 *      với nhà cung cấp thật (CR-03, CR-16 chưa hoàn thành thì chưa được xử lý
 *      dữ liệu thật, nên đây cũng là cách tuân thủ trong lúc phát triển).
 *   2. Làm chỗ đối chiếu khi đo chi phí thật một trang — điều kiện ra mắt số 3.
 *
 * Kết quả suy ra từ băm nội dung ảnh nên cùng một ảnh luôn cho cùng một kết quả,
 * tiện cho kiểm thử và cho việc bấm giờ.
 */
export class NhaCungCapGiaLap implements NhaCungCapXuLyAnh {
  ten = "gia-lap-noi-bo";
  thoaThuan = {
    daKy: true,
    camDungDeHuanLuyen: true,
    camLuuGiu: true,
    ngayKy: "2026-09-13",
  };

  async xuLy(goi: GoiGuiDi, chatLuong: ChatLuongAnh): Promise<KetQuaXuLy> {
    const loi = tienKiemChatLuong(chatLuong);
    if (loi) {
      return { ok: false, loi: { ma: loi, noiGiVoiPhuHuynh: GIAI_THICH_LOI[loi] } };
    }

    const hat = Number.parseInt(createHash("sha256").update(goi.anhBase64).digest("hex").slice(0, 8), 16);
    const r = new Rng(hat);

    if (goi.loaiViec === "doc-de-bai") {
      const t = r.pick(TEMPLATES);
      const bai = sinhBai(t.id, r.int(1, 2_000_000_000));
      return {
        ok: true,
        ketQua: {
          loai: "doc-de-bai",
          deBai: bai.prompt,
          khuonDangKhop: t.id,
          cacSo: (bai.prompt.match(/\d+/g) ?? []).map(Number),
          nghiNgo: null,
        },
      };
    }

    // Chấm bài: dựng một trang vở gồm vài bài thuộc các dạng khác nhau, có gài
    // sẵn lỗi điển hình, để luồng chỉ-ra-bước-sai của BR-28 chạy được đầy đủ
    // trên mọi dạng mà VM-08 yêu cầu.
    const cacBai: DangBaiLam[] = [];

    // Bài 1 — đặt tính cột dọc, có nhớ hoặc có mượn.
    const phep = r.pick(["+", "-"] as const);
    let a: number;
    let b: number;
    if (phep === "+") {
      const dvA = r.int(4, 9);
      a = r.int(1, 4) * 10 + dvA;
      b = r.int(1, 4) * 10 + r.int(10 - dvA, 9);
    } else {
      const dvA = r.int(0, 4);
      a = r.int(4, 9) * 10 + dvA;
      b = r.int(1, 3) * 10 + r.int(dvA + 1, 9);
    }
    const dung = phep === "+" ? a + b : a - b;
    const chuSoDung = String(dung).split("").reverse().map(Number);
    const chuSoTre: (number | null)[] = chuSoDung.slice();
    // Một phần ba số lần trẻ làm đúng hết — nếu lúc nào cũng sai thì tính năng
    // trở thành cỗ máy bới lỗi, đi ngược BR-29.
    if (r.next() >= 0.34) {
      if (phep === "+") {
        if (chuSoTre.length > 1) chuSoTre[1] = (chuSoTre[1]! + 9) % 10;
      } else {
        chuSoTre[0] = Math.abs((a % 10) - (b % 10));
        if (chuSoTre.length > 1) chuSoTre[1] = (chuSoTre[1]! + 1) % 10;
      }
    }
    cacBai.push({ dang: "cot-doc", soA: a, soB: b, phep, chuSoTre });

    // Bài 2 — một dạng khác, rút ngẫu nhiên trong các dạng còn lại.
    cacBai.push(baiThuHai(r));

    // Bài 3 — bài giải có lời văn, dạng chiếm phần lớn số điểm của đề lớp 2.
    cacBai.push(baiGiaiLoiVan(r));

    return {
      ok: true,
      ketQua: {
        loai: "cham-bai-lam",
        cacBai,
        buocDocDuoc: [
          { nhan: "bài 1, dòng đề", noiDung: `${a} ${phep} ${b}` },
          { nhan: "bài 1, dòng kết quả", noiDung: chuSoTre.slice().reverse().join("") },
          { nhan: "số bài đọc được trên trang", noiDung: String(cacBai.length) },
        ],
      },
    };
  }
}

function baiThuHai(r: Rng): DangBaiLam {
  const kieu = r.int(0, 5);
  if (kieu === 0) {
    const x = r.int(11, 49);
    const y = r.int(11, 49);
    const sai = r.next() < 0.5;
    return { dang: "hang-ngang", veTrai: `${x} + ${y}`, ketQuaTre: sai ? x + y - 10 : x + y };
  }
  if (kieu === 1) {
    const tong = r.int(10, 40);
    const bit = r.int(1, tong - 1);
    const sai = r.next() < 0.5;
    return {
      dang: "dien-so",
      bieuThuc: `${tong - bit} + ? = ${tong}`,
      soTre: sai ? bit + r.int(1, 3) : bit,
    };
  }
  if (kieu === 2) {
    const t = r.int(10, 99);
    const p = r.int(10, 99);
    const dauDung = t > p ? ">" : t < p ? "<" : "=";
    const sai = r.next() < 0.4;
    return {
      dang: "so-sanh",
      veTrai: String(t),
      vePhai: String(p),
      dauTre: sai ? (dauDung === ">" ? "<" : ">") : dauDung,
    };
  }
  if (kieu === 3) {
    const met = r.int(2, 9);
    const sai = r.next() < 0.5;
    return {
      dang: "doi-don-vi",
      soNguon: met * 100,
      donViNguon: "cm",
      donViDich: "m",
      // Mắc bẫy đơn vị: chép nguyên con số xăng-ti-mét sang ô hỏi mét.
      ketQuaTre: sai ? met * 100 : met,
    };
  }
  if (kieu === 4) {
    const gio = r.int(1, 12);
    const phut = r.pick([0, 15, 30] as const);
    const sai = phut !== 0 && r.next() < 0.5;
    return {
      dang: "xem-gio",
      gioThat: gio,
      phutThat: phut,
      gioTre: sai ? phut / 5 : gio,
      phutTre: phut,
    };
  }
  const hang = r.int(2, 4);
  const moiHang = r.int(3, 6);
  const sai = r.next() < 0.5;
  return {
    dang: "dem-hinh",
    soThat: hang * moiHang,
    ketQuaTre: sai ? (hang - 1) * moiHang : hang * moiHang,
  };
}

function baiGiaiLoiVan(r: Rng): DangBaiLam {
  const dau = r.int(20, 90);
  const bot = r.int(5, 19);
  const dv = r.pick(DO_VAT);
  const dungKetQua = dau - bot;
  const kieuSai = r.int(0, 3);
  return {
    dang: "bai-giai-loi-van",
    deBai: null,
    // Kiểu sai 1: quên câu lời giải.
    cauLoiGiai: kieuSai === 1 ? null : `Số ${dv.ten} còn lại là:`,
    // Kiểu sai 2: tính sai.
    phepTinh: `${dau} - ${bot} = ${kieuSai === 2 ? dungKetQua + 10 : dungKetQua}`,
    // Kiểu sai 3: chép nhầm sang dòng đáp số.
    dapSo:
      kieuSai === 3
        ? `${dungKetQua + 1} ${dv.dv}`
        : `${kieuSai === 2 ? dungKetQua + 10 : dungKetQua} ${dv.dv}`,
  };
}
