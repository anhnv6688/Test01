"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { KetQuaChamCot } from "@/lib/domain/column-marking";
import type { LoiGiang, MucChiTiet } from "@/lib/domain/teaching";
import {
  VUNG_DAU_TRANG_MAC_DINH, cheVaDongGoi, docAnhVaoCanvas, doChatLuong,
  type AnhDaChe, type VungDaChe,
} from "./che-anh";

type LoaiViec = "doc-de-bai" | "cham-bai-lam";

type KetQua =
  | { loai: "loi-giang"; loiGiang: LoiGiang; coGoiYCachHoi: boolean; deBaiDocDuoc: string }
  | { loai: "cham-bai"; cham: KetQuaChamCot; docDuoc: { nhan: string; noiDung: string }[] };

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
  batDocDe, batChamBai, conLai, tran,
}: {
  batDocDe: boolean;
  batChamBai: boolean;
  conLai: number | null;
  tran: number | null;
}) {
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
            disabled={dangXuLy || !daBat || conLai === 0}
            onClick={() => void gui()}>
            {dangXuLy ? "Đang xử lý…" : "Tôi đã che xong, gửi đi"}
          </button>

          {conLai !== null && (
            <p className="mt-3 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
              Tháng này hộ mình còn {conLai} trên {tran} trang. Nếu Ô Ly không đọc được ảnh thì lần
              đó không bị trừ.
            </p>
          )}
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

      {ketQua?.loai === "cham-bai" && <BangChamCot kq={ketQua.cham} />}
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

/** BR-28, BR-29: chỉ đúng bước sai, và giải thích vì sao sai. */
function BangChamCot({ kq }: { kq: KetQuaChamCot }) {
  return (
    <section className="the p-6">
      <h2 className="mt-0 text-lg font-bold">
        {kq.dung ? "Con làm đúng cả bài" : `Con sai bắt đầu từ cột ${kq.buoc[kq.buocSaiDauTien ?? 0]?.tenCot}`}
      </h2>
      <p className="the p-4" style={{
        background: kq.dung ? "var(--xanh-la-nen)" : "var(--cam-nen)",
        borderColor: kq.dung ? "var(--xanh-la)" : "var(--cam)",
      }}>
        {kq.choPhuHuynh}
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="pb-2 text-left text-sm" style={{ color: "var(--muc-nhat)" }}>
            Ô Ly tính lại từng cột, từ cột đơn vị sang trái.
          </caption>
          <thead>
            <tr style={{ color: "var(--muc-nhat)" }}>
              <th className="py-2 pr-4 text-left font-semibold">Cột</th>
              <th className="py-2 pr-4 text-left font-semibold">Con viết</th>
              <th className="py-2 text-left font-semibold">Ô Ly tính ra</th>
            </tr>
          </thead>
          <tbody>
            {kq.buoc.slice().reverse().map((b) => (
              <tr key={b.cot} className="border-t" style={{ borderColor: "var(--vien)" }}>
                <td className="py-2 pr-4 align-top font-semibold">{b.tenCot}</td>
                <td className="py-2 pr-4 align-top">
                  <span style={{ color: b.dung ? "var(--xanh-la)" : "var(--son)", fontWeight: 700 }}>
                    {b.chuSoTre ?? "bỏ trống"}
                  </span>
                </td>
                <td className="py-2 align-top">{b.giaiThich}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
        Phần chấm này do máy đọc chữ trên giấy rồi tính lại. Máy có thể đọc sai — anh chị nhìn vào
        vở con là người quyết định cuối cùng. Ảnh anh chị vừa gửi đã được xóa.
      </p>
    </section>
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
