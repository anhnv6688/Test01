import { createHash } from "node:crypto";
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

    // Chấm bài: dựng một phép tính cột dọc có nhớ, và gài sẵn một lỗi điển hình
    // để luồng chỉ-ra-bước-sai của BR-28 chạy được đầy đủ.
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

    // Một phần ba số lần trẻ làm đúng hết — nếu lúc nào cũng sai thì tính năng
    // trở thành cỗ máy bới lỗi, đi ngược BR-29.
    const lamDung = r.next() < 0.34;
    const chuSoTre: (number | null)[] = chuSoDung.slice();
    if (!lamDung) {
      if (phep === "+") {
        // Quên nhớ: cột chục thiếu đúng 1.
        if (chuSoTre.length > 1) chuSoTre[1] = (chuSoTre[1]! + 9) % 10;
      } else {
        // Lấy chữ số lớn trừ chữ số bé ở cột đơn vị cho khỏi phải mượn.
        chuSoTre[0] = Math.abs((a % 10) - (b % 10));
        if (chuSoTre.length > 1) chuSoTre[1] = (chuSoTre[1]! + 1) % 10;
      }
    }

    return {
      ok: true,
      ketQua: {
        loai: "cham-bai-lam",
        phepTinh: phep,
        soA: a,
        soB: b,
        chuSoTre,
        buocDocDuoc: [
          { nhan: "dòng đề", noiDung: `${a} ${phep} ${b}` },
          { nhan: "dòng kết quả", noiDung: chuSoTre.slice().reverse().join("") },
        ],
      },
    };
  }
}

let nhaCungCap: NhaCungCapXuLyAnh = new NhaCungCapGiaLap();

export function layNhaCungCap(): NhaCungCapXuLyAnh {
  return nhaCungCap;
}

/** Dùng khi cắm nhà cung cấp thật, hoặc khi kiểm thử (RR-08). */
export function datNhaCungCap(n: NhaCungCapXuLyAnh): void {
  nhaCungCap = n;
}
