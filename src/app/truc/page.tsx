import { daMoCongTruc } from "@/lib/server/cong-truc";
import { hangDoiTruc, thongKeTruc, type MucHangDoi } from "@/lib/server/hang-doi-truc";
import { nhatKyXuLy } from "@/lib/server/requests";
import { moiDuLieu } from "@/lib/server/seed";
import { CongTruc } from "./CongTruc";
import {
  hanhDongDongCongTruc, hanhDongGoBo, hanhDongHoanThanh, hanhDongTiepNhan,
} from "./actions";

export const dynamic = "force-dynamic";

/**
 * Bảng trực.
 *
 * Điều kiện ra mắt số 5: "Quy trình tiếp nhận và xử lý yêu cầu gỡ bỏ đã chạy
 * thử và có người trực." Trước trang này, Ô Ly có form nhận yêu cầu và có hạn
 * tính tự động, nhưng không có chỗ nào để ai đó XỬ LÝ chúng — nghĩa là quy
 * trình dừng ở bước tiếp nhận, và điều kiện số 5 không thể đạt.
 */
export default async function TrangTruc() {
  moiDuLieu();
  const phien = await daMoCongTruc();
  if (!phien) return <CongTruc />;

  const hangDoi = hangDoiTruc();
  const tk = thongKeTruc(hangDoi);
  const nhatKy = nhatKyXuLy(40);
  const canLam = hangDoi.filter((x) => !x.daXong);
  const daXong = hangDoi.filter((x) => x.daXong);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-semibold tracking-wide" style={{ color: "var(--son)" }}>
            Ô LY · NỘI BỘ
          </p>
          <h1 className="mt-1 mb-0 text-2xl font-bold">Bảng trực xử lý yêu cầu</h1>
          <p className="m-0 text-sm" style={{ color: "var(--muc-nhat)" }}>
            Ca trực của {phien.nguoiTruc}
          </p>
        </div>
        <form action={hanhDongDongCongTruc}>
          <button type="submit" className="nut text-sm">Kết thúc ca</button>
        </form>
      </header>

      <section
        className="the p-6"
        style={
          tk.quaHanDangCho > 0
            ? { background: "var(--do-nen)", borderColor: "var(--son)" }
            : undefined
        }
      >
        <h2 className="mt-0 text-lg font-bold">
          {tk.quaHanDangCho > 0
            ? `Có ${tk.quaHanDangCho} yêu cầu ĐÃ QUÁ HẠN`
            : "Không có yêu cầu nào quá hạn"}
        </h2>
        <dl className="m-0 mt-4 grid gap-4 sm:grid-cols-4">
          <ThongSo nhan="Đang chờ" gia={tk.dangCho} />
          <ThongSo nhan="Quá hạn" gia={tk.quaHanDangCho} mau={tk.quaHanDangCho > 0 ? "var(--son)" : undefined} />
          <ThongSo nhan="Đã xử lý" gia={tk.daXuLy} />
          <ThongSo
            nhan="Đúng hạn"
            gia={tk.tyLeDungHan === null ? "—" : `${Math.round(tk.tyLeDungHan * 100)}%`}
            mau={tk.tyLeDungHan !== null && tk.tyLeDungHan < 1 ? "var(--cam)" : "var(--xanh-la)"}
          />
        </dl>
        <p className="mt-4 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
          Tỷ lệ đúng hạn tính theo nhật ký, chốt tại thời điểm xử lý. Một yêu cầu đã xong mà
          không có dòng nhật ký nào thì không được tính là đúng hạn — không chứng minh được
          thì coi như không đạt.
        </p>
      </section>

      <h2 className="mt-8 text-lg font-bold">Cần xử lý ({canLam.length})</h2>
      <p className="text-sm" style={{ color: "var(--muc-nhat)" }}>
        Xếp theo mức khẩn, không theo thứ tự nhận. Một yêu cầu gỡ bỏ nhận sau nhưng chỉ có 24
        giờ phải đứng trước một yêu cầu xem dữ liệu nhận trước nhưng có 10 ngày.
      </p>

      {canLam.length === 0 ? (
        <p className="the mt-4 p-5">Hàng đợi trống. Không còn yêu cầu nào chờ xử lý.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {canLam.map((m) => <TheYeuCau key={m.id} m={m} />)}
        </div>
      )}

      {daXong.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-bold">Đã xử lý ({daXong.length})</h2>
          <div className="mt-4 space-y-3">
            {daXong.slice(0, 10).map((m) => (
              <div key={m.id} className="the p-4 text-sm">
                <span className="font-semibold">{m.tomTat}</span>
                <span style={{ color: "var(--muc-nhat)" }}>
                  {" · "}{m.trangThai}
                  {" · "}
                  {m.dungHanTheoNhatKy === true
                    ? "đúng hạn"
                    : m.dungHanTheoNhatKy === false
                      ? "QUÁ HẠN"
                      : "không có nhật ký"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-10 text-lg font-bold">Nhật ký xử lý</h2>
      <p className="text-sm" style={{ color: "var(--muc-nhat)" }}>
        Đây là hồ sơ đưa ra khi bị kiểm tra. Nhật ký không chứa dữ liệu cá nhân, và sống sót cả
        khi hộ gia đình đã được xóa theo yêu cầu — nếu không thì việc tuân thủ tốt nhất lại xóa
        mất bằng chứng tuân thủ.
      </p>
      {nhatKy.length === 0 ? (
        <p className="the mt-4 p-5 text-sm">Chưa có thao tác nào.</p>
      ) : (
        <div className="the mt-4 overflow-x-auto p-5">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ color: "var(--muc-nhat)" }}>
                <th className="py-2 pr-4 text-left font-semibold">Lúc</th>
                <th className="py-2 pr-4 text-left font-semibold">Người trực</th>
                <th className="py-2 pr-4 text-left font-semibold">Hành động</th>
                <th className="py-2 pr-4 text-left font-semibold">Hạn</th>
                <th className="py-2 text-left font-semibold">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {nhatKy.map((d) => (
                <tr key={d.id} className="border-t" style={{ borderColor: "var(--vien)" }}>
                  <td className="py-2 pr-4 align-top whitespace-nowrap">
                    {new Date(d.at).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-2 pr-4 align-top">{d.nguoiTruc}</td>
                  <td className="py-2 pr-4 align-top">{d.hanhDong}</td>
                  <td className="py-2 pr-4 align-top" style={{ color: d.dungHan ? "var(--xanh-la)" : "var(--son)" }}>
                    {d.dungHan ? "đúng hạn" : "quá hạn"}
                  </td>
                  <td className="py-2 align-top">{d.ghiChu ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function ThongSo({ nhan, gia, mau }: { nhan: string; gia: number | string; mau?: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold" style={{ color: "var(--muc-nhat)" }}>{nhan}</dt>
      <dd className="m-0 mt-1 text-2xl font-bold" style={mau ? { color: mau } : undefined}>{gia}</dd>
    </div>
  );
}

const MAU_KHAN: Record<string, { nen: string; vien: string }> = {
  "qua-han": { nen: "var(--do-nen)", vien: "var(--son)" },
  "sap-het-han": { nen: "var(--cam-nen)", vien: "var(--cam)" },
  "con-han": { nen: "transparent", vien: "var(--vien)" },
  "da-xong": { nen: "transparent", vien: "var(--vien)" },
};

function TheYeuCau({ m }: { m: MucHangDoi }) {
  const mau = MAU_KHAN[m.tinhTrang.mucKhan];
  return (
    <article className="the p-5" style={{ background: mau.nen, borderColor: mau.vien }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="m-0 text-base font-bold">{m.tomTat}</h3>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ border: `1px solid ${mau.vien}`, color: mau.vien }}
        >
          {m.tinhTrang.moTa}
        </span>
      </div>

      <dl className="m-0 mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs" style={{ color: "var(--muc-nhat)" }}>Nhận lúc</dt>
          <dd className="m-0">{new Date(m.nhanLuc).toLocaleString("vi-VN")}</dd>
        </div>
        <div>
          <dt className="text-xs" style={{ color: "var(--muc-nhat)" }}>Hạn hoàn thành</dt>
          <dd className="m-0">{new Date(m.hanChot).toLocaleString("vi-VN")}</dd>
        </div>
        {m.hanTiepNhan && (
          <div>
            <dt className="text-xs" style={{ color: "var(--muc-nhat)" }}>Hạn phản hồi đã nhận</dt>
            <dd className="m-0">{new Date(m.hanTiepNhan).toLocaleDateString("vi-VN")}</dd>
          </div>
        )}
      </dl>

      {m.chiTiet && (
        <p className="the mt-3 mb-0 whitespace-pre-line p-3 text-sm" style={{ background: "var(--giay)" }}>
          {m.chiTiet}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {m.loai === "du-lieu" ? (
          <>
            {m.trangThai === "moi" && (
              <form action={hanhDongTiepNhan}>
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" className="nut text-sm">Đã tiếp nhận</button>
              </form>
            )}
            <form action={hanhDongHoanThanh} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={m.id} />
              <input
                name="ghiChu"
                placeholder="Ghi chú, nếu cần"
                className="rounded-xl px-3 py-2 text-sm"
                style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
              />
              <button type="submit" className="nut nut-chinh text-sm">Xử lý và hoàn thành</button>
            </form>
          </>
        ) : (
          <form action={hanhDongGoBo} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={m.id} />
            <input
              name="ghiChu"
              placeholder="Căn cứ quyết định"
              className="rounded-xl px-3 py-2 text-sm"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
            />
            {m.trangThai === "moi" && (
              <button type="submit" name="sang" value="dang-xem-xet" className="nut text-sm">
                Đang xem xét
              </button>
            )}
            <button type="submit" name="sang" value="da-go" className="nut nut-chinh text-sm">
              Đã gỡ nội dung
            </button>
            <button type="submit" name="sang" value="tu-choi" className="nut text-sm">
              Từ chối yêu cầu
            </button>
          </form>
        )}
      </div>

      <p className="mt-3 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
        {m.loai === "du-lieu"
          ? "Bấm hoàn thành sẽ LÀM THẬT việc người dùng yêu cầu: xuất dữ liệu, rút toàn bộ đồng ý, hoặc xóa dữ liệu."
          : "Mọi quyết định đều vào nhật ký kèm tên người trực và căn cứ."}
      </p>
    </article>
  );
}
