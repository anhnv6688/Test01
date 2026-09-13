"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { KetQuaCham } from "@/lib/domain/cham-bai/ket-qua";
import type { TomTatTrang } from "@/lib/domain/cham-bai";
import type { LoiGiang, MucChiTiet } from "@/lib/domain/teaching";
import {
  VUNG_DAU_TRANG_MAC_DINH, cheVaDongGoi, docAnhVaoCanvas, doChatLuong,
  type AnhDaChe, type VungDaChe,
} from "./che-anh";

type LoaiViec = "doc-de-bai" | "cham-bai-lam";

type KetQua =
  | { loai: "loi-giang"; loiGiang: LoiGiang; coGoiYCachHoi: boolean; deBaiDocDuoc: string }
  | {
      loai: "cham-bai";
      cham: KetQuaCham[];
      tomTat: TomTatTrang;
      docDuoc: { nhan: string; noiDung: string }[];
    };

/**
 * Luồng chụp của phụ huynh.
 *
 * Thứ tự màn hình cố tình đặt việc CHE ẢNH trước việc gửi, và không cho bỏ qua:
 * nút gửi chỉ sáng lên sau khi phụ huynh đã xác nhận vùng che (BR-32). Dải đầu
 * trang được che sẵn vì đó là chỗ trẻ viết họ tên — lớp — trường, nhưng phụ
 * huynh vẫn kéo rộng thêm được, vì lời phê của cô giáo hay ghi chú riêng của gia
 * đình cũng là thứ không nên rời khỏi máy (RR-13).
 */
export function LuongChup({
  batDocDe, batChamBai, conLaiHomNay, tranNgay, conLaiThangNay, tranThang,
}: {
  batDocDe: boolean;
  batChamBai: boolean;
  conLaiHomNay: number | null;
  tranNgay: number | null;
  conLaiThangNay: number | null;
  tranThang: number | null;
}) {
  // Trần ngày chặn trước trần tháng, nên nó là con số phụ huynh cần thấy.
  const hetLuot = conLaiHomNay === 0 || conLaiThangNay === 0;
  const [loaiViec, setLoaiViec] = useState<LoaiViec>("cham-bai-lam");
  const [mucChiTiet, setMucChiTiet] = useState<MucChiTiet>("giang-tu-dau");
  const [anh, setAnh] = useState<AnhDaChe | null>(null);
  const [cheCao, setCheCao] = useState(VUNG_DAU_TRANG_MAC_DINH.h);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [ketQua, setKetQua] = useState<KetQua | null>(null);
  const [thongBao, setThongBao] = useState<{ loai: "loi" | "tin"; text: string } | null>(null);
  const [canhBaoChatLuong, setCanhBaoChatLuong] = useState<string | null>(null);
  const canvasGoc = useRef<HTMLCanvasElement | null>(null);

  const daBat = loaiViec === "doc-de-bai" ? batDocDe : batChamBai;

  const dungVung = useCallback((cao: number): VungDaChe[] => [{ x: 0, y: 0, w: 1, h: cao }], []);

  async function chonAnh(file: File | undefined) {
    if (!file) return;
    setKetQua(null);
    setThongBao(null);
    try {
      const canvas = await docAnhVaoCanvas(file);
      canvasGoc.current = canvas;
      const cl = doChatLuong(canvas);
      setCanhBaoChatLuong(
        cl.doSang < 60
          ? "Ảnh hơi tối. Anh chị bật thêm đèn bàn rồi chụp lại thì Ô Ly đọc chắc hơn."
          : cl.doTuongPhan < 18
            ? "Ảnh có vẻ nhòe. Anh chị giữ máy yên khoảng một giây rồi chụp lại nhé."
            : null,
      );
      // Che ngay từ lúc xem trước: phụ huynh không bao giờ nhìn thấy một bản
      // xem trước còn hiện tên con, để khỏi tưởng rằng có thể bỏ qua bước này.
      setAnh(cheVaDongGoi(canvas, dungVung(cheCao)));
    } catch {
      setThongBao({ loai: "loi", text: "Không mở được ảnh này. Anh chị thử ảnh khác nhé." });
    }
  }

  function doiVungChe(cao: number) {
    setCheCao(cao);
    // Vẽ lại từ ảnh gốc trong bộ nhớ để vùng che không chồng lớp lên nhau.
    const c = canvasGoc.current;
    if (c) setAnh(cheVaDongGoi(c, dungVung(cao)));
  }

  async function gui() {
    if (!anh) return;
    setDangXuLy(true);
    setThongBao(null);
    setKetQua(null);
    try {
      const r = await fetch("/api/anh/xu-ly", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          loaiViec,
          anhBase64: anh.base64,
          chungTuChe: anh.chungTu,
          chatLuong: anh.chatLuong,
          mucChiTiet,
          lop: 2,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setKetQua(d.ketQua as KetQua);
        setThongBao({ loai: "tin", text: "Xong. Ảnh vừa gửi đã được xóa khỏi hệ thống Ô Ly." });
      } else {
        setThongBao({ loai: "loi", text: d.thongBao ?? "Chưa xử lý được." });
      }
    } catch {
      setThongBao({ loai: "loi", text: "Mất kết nối. Anh chị thử lại nhé. Lần này không bị trừ lượt." });
    } finally {
      setDangXuLy(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <fieldset className="the m-0 p-5">
        <legend className="px-2 text-sm font-semibold">Anh chị muốn Ô Ly làm gì</legend>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="nut"
            style={vienChon(loaiViec === "cham-bai-lam")}
            onClick={() => setLoaiViec("cham-bai-lam")}>
            Chấm bài con đã làm
          </button>
          <button type="button" className="nut"
            style={vienChon(loaiViec === "doc-de-bai")}
            onClick={() => setLoaiViec("doc-de-bai")}>
            Giảng cho tôi cách làm bài này
          </button>
        </div>

        {loaiViec === "doc-de-bai" && (
          <div className="mt-4">
            <p className="m-0 mb-2 text-sm font-semibold">Mức chi tiết của lời giảng</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="nut text-sm"
                style={vienChon(mucChiTiet === "nhac-lai")}
                onClick={() => setMucChiTiet("nhac-lai")}>
                Tôi chỉ cần nhắc lại cách làm
              </button>
              <button type="button" className="nut text-sm"
                style={vienChon(mucChiTiet === "giang-tu-dau")}
                onClick={() => setMucChiTiet("giang-tu-dau")}>
                Giảng cho tôi từ đầu
              </button>
            </div>
          </div>
        )}

        {!daBat && (
          <p className="the mt-4 mb-0 p-4 text-sm" style={{ background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
            Việc này đang tắt. Ô Ly không tự bật giúp anh chị.{" "}
            <Link href="/phu-huynh/quyen-rieng-tu">Bật trong mục Quyền riêng tư →</Link>
          </p>
        )}
      </fieldset>

      <div className="the p-5">
        <p className="m-0 mb-3 text-sm font-semibold">Chọn ảnh trang vở</p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="block w-full text-sm"
          onChange={(e) => void chonAnh(e.target.files?.[0])}
        />
        <p className="mt-3 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
          Ảnh gốc vẫn nằm trong thư viện ảnh của điện thoại anh chị. Ô Ly không giữ lại ảnh nào —
          muốn xem lại trang vở cũ, anh chị mở thư viện ảnh của mình.
        </p>
      </div>

      {canhBaoChatLuong && (
        <p className="the p-4 text-sm" style={{ background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
          {canhBaoChatLuong}
        </p>
      )}

      {anh && (
        <div className="the p-5">
          <h2 className="mt-0 text-lg font-bold">Che thông tin của con trước đã</h2>
          <p className="text-sm" style={{ color: "var(--muc-nhat)" }}>
            Phần tô đen bên dưới bị xóa hẳn khỏi ảnh <strong>ngay trên máy anh chị</strong>, trước
            khi có bất cứ thứ gì được gửi đi. Anh chị kéo thanh dưới đây cho tới khi che kín họ tên,
            lớp và tên trường. Nếu trong trang có lời phê của cô hay ghi chú riêng của nhà mình, anh
            chị che luôn.
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={anh.xemTruoc} alt="Ảnh trang vở sau khi đã che thông tin cá nhân"
            className="mt-4 w-full rounded-xl" style={{ border: "1px solid var(--vien)" }} />

          <label className="mt-4 block text-sm">
            <span className="block font-semibold">Chiều cao vùng che: {Math.round(cheCao * 100)}% chiều cao trang</span>
            <input type="range" min={5} max={50} step={1} value={Math.round(cheCao * 100)}
              className="mt-2 w-full"
              onChange={(e) => doiVungChe(Number(e.target.value) / 100)} />
          </label>

          <button type="button" className="nut nut-chinh mt-5 w-full"
            disabled={dangXuLy || !daBat || hetLuot}
            onClick={() => void gui()}>
            {dangXuLy ? "Đang xử lý…" : "Tôi đã che xong, gửi đi"}
          </button>

          {conLaiHomNay !== null ? (
            <p className="mt-3 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
              Hôm nay hộ mình còn {conLaiHomNay} trên {tranNgay} lượt chụp. Sáng mai có lại{" "}
              {tranNgay} lượt mới, và lượt hôm nay không dùng hết thì không chuyển sang ngày sau.
              Nếu Ô Ly không đọc được ảnh thì lần đó không bị trừ.
            </p>
          ) : conLaiThangNay !== null ? (
            <p className="mt-3 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
              Tháng này hộ mình còn {conLaiThangNay} trên {tranThang} trang. Nếu Ô Ly không đọc được
              ảnh thì lần đó không bị trừ.
            </p>
          ) : null}
        </div>
      )}

      {thongBao && (
        <p className="the p-4 text-sm" role="status"
          style={{
            background: thongBao.loai === "loi" ? "var(--do-nen)" : "var(--xanh-la-nen)",
            borderColor: thongBao.loai === "loi" ? "var(--son)" : "var(--xanh-la)",
          }}>
          {thongBao.text}
        </p>
      )}

      {ketQua?.loai === "cham-bai" && (
        <BangChamTrang cham={ketQua.cham} tomTat={ketQua.tomTat} />
      )}
      {ketQua?.loai === "loi-giang" && (
        <BangLoiGiang lg={ketQua.loiGiang} coGoiYCachHoi={ketQua.coGoiYCachHoi} />
      )}
    </div>
  );
}

function vienChon(chon: boolean): React.CSSProperties {
  return {
    background: chon ? "var(--tim-nen)" : "transparent",
    borderColor: chon ? "var(--tim)" : "var(--vien)",
  };
}

/**
 * Kết quả chấm cả trang.
 *
 * BR-28 đòi chỉ ĐÚNG vị trí bước sai, BR-29 đòi giải thích vì sao sai và nói rõ
 * đúng ở chỗ nào. VM-08 mở phạm vi ra mọi dạng bài, nên mỗi bài hiện thành một
 * thẻ riêng với bảng từng bước của chính dạng đó.
 *
 * Phần "Ô Ly chưa dám kết luận" được hiện ngang hàng với đúng và sai chứ không
 * giấu xuống dưới: đó là phần cần mắt của phụ huynh, và giấu nó đi sẽ khiến họ
 * tưởng cả trang đã được kiểm hết.
 */
function BangChamTrang({ cham, tomTat }: { cham: KetQuaCham[]; tomTat: TomTatTrang }) {
  return (
    <section className="space-y-4">
      <div className="the p-5">
        <h2 className="mt-0 text-lg font-bold">Ô Ly đã xem xong trang này</h2>
        <p className="m-0">{tomTat.cauChoPhuHuynh}</p>
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0 text-sm">
          <ThePhanLoai so={tomTat.soDung} nhan="đúng" mau="var(--xanh-la)" nen="var(--xanh-la-nen)" />
          <ThePhanLoai so={tomTat.soSai} nhan="có chỗ sai" mau="var(--son)" nen="var(--do-nen)" />
          <ThePhanLoai so={tomTat.soChuaKetLuan} nhan="chưa kết luận" mau="var(--cam)" nen="var(--cam-nen)" />
        </ul>
      </div>

      {cham.map((kq, i) => <TheMotBai key={`${kq.dang}-${i}`} kq={kq} thuTu={i + 1} />)}

      <p className="text-xs" style={{ color: "var(--muc-nhat)" }}>
        Phần chấm này do máy đọc chữ trên giấy rồi tính lại. Máy có thể đọc sai — anh chị nhìn vào
        vở con là người quyết định cuối cùng. Ảnh anh chị vừa gửi đã được xóa.
      </p>
    </section>
  );
}

function ThePhanLoai({ so, nhan, mau, nen }: { so: number; nhan: string; mau: string; nen: string }) {
  if (so === 0) return null;
  return (
    <li className="rounded-full px-3 py-1 font-semibold"
      style={{ background: nen, color: mau, border: `1px solid ${mau}` }}>
      {so} bài {nhan}
    </li>
  );
}

const NHAN_TIN_CAY: Record<KetQuaCham["doTinCay"], string> = {
  cao: "Ô Ly tính lại được toàn bộ nên kết luận này chắc chắn",
  "trung-binh": "Ô Ly kiểm được phần tính toán, còn lại cần anh chị xem",
  thap: "Kết luận này phụ thuộc vào việc Ô Ly nhìn rõ đề trong ảnh",
};

function TheMotBai({ kq, thuTu }: { kq: KetQuaCham; thuTu: number }) {
  const mau =
    kq.dung === true ? "var(--xanh-la)" : kq.dung === false ? "var(--son)" : "var(--cam)";
  const nen =
    kq.dung === true ? "var(--xanh-la-nen)" : kq.dung === false ? "var(--do-nen)" : "var(--cam-nen)";
  const nhan = kq.dung === true ? "Đúng" : kq.dung === false ? "Có chỗ sai" : "Chưa kết luận";

  return (
    <article className="the p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="m-0 text-base font-bold">
          Bài {thuTu} · {kq.tenDang}
        </h3>
        <span className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: nen, color: mau, border: `1px solid ${mau}` }}>
          {nhan}
        </span>
      </div>

      <p className="the mt-4 mb-0 p-4" style={{ background: nen, borderColor: mau }}>
        {kq.choPhuHuynh}
      </p>

      {kq.buoc.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ color: "var(--muc-nhat)" }}>
                <th className="py-2 pr-4 text-left font-semibold">Phần</th>
                <th className="py-2 pr-4 text-left font-semibold">Con viết</th>
                <th className="py-2 text-left font-semibold">Ô Ly đối chiếu</th>
              </tr>
            </thead>
            <tbody>
              {kq.buoc.map((b, i) => (
                <tr key={`${b.nhan}-${i}`} className="border-t" style={{ borderColor: "var(--vien)" }}>
                  <td className="py-2 pr-4 align-top font-semibold">{b.nhan}</td>
                  <td className="py-2 pr-4 align-top">
                    <span style={{
                      color: b.dung === true ? "var(--xanh-la)" : b.dung === false ? "var(--son)" : "var(--muc-nhat)",
                      fontWeight: 700,
                    }}>
                      {b.conViet}
                    </span>
                  </td>
                  <td className="py-2 align-top">{b.giaiThich}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
        {NHAN_TIN_CAY[kq.doTinCay]}.
      </p>

      {kq.ngoaiTamKiem.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-semibold" style={{ color: "var(--muc-nhat)" }}>
            Phần Ô Ly không kiểm được ở bài này
          </summary>
          <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-xs" style={{ color: "var(--muc-nhat)" }}>
            {kq.ngoaiTamKiem.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </details>
      )}
    </article>
  );
}

/** BR-26, BR-27: lời giải viết bằng ngôn ngữ giảng bài, kèm câu để hỏi con. */
function BangLoiGiang({ lg, coGoiYCachHoi }: { lg: LoiGiang; coGoiYCachHoi: boolean }) {
  return (
    <section className="the p-6">
      <h2 className="mt-0 text-lg font-bold">Anh chị giảng lại cho con thế này</h2>
      <p className="the p-4 text-sm" style={{ background: "var(--giay)" }}>
        <strong>Đề bài:</strong> {lg.deBai}
      </p>
      <p className="text-xs" style={{ color: "var(--muc-nhat)" }}>
        Bài này thuộc yêu cầu cần đạt: {lg.yeuCauCanDat}
      </p>

      <ol className="m-0 mt-5 space-y-4 pl-5">
        {lg.buoc.map((b) => (
          <li key={b.tieuDe}>
            <p className="m-0 font-semibold">{b.tieuDe}</p>
            <p className="m-0 mt-1 text-sm">{b.lamGi}</p>
            {coGoiYCachHoi && b.hoiCon && (
              <p className="the m-0 mt-2 p-3 text-sm"
                style={{ background: "var(--tim-nen)", borderColor: "var(--tim)" }}>
                <strong>Hỏi con:</strong> “{b.hoiCon}”
              </p>
            )}
          </li>
        ))}
      </ol>

      {!coGoiYCachHoi && (
        <p className="the mt-4 p-4 text-sm" style={{ background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
          Phần gợi ý cách hỏi con đang tắt trong mục Quyền riêng tư. Các bước giải vẫn hiện đầy đủ.
        </p>
      )}

      <div className="the mt-5 p-4" style={{ background: "var(--do-nen)", borderColor: "var(--son)" }}>
        <p className="m-0 text-sm font-semibold">Chỗ trẻ hay hiểu sai ở dạng bài này</p>
        <ul className="m-0 mt-1 list-disc space-y-1 pl-5 text-sm">
          {lg.choHaySai.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>

      <p className="mt-5 text-sm" style={{ color: "var(--muc-nhat)" }}>{lg.neuVanChuaHieu}</p>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Xem đáp số (anh chị tự kiểm tra, đừng đọc cho con)
        </summary>
        <p className="mt-2 mb-0 text-lg font-bold">
          {lg.dapAn} {lg.donVi ?? ""}
        </p>
      </details>

      {lg.nhanMay && (
        <p className="mt-5 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>{lg.nhanMay}</p>
      )}
    </section>
  );
}
