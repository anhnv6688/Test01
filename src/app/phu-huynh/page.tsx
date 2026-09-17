import Link from "next/link";
import { lapBanTinToi } from "@/lib/domain/digest";
import { tinhPhanThuong } from "@/lib/domain/rewards";
import { GOI, dinhDangTien } from "@/lib/domain/pricing";
import { tinhTran } from "@/lib/domain/metering";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { danhSachCon, lanTraLoiTrongNgay, lichSuCuaCon, mucDaDung } from "@/lib/server/repo";
import { moiDuLieu } from "@/lib/server/seed";
import { CongPin } from "./CongPin";
import { goiYPinHoMau } from "@/lib/server/moi-truong";
import { hanhDongThemCon } from "./actions";

export const dynamic = "force-dynamic";

export default async function TrangPhuHuynh() {
  moiDuLieu();
  const ho = await daMoCong();
  if (!ho) return <CongPin goiY={goiYPinHoMau()} />;

  const con = danhSachCon(ho.id);
  const homNay = new Date().toISOString().slice(0, 10);
  const tran = tinhTran(ho.goi, mucDaDung(ho.id));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mt-0 text-2xl font-bold">Bản tin tối</h1>
      <p style={{ color: "var(--muc-nhat)" }}>
        Mỗi tối một bản tin ngắn: con học gì, sai ở đâu, và đúng một câu để anh chị hỏi con.
        Một câu thôi — ba câu thì thành bài kiểm tra miệng.
      </p>

      {con.length === 0 && <p className="the p-5">Hộ mình chưa có hồ sơ nào của con.</p>}

      <div className="mt-6 space-y-6">
        {con.map((c) => {
          const hn = lanTraLoiTrongNgay(c.id, homNay);
          const banTin = lapBanTinToi(c.id, hn);
          const thuong = tinhPhanThuong(hn);
          const tongLichSu = lichSuCuaCon(c.id, 500).length;
          return (
            <section key={c.id} className="the p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="m-0 text-xl font-bold">{c.tenGoi}</h2>
                <span className="text-sm" style={{ color: "var(--muc-nhat)" }}>Lớp {c.lop}</span>
              </div>

              {!banTin ? (
                <p className="mt-4 mb-0" style={{ color: "var(--muc-nhat)" }}>
                  Hôm nay {c.tenGoi} chưa vào học. Tổng cộng đã làm {tongLichSu} lượt bài từ trước tới nay —
                  phần lịch sử đó không bao giờ bị khóa, kể cả khi thuê bao hết hạn.
                </p>
              ) : (
                <>
                  <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-semibold" style={{ color: "var(--muc-nhat)" }}>Hôm nay con học</dt>
                      <dd className="m-0 mt-1">
                        <ul className="m-0 list-disc space-y-1 pl-5">
                          {banTin.hocGi.map((h) => <li key={h}>{h}</li>)}
                        </ul>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold" style={{ color: "var(--muc-nhat)" }}>Con vướng ở đâu</dt>
                      <dd className="m-0 mt-1">
                        <ul className="m-0 list-disc space-y-1 pl-5">
                          {banTin.saiODau.map((s) => <li key={s}>{s}</li>)}
                        </ul>
                      </dd>
                    </div>
                  </dl>

                  <div className="the mt-5 p-5" style={{ background: "var(--tim-nen)", borderColor: "var(--tim)" }}>
                    <p className="m-0 text-sm font-semibold" style={{ color: "var(--tim)" }}>
                      Tối nay anh chị hỏi con đúng một câu này
                    </p>
                    <p className="m-0 mt-2 text-lg font-semibold">“{banTin.cauHoiChoBo}”</p>
                  </div>

                  <p className="mt-5 mb-0 text-sm" style={{ color: "var(--muc-nhat)" }}>
                    {banTin.noLuc} Con được {thuong.hatGiong} hạt giống, tính theo công chịu khó làm và
                    chịu khó sửa, không tính theo số câu đúng.
                  </p>
                </>
              )}

              <p className="mt-4 mb-0">
                <Link href={`/phu-huynh/lich-su?childId=${c.id}`} className="text-sm">
                  Xem toàn bộ lịch sử của {c.tenGoi} →
                </Link>
              </p>
            </section>
          );
        })}
      </div>

      <section className="the mt-8 p-6">
        <h2 className="mt-0 text-lg font-bold">Thêm một bé nữa</h2>
        <p className="text-sm" style={{ color: "var(--muc-nhat)" }}>
          Một thuê bao dùng cho cả nhà. Ô Ly không tính tiền theo số con, và không giới hạn số hồ sơ.
        </p>
        <form action={hanhDongThemCon} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block font-semibold">Tên gọi ở nhà</span>
            <input name="tenGoi" required maxLength={20}
              className="mt-1 rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }} />
          </label>
          <label className="text-sm">
            <span className="block font-semibold">Lớp</span>
            <select name="lop" defaultValue="2" className="mt-1 rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}>
              <option value="1">Lớp 1</option>
              <option value="2">Lớp 2</option>
            </select>
          </label>
          <button type="submit" className="nut nut-chinh">Thêm</button>
        </form>
        <p className="mt-3 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
          Ô Ly chỉ xin tên gọi ở nhà và khối lớp. Không xin họ tên đầy đủ, không xin ảnh của bé.
        </p>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Lượt chụp của hộ mình</h2>
        {tran.tranNgay !== null ? (
          <p className="m-0">
            Hôm nay còn <strong>{tran.conLaiHomNay}</strong> trên {tran.tranNgay} lượt chụp — gói{" "}
            {GOI[ho.goi].ten}, miễn phí. Sáng mai có lại {tran.tranNgay} lượt mới; lượt hôm nay
            không dùng hết thì không chuyển sang ngày sau.
          </p>
        ) : (
          <p className="m-0">
            Tháng này đã dùng <strong>{tran.daDungThangNay}</strong>
            {tran.tranThang !== null ? ` trên ${tran.tranThang} trang chụp` : " trang chụp"} — gói{" "}
            {GOI[ho.goi].ten}, {dinhDangTien(GOI[ho.goi].giaThang)} mỗi tháng.
          </p>
        )}
        <p className="mt-2 mb-0 text-sm" style={{ color: "var(--muc-nhat)" }}>
          Phần luyện tập của con không bị đếm lượt và không bao giờ bị giới hạn.{" "}
          <Link href="/phu-huynh/goi-cuoc">Vì sao chỉ phần chụp ảnh mới bị đếm →</Link>
        </p>
      </section>
    </main>
  );
}
