import { createHmac, randomBytes, randomUUID } from "node:crypto";
import {
  HAN_DUNG_PHUT, NOI_GI_KHI_MA_HONG, NOI_GI_KHI_TU_CHOI_GUI, SO_LAN_SAI_TOI_DA,
  bamMa, duocGuiKhong, kiemMa, sinhMa,
  type BanGhiMa, type LyDoMaHong, type LyDoTuChoiGui,
} from "@/lib/privacy/ma-mot-lan";
import { chuanHoaSo, haiSoCuoi } from "@/lib/privacy/so-dien-thoai";
import { layNhaCungCapSms } from "@/lib/sms/chon-nha-cung-cap";
import { soanTinNhan } from "@/lib/sms/provider";
import { getDb } from "./db";

/**
 * Luồng gửi và kiểm mã một lần.
 *
 * Một điều kiện của cả tệp này, và có bài kiểm thử canh: mã dưới dạng rõ chỉ
 * tồn tại trong đúng một biến cục bộ của hàm guiMa, đủ lâu để đưa cho nhà cung
 * cấp tin nhắn. Nó không được ghi xuống cơ sở dữ liệu, không được ghi ra nhật
 * ký, và không được trả về cho máy khách — trừ đúng một trường hợp nói rõ ở
 * cuối tệp.
 */

function khoaBamSo(): string {
  const d = getDb();
  const co = d.prepare("SELECT gia_tri FROM bi_mat WHERE ten = ?").get("bam-so-dien-thoai") as
    | { gia_tri: string }
    | undefined;
  if (co) return co.gia_tri;
  const moi = randomBytes(32).toString("hex");
  d.prepare("INSERT INTO bi_mat (ten, gia_tri, tao_luc) VALUES (?,?,?)").run(
    "bam-so-dien-thoai", moi, new Date().toISOString(),
  );
  return moi;
}

/** Vân tay của một thuê bao. Cùng số luôn ra cùng vân tay, nên đếm được. */
export function bamSoMay(soDaChuan: string): string {
  return createHmac("sha256", khoaBamSo()).update(soDaChuan).digest("hex");
}

function mocTrongMotGio(): string {
  return new Date(Date.now() - 3600_000).toISOString();
}

export type KetQuaGuiMa =
  | { ok: true; haiSoCuoi: string; hetHanLuc: string; maHienThi: string | null }
  | { ok: false; lyDo: LyDoTuChoiGui | "so-khong-hop-le" | "gui-that-bai"; thongBao: string };

/**
 * Gửi mã tới một số máy.
 *
 * Trường maHienThi chỉ khác null khi nhà cung cấp là BẢN GIẢ LẬP. Khi đó tin
 * nhắn không đi đâu cả, nên nếu không hiện mã ra thì không ai thử được luồng
 * này. Với nhà cung cấp thật thì nó luôn là null — có bài kiểm thử canh đúng
 * điều đó, vì đây là kiểu rò rỉ chỉ cần một dòng mã là mở ra và rất khó nhận ra
 * khi đọc lướt.
 */
export async function guiMa(householdId: string, soTho: string): Promise<KetQuaGuiMa> {
  let so: string;
  try {
    so = chuanHoaSo(soTho);
  } catch (e) {
    return {
      ok: false,
      lyDo: "so-khong-hop-le",
      thongBao: e instanceof Error ? e.message : "Số điện thoại không hợp lệ.",
    };
  }

  const d = getDb();
  const moc = mocTrongMotGio();
  const cuaHo = (
    d.prepare("SELECT tao_luc FROM ma_mot_lan WHERE household_id = ? AND tao_luc >= ?")
      .all(householdId, moc) as { tao_luc: string }[]
  ).map((r) => new Date(r.tao_luc));
  const toiSoMay = (
    d.prepare("SELECT tao_luc FROM ma_mot_lan WHERE so_may_bam = ? AND tao_luc >= ?")
      .all(bamSoMay(so), moc) as { tao_luc: string }[]
  ).map((r) => new Date(r.tao_luc));

  const chan = duocGuiKhong({ lanGuiCuaHo: cuaHo, lanGuiToiSoMay: toiSoMay });
  if (chan) return { ok: false, lyDo: chan, thongBao: NOI_GI_KHI_TU_CHOI_GUI[chan] };

  const ma = sinhMa();
  const daBam = bamMa(ma);
  const bayGio = new Date();
  const hetHan = new Date(bayGio.getTime() + HAN_DUNG_PHUT * 60_000);

  // Mọi mã cũ của hộ này thành vô hiệu: chỉ một mã sống tại một thời điểm, nếu
  // không thì mỗi lần bấm gửi lại nới thêm một cơ hội dò.
  d.prepare("UPDATE ma_mot_lan SET da_dung = 1 WHERE household_id = ? AND da_dung = 0")
    .run(householdId);
  d.prepare(
    "INSERT INTO ma_mot_lan (id, household_id, so_may_bam, hai_so_cuoi, ma_bam, muoi, tao_luc, het_han_luc) VALUES (?,?,?,?,?,?,?,?)",
  ).run(
    randomUUID(), householdId, bamSoMay(so), haiSoCuoi(so),
    daBam.bam, daBam.muoi, bayGio.toISOString(), hetHan.toISOString(),
  );

  const ncc = layNhaCungCapSms();
  const daGui = await ncc.gui(so, soanTinNhan(ma, HAN_DUNG_PHUT));
  if (!daGui.ok) {
    // Không gửi được thì nói thẳng, và vô hiệu hóa mã vừa sinh: để nó sống sẽ
    // làm phụ huynh ngồi chờ một tin nhắn không bao giờ tới.
    d.prepare("UPDATE ma_mot_lan SET da_dung = 1 WHERE household_id = ? AND da_dung = 0")
      .run(householdId);
    return {
      ok: false,
      lyDo: "gui-that-bai",
      thongBao: "Ô Ly chưa gửi được tin nhắn tới số này. Anh chị thử lại sau ít phút nhé.",
    };
  }

  return {
    ok: true,
    haiSoCuoi: haiSoCuoi(so),
    hetHanLuc: hetHan.toISOString(),
    maHienThi: ncc.laGiaLap ? ma : null,
  };
}

export type KetQuaKiemMa =
  | { ok: true; haiSoCuoi: string; laGiaLap: boolean }
  | { ok: false; lyDo: LyDoMaHong | "chua-xin-ma"; thongBao: string; soLanConLai?: number };

interface DongMa {
  id: string; hai_so_cuoi: string; ma_bam: string; muoi: string;
  het_han_luc: string; so_lan_sai: number; da_dung: number;
}

export function kiemMaCuaHo(householdId: string, maNguoiGo: string): KetQuaKiemMa {
  const d = getDb();
  const r = d
    .prepare("SELECT * FROM ma_mot_lan WHERE household_id = ? ORDER BY tao_luc DESC LIMIT 1")
    .get(householdId) as DongMa | undefined;
  if (!r) {
    return {
      ok: false,
      lyDo: "chua-xin-ma",
      thongBao: "Anh chị bấm gửi mã trước đã nhé.",
    };
  }

  const ban: BanGhiMa = {
    daBam: { bam: r.ma_bam, muoi: r.muoi },
    hetHanLuc: new Date(r.het_han_luc),
    soLanSai: r.so_lan_sai,
    daDung: r.da_dung === 1,
  };
  const kq = kiemMa(ban, maNguoiGo);

  if (!kq.dung) {
    // Chỉ đếm lần sai khi đúng là gõ sai mã. Mã hết hạn hay đã dùng mà cũng
    // cộng vào thì con số "còn mấy lần" nói sai sự thật cho phụ huynh.
    if (kq.lyDo === "sai-ma") {
      d.prepare("UPDATE ma_mot_lan SET so_lan_sai = so_lan_sai + 1 WHERE id = ?").run(r.id);
    }
    const daSai = kq.lyDo === "sai-ma" ? r.so_lan_sai + 1 : r.so_lan_sai;
    return {
      ok: false,
      lyDo: kq.lyDo,
      thongBao: NOI_GI_KHI_MA_HONG[kq.lyDo],
      soLanConLai: kq.lyDo === "sai-ma" ? Math.max(0, SO_LAN_SAI_TOI_DA - daSai) : undefined,
    };
  }

  // Dùng một lần là hết. Đánh dấu ngay, trước khi trả về.
  d.prepare("UPDATE ma_mot_lan SET da_dung = 1 WHERE id = ?").run(r.id);
  return { ok: true, haiSoCuoi: r.hai_so_cuoi, laGiaLap: layNhaCungCapSms().laGiaLap };
}
