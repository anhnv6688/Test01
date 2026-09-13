import Link from "next/link";
import { YCCD_BY_CODE } from "@/lib/domain/curriculum";
import { TRAP_BY_ID } from "@/lib/domain/traps";
import { tyLeTuSuaSauGoiY } from "@/lib/domain/rewards";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { danhSachCon, lichSuCuaCon } from "@/lib/server/repo";
import { CongPin } from "../CongPin";

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
  if (!ho) return <CongPin />;

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
