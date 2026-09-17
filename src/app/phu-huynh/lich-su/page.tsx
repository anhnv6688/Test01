import Link from "next/link";
import { YCCD_BY_CODE } from "@/lib/domain/curriculum";
import { TRAP_BY_ID } from "@/lib/domain/traps";
import { tyLeTuSuaSauGoiY } from "@/lib/domain/rewards";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { danhSachCon, lichSuCuaCon } from "@/lib/server/repo";
import { demVung, moTaMoc, tinhMocVung } from "@/lib/domain/moc-vung";
import { CongPin } from "../CongPin";
import { goiYPinHoMau } from "@/lib/server/moi-truong";

export const dynamic = "force-dynamic";

/**
 * Lịch sử học.
 *
 * BR-09: dữ liệu và lịch sử học tập của trẻ không bao giờ bị khóa khi thuê bao
 * hết hạn. Trang này cố ý không nhận biết gói cước — không có chỗ nào để cắm
 * một điều kiện chặn vào, kể cả sau này.
 */
export default async function TrangLichSu({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const ho = await daMoCong();
  if (!ho) return <CongPin goiY={goiYPinHoMau()} />;

  const sp = await searchParams;
  const con = danhSachCon(ho.id);
  const chon = con.find((c) => c.id === sp.childId) ?? con[0];
  if (!chon) {
    return <main className="mx-auto w-full max-w-4xl px-4 py-8"><p className="the p-5">Chưa có hồ sơ nào.</p></main>;
  }

  const lichSu = lichSuCuaCon(chon.id, 300);
  const theoNgay = new Map<string, typeof lichSu>();
  for (const a of lichSu) {
    const ngay = a.at.slice(0, 10);
    theoNgay.set(ngay, [...(theoNgay.get(ngay) ?? []), a]);
  }
  const cacNgay = [...theoNgay.keys()].sort().reverse();
  const tyLe = tyLeTuSuaSauGoiY(lichSu);
  const moc = tinhMocVung(lichSu);
  const dem = demVung(moc);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mt-0 text-2xl font-bold">Lịch sử học</h1>
      <p style={{ color: "var(--muc-nhat)" }}>
        Toàn bộ phần này luôn xem được, kể cả khi thuê bao hết hạn. Ô Ly không giữ dữ liệu học của
        con làm điều kiện để anh chị phải gia hạn.
      </p>

      {con.length > 1 && (
        <nav aria-label="Chọn bé" className="mt-4 flex flex-wrap gap-2">
          {con.map((c) => (
            <Link key={c.id} href={`/phu-huynh/lich-su?childId=${c.id}`}
              className="nut text-sm no-underline"
              style={{
                color: "var(--muc)",
                background: c.id === chon.id ? "var(--tim-nen)" : "transparent",
                borderColor: c.id === chon.id ? "var(--tim)" : "var(--vien)",
              }}>
              {c.tenGoi}
            </Link>
          ))}
        </nav>
      )}

      {lichSu.length === 0 ? (
        <p className="the mt-6 p-5">{chon.tenGoi} chưa làm bài nào.</p>
      ) : (
        <>
          <p className="the mt-6 p-5">
            <strong>{chon.tenGoi}</strong> đã làm {lichSu.length} lượt bài.
            {tyLe > 0 && (
              <> Trong số những câu làm sai ở lần đầu, có {Math.round(tyLe * 100)}% được con tự sửa
              đúng sau khi xem gợi ý — đây là chỉ số Ô Ly quan tâm nhất, hơn cả tỷ lệ đúng.</>
            )}
          </p>

          {/*
            Bảng đi tới đâu trong học kỳ.
            Đặt TRƯỚC phần nhật ký từng ngày vì đây là câu hỏi phụ huynh mở trang
            này để hỏi: con đang tới đâu rồi. Danh sách từng lượt bài trả lời câu
            "hôm qua con làm gì", một câu khác và ít khẩn hơn.

            Liệt kê CẢ phần chưa gặp. Chỉ hiện phần đã vững thì bảng thành danh
            sách thành tích và giấu mất phần còn lại của học kỳ.
          */}
          <section className="the mt-6 p-5">
            <h2 className="mt-0 text-lg font-bold">
              Đi tới đâu trong học kỳ: {dem.vung}/{dem.tong} phần đã vững
            </h2>
            <p className="text-sm" style={{ color: "var(--muc-nhat)" }}>
              Một phần được tính là <strong>đã vững</strong> khi mười bài gần nhất con làm đúng ngay
              từ lần đầu ít nhất tám bài. Làm sai rồi sửa lại đúng thì không tính — chỗ này đo việc
              con tự làm được ngay. Đây không phải điểm số và Ô Ly không so con với bất kỳ bạn nào;
              mốc so sánh duy nhất là chính con ở những buổi trước.
            </p>
            <ul className="m-0 mt-4 list-none space-y-3 p-0">
              {moc.map((m) => (
                <li key={m.yccd} className="border-t pt-3" style={{ borderColor: "var(--vien)" }}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className={m.trangThai === "vung" ? "font-semibold" : ""}>
                      {m.trangThai === "vung" && (
                        <span aria-hidden className="mr-2" style={{ color: "var(--xanh-la)" }}>✓</span>
                      )}
                      {m.phatBieu.split(";")[0]}
                    </span>
                    <span
                      className="text-sm whitespace-nowrap"
                      style={{
                        color:
                          m.trangThai === "vung" ? "var(--xanh-la)" : "var(--muc-nhat)",
                      }}
                    >
                      {m.trangThai === "vung" ? "đã vững" : m.trangThai === "dang-luyen" ? "đang luyện" : "chưa đủ bài"}
                    </span>
                  </div>
                  <p className="m-0 mt-1 text-sm" style={{ color: "var(--muc-nhat)" }}>{moTaMoc(m)}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-6 space-y-6">
            {cacNgay.map((ngay) => {
              const ds = theoNgay.get(ngay) ?? [];
              return (
                <section key={ngay} className="the p-5">
                  <h2 className="mt-0 text-lg font-bold">{doiNgay(ngay)}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr style={{ color: "var(--muc-nhat)" }}>
                          <th className="py-2 pr-4 text-left font-semibold">Nội dung</th>
                          <th className="py-2 pr-4 text-left font-semibold">Kết quả</th>
                          <th className="py-2 text-left font-semibold">Ghi nhận</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ds.map((a, i) => (
                          <tr key={`${a.itemId}-${a.attemptNo}-${i}`}
                            className="border-t" style={{ borderColor: "var(--vien)" }}>
                            <td className="py-2 pr-4 align-top">
                              {YCCD_BY_CODE.get(a.yccd)?.statement.split(";")[0] ?? a.yccd}
                            </td>
                            <td className="py-2 pr-4 align-top whitespace-nowrap">
                              {a.correct
                                ? <span style={{ color: "var(--xanh-la)" }}>đúng{a.attemptNo > 1 ? ` (lần ${a.attemptNo})` : ""}</span>
                                : <span style={{ color: "var(--son)" }}>chưa đúng</span>}
                            </td>
                            <td className="py-2 align-top">
                              {a.trapId
                                ? TRAP_BY_ID.get(a.trapId)?.name ?? a.trapId
                                : a.hintsUsed > 0 ? `dùng ${a.hintsUsed} bậc gợi ý` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

function doiNgay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `Ngày ${d}/${m}/${y}`;
}
