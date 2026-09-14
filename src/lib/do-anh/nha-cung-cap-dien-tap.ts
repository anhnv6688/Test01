import { createHash } from "node:crypto";
import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";
import { Rng } from "@/lib/domain/rng";
import type { MucChiTiet, LoiGiang } from "@/lib/domain/teaching";
import type { GoiGuiDi } from "@/lib/privacy/envelope";
import {
  GIAI_THICH_LOI,
  type ChatLuongAnh,
  type ChiPhiLanGoi,
  type KetQuaXuLy,
  type NhaCungCapXuLyAnh,
} from "@/lib/vision/provider";
import type { NhanBoAnh, NhanMotAnh } from "./nhan";

/**
 * Nhà cung cấp DIỄN TẬP: trả về đúng nhãn, có gài sẵn một số lỗi đã biết trước.
 *
 * Đây không phải để giả vờ đã đo xong. Nó có đúng một việc: chứng minh bộ đo
 * thật sự bắt được lỗi, TRƯỚC khi có ảnh thật và trước khi tiêu đồng nào gọi
 * mô hình. Một bộ đo chưa ai thử thì lúc chạy trên ảnh thật, con số 0 báo động
 * giả có thể nghĩa là sản phẩm tốt, mà cũng có thể nghĩa là hàm so sánh hỏng —
 * và không cách nào phân biệt. Diễn tập gài 5 lỗi rồi đòi báo cáo nêu đúng 5,
 * nên nếu hàm so sánh hỏng thì biết ngay hôm nay.
 *
 * Mọi con số nó sinh ra đều là số diễn tập. Báo cáo chạy bằng nhà cung cấp này
 * KHÔNG được dùng để trả lời điều kiện ra mắt số 3 hay số 9.
 *
 * Nó nhận diện ảnh bằng vân tay nội dung tệp, không bằng tên tệp, vì gói gửi đi
 * theo BR-34 cố ý không mang tên tệp — và bản diễn tập cũng không được phép có
 * đặc quyền nào mà nhà cung cấp thật không có.
 */
export interface CauHinhDienTap {
  /** Xác suất đọc sai một chữ số trong bài. Đây là lỗi hay lật kết luận nhất. */
  tyLeSaiChuSo: number;
  /** Xác suất bỏ sót hẳn một bài trên trang. */
  tyLeBoBai: number;
  /** Xác suất từ chối một ảnh mà người đọc được. */
  tyLeTuChoiOan: number;
  /** Xác suất đọc bừa một ảnh mà người không đọc nổi. */
  tyLeDocBua: number;
  hat: number;
}

export const DIEN_TAP_MAC_DINH: CauHinhDienTap = {
  tyLeSaiChuSo: 0.12,
  tyLeBoBai: 0.05,
  tyLeTuChoiOan: 0.05,
  tyLeDocBua: 0.2,
  hat: 20260914,
};

/** Số lỗi đã gài vào một tấm ảnh, để đối chiếu với những gì báo cáo bắt được. */
export interface DaGaiLoi {
  saiChuSo: number;
  boBai: number;
  tuChoiOan: number;
  docBua: number;
}

export function congDaGai(a: DaGaiLoi, b: DaGaiLoi): DaGaiLoi {
  return {
    saiChuSo: a.saiChuSo + b.saiChuSo,
    boBai: a.boBai + b.boBai,
    tuChoiOan: a.tuChoiOan + b.tuChoiOan,
    docBua: a.docBua + b.docBua,
  };
}

export function coLoi(g: DaGaiLoi): boolean {
  return g.saiChuSo + g.boBai + g.tuChoiOan + g.docBua > 0;
}

function vanTay(anhBase64: string): string {
  return createHash("sha256").update(anhBase64).digest("hex");
}

/**
 * Đổi con số trẻ đã viết thành một số khác.
 *
 * Cố ý chỉ đụng vào trường ghi BÀI LÀM CỦA TRẺ, không đụng vào trường ghi đề.
 * Lỗi đọc nhầm đề và lỗi đọc nhầm bài làm có hệ quả khác hẳn nhau, và bộ đo
 * phải phân biệt được; trộn chung sẽ không biết mình đang đo cái gì.
 *
 * Trả về null khi bài không có chỗ nào để làm sai (ví dụ trẻ bỏ trống).
 */
export function lamSaiMotChuSo(b: DangBaiLam, r: Rng): DangBaiLam | null {
  const lech = (n: number): number => (r.next() < 0.5 ? n + 1 : Math.max(0, n - 1));
  switch (b.dang) {
    case "cot-doc": {
      const i = b.chuSoTre.findIndex((x) => x !== null);
      if (i === -1) return null;
      const moi = [...b.chuSoTre];
      moi[i] = (((moi[i] as number) + 1) % 10);
      return { ...b, chuSoTre: moi };
    }
    case "hang-ngang":
      return b.ketQuaTre === null ? null : { ...b, ketQuaTre: lech(b.ketQuaTre) };
    case "dien-so":
      return b.soTre === null ? null : { ...b, soTre: lech(b.soTre) };
    case "so-sanh": {
      if (b.dauTre === null) return null;
      const khac = (["<", ">", "="] as const).filter((x) => x !== b.dauTre);
      return { ...b, dauTre: r.pick(khac) };
    }
    case "trac-nghiem": {
      if (b.chonTre === null || b.luaChon.length < 2) return null;
      return { ...b, chonTre: (b.chonTre + 1) % b.luaChon.length };
    }
    case "bai-giai-loi-van": {
      if (!b.phepTinh) return null;
      // Đọc nhầm một chữ số trong phép tính trẻ viết.
      let daDoi = false;
      const moi = b.phepTinh.replace(/\d/g, (c) => {
        if (daDoi) return c;
        daDoi = true;
        return String((Number(c) + 1) % 10);
      });
      return daDoi ? { ...b, phepTinh: moi } : null;
    }
    case "doi-don-vi":
      return b.ketQuaTre === null ? null : { ...b, ketQuaTre: lech(b.ketQuaTre) };
    case "dem-hinh":
      return b.ketQuaTre === null ? null : { ...b, ketQuaTre: lech(b.ketQuaTre) };
    case "xem-gio": {
      if (b.gioTre === null && b.phutTre === null) return null;
      if (b.phutTre !== null) return { ...b, phutTre: (b.phutTre + 5) % 60 };
      return { ...b, gioTre: ((b.gioTre as number) % 12) + 1 };
    }
    case "noi-ghep": {
      if (b.capTre.length < 2) return null;
      const moi = [...b.capTre];
      // Đọc nhầm đường nối: tráo hai vế phải cho nhau.
      [moi[0], moi[1]] = [
        { ...moi[0], phai: moi[1].phai },
        { ...moi[1], phai: moi[0].phai },
      ];
      return { ...b, capTre: moi };
    }
    case "chua-nhan-dang":
      // Dạng này vốn không có kết luận nên làm sai nó không đo được gì.
      return null;
    default: {
      const _het: never = b;
      return _het;
    }
  }
}

function chiPhiDienTap(goi: GoiGuiDi, batDau: number, r: Rng): ChiPhiLanGoi {
  const anh = Math.round(goi.anhBase64.length / 100);
  return {
    tokenVaoMoi: anh + 10,
    tokenVaoTuDem: 2000,
    tokenRa: r.int(500, 1100),
    thoiGianMs: Date.now() - batDau + r.int(700, 2600),
    model: "claude-haiku-4-5-dien-tap",
  };
}

export class NhaCungCapDienTap implements NhaCungCapXuLyAnh {
  ten = "diễn tập (không gọi ra mạng)";
  thoaThuan = {
    daKy: true,
    camDungDeHuanLuyen: true,
    camLuuGiu: true,
    ngayKy: null,
  };

  /**
   * Lỗi đã gài, ghi theo TỪNG TẤM ẢNH chứ không chỉ tổng.
   *
   * Tổng không kiểm lại được bộ đo. Bỏ sót một bài giữa trang làm mọi bài sau
   * nó lệch đi một nhịp, nên một lỗi gài vào có thể hiện ra thành bốn dòng lệch
   * — và đó là hành vi ĐÚNG của hàm so khớp, xem ghi chú ở soKhopCacBai. So
   * tổng với tổng sẽ báo động nhầm. Điều kiểm được là: ảnh nào không gài lỗi
   * thì phải sạch, ảnh nào có gài thì phải lộ ra.
   */
  daGai = new Map<string, DaGaiLoi>();

  private theoVanTay = new Map<string, NhanMotAnh>();

  constructor(
    nhan: NhanBoAnh,
    anhTheoTep: Map<string, string>,
    private cauHinh: CauHinhDienTap = DIEN_TAP_MAC_DINH,
  ) {
    for (const a of nhan.anh) {
      const b64 = anhTheoTep.get(a.tep);
      if (b64) this.theoVanTay.set(vanTay(b64), a);
    }
  }

  private ghiLoi(tep: string, loai: keyof DaGaiLoi): void {
    const g = this.daGai.get(tep) ?? { saiChuSo: 0, boBai: 0, tuChoiOan: 0, docBua: 0 };
    g[loai]++;
    this.daGai.set(tep, g);
  }

  /** Đã gài lỗi gì vào tấm ảnh này. */
  loiCuaAnh(tep: string): DaGaiLoi {
    return this.daGai.get(tep) ?? { saiChuSo: 0, boBai: 0, tuChoiOan: 0, docBua: 0 };
  }

  tongDaGai(): DaGaiLoi {
    let t: DaGaiLoi = { saiChuSo: 0, boBai: 0, tuChoiOan: 0, docBua: 0 };
    for (const g of this.daGai.values()) t = congDaGai(t, g);
    return t;
  }

  async xuLy(goi: GoiGuiDi, chatLuong: ChatLuongAnh): Promise<KetQuaXuLy> {
    // Bản diễn tập cố ý KHÔNG dùng số đo chất lượng ảnh. Việc ảnh tối hay nhòe
    // đã nằm trong nhãn (nguoiDocDuoc, dieuKienChup) rồi; chặn thêm một lần nữa
    // theo số đo sẽ làm ảnh xấu không bao giờ tới được phần đọc, mà đó chính là
    // phần bộ đo muốn quan sát.
    void chatLuong;
    const batDau = Date.now();
    const a = this.theoVanTay.get(vanTay(goi.anhBase64));
    if (!a) {
      return {
        ok: false,
        loi: { ma: "khong-thay-chu", noiGiVoiPhuHuynh: GIAI_THICH_LOI["khong-thay-chu"] },
      };
    }
    // Cùng một ảnh phải luôn cho cùng một kết quả, để chạy lại bộ đo là so được.
    const r = new Rng(
      this.cauHinh.hat ^ Number.parseInt(vanTay(goi.anhBase64).slice(0, 8), 16),
    );
    const chiPhi = chiPhiDienTap(goi, batDau, r);

    if (!a.nguoiDocDuoc) {
      if (r.next() < this.cauHinh.tyLeDocBua) {
        this.ghiLoi(a.tep, "docBua");
        return {
          ok: true,
          chiPhi,
          ketQua: {
            loai: "cham-bai-lam",
            cacBai: [{ dang: "chua-nhan-dang", docDuoc: "(đọc bừa)", ghiChu: null }],
            buocDocDuoc: [],
          },
        };
      }
      return {
        ok: false,
        chiPhi,
        loi: { ma: "anh-mo", noiGiVoiPhuHuynh: GIAI_THICH_LOI["anh-mo"] },
      };
    }

    if (r.next() < this.cauHinh.tyLeTuChoiOan) {
      this.ghiLoi(a.tep, "tuChoiOan");
      return {
        ok: false,
        chiPhi,
        loi: { ma: "anh-nghieng", noiGiVoiPhuHuynh: GIAI_THICH_LOI["anh-nghieng"] },
      };
    }

    if (a.loaiViec === "doc-de-bai") {
      return {
        ok: true,
        chiPhi,
        ketQua: {
          loai: "doc-de-bai",
          deBai: a.deBai ?? "",
          de: { dang: "loi-van", noiDung: a.deBai ?? "" },
          cacSo: ((a.deBai ?? "").match(/\d+/g) ?? []).map(Number),
          nghiNgo: null,
        },
      };
    }

    const ra: DangBaiLam[] = [];
    for (const b of a.cacBai ?? []) {
      if (r.next() < this.cauHinh.tyLeBoBai) {
        this.ghiLoi(a.tep, "boBai");
        continue;
      }
      if (r.next() < this.cauHinh.tyLeSaiChuSo) {
        const sai = lamSaiMotChuSo(b, r);
        if (sai) {
          this.ghiLoi(a.tep, "saiChuSo");
          ra.push(sai);
          continue;
        }
      }
      ra.push(b);
    }
    return { ok: true, chiPhi, ketQua: { loai: "cham-bai-lam", cacBai: ra, buocDocDuoc: [] } };
  }

  async soanLoiGiang(deBai: string, muc: MucChiTiet): Promise<LoiGiang | null> {
    // Bản diễn tập không soạn giảng thật; nó chỉ tồn tại để nhánh tầng 2 của
    // bộ đo chạy tới nơi và đếm được số lần chạm tầng 2.
    return {
      mucChiTiet: muc,
      deBai,
      yeuCauCanDat: "",
      buoc: [{ tieuDe: "Diễn tập", lamGi: "Bản diễn tập không soạn giảng.", hoiCon: "" }],
      dapAn: 0,
      choHaySai: [],
      neuVanChuaHieu: "",
      nhanMay: "diễn tập",
    };
  }
}
