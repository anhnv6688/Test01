import { MUC_DICH, PHIEN_BAN_VAN_BAN_DONG_Y, dangBat } from "@/lib/privacy/consent";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { lichSuDongY } from "@/lib/server/repo";
import { CongPin } from "../CongPin";
import { hanhDongDoiDongY } from "../actions";

export const dynamic = "force-dynamic";

/**
 * Quyền riêng tư — bật tắt từng mục đích xử lý bằng trí tuệ nhân tạo.
 *
 * BR-37 và CR-17: cơ chế không tham gia phải tách theo TỪNG mục đích, không
 * đánh dấu sẵn, và tắt một mục đích không được làm hỏng các tính năng còn lại.
 * Nếu tắt một mục đích mà mất hết tính năng thì đó không phải lựa chọn thật.
 *
 * Vì vậy mỗi thẻ dưới đây hiện đủ hai cột: tắt thì mất gì, và cái gì vẫn chạy.
 * Cột thứ hai mới là cột chứng minh đây là lựa chọn thật.
 */
export default async function TrangQuyenRiengTu() {
  const ho = await daMoCong();
  if (!ho) return <CongPin />;
  const bangGhi = lichSuDongY(ho.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mt-0 text-2xl font-bold">Quyền riêng tư</h1>
      <p style={{ color: "var(--muc-nhat)" }}>
        Ô Ly không bật sẵn giúp anh chị mục nào. Mỗi việc dưới đây phải được anh chị bật riêng, và
        tắt lại lúc nào cũng được. Tắt một mục thì chỉ mất đúng phần việc của mục đó.
      </p>

      <div className="mt-6 space-y-5">
        {MUC_DICH.map((m) => {
          const bat = dangBat(bangGhi, m.ma);
          return (
            <section key={m.ma} className="the p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-[15rem] flex-1">
                  <h2 className="mt-0 mb-1 text-lg font-bold">{m.ten}</h2>
                  <p className="m-0 text-sm" style={{ color: "var(--muc-nhat)" }}>{m.giaiThich}</p>
                </div>
                <form action={hanhDongDoiDongY} className="shrink-0">
                  <input type="hidden" name="mucDich" value={m.ma} />
                  <input type="hidden" name="bat" value={bat ? "0" : "1"} />
                  <button type="submit" className="nut"
                    style={{
                      background: bat ? "var(--xanh-la-nen)" : "transparent",
                      borderColor: bat ? "var(--xanh-la)" : "var(--vien)",
                    }}
                    aria-pressed={bat}>
                    {bat ? "Đang bật · bấm để tắt" : "Đang tắt · bấm để bật"}
                  </button>
                </form>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="the p-4" style={{ background: "var(--do-nen)", borderColor: "var(--son)" }}>
                  <p className="m-0 text-sm font-semibold">Nếu tắt, anh chị mất</p>
                  <ul className="m-0 mt-1 list-disc space-y-1 pl-5 text-sm">
                    {m.matGi.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
                <div className="the p-4" style={{ background: "var(--xanh-la-nen)", borderColor: "var(--xanh-la)" }}>
                  <p className="m-0 text-sm font-semibold">Vẫn chạy bình thường</p>
                  <ul className="m-0 mt-1 list-disc space-y-1 pl-5 text-sm">
                    {m.vanChay.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className="the mt-8 p-6">
        <h2 className="mt-0 text-lg font-bold">Ô Ly lưu lại việc anh chị bật tắt</h2>
        <p className="text-sm" style={{ color: "var(--muc-nhat)" }}>
          Mỗi lần bật hoặc tắt đều được ghi lại kèm thời điểm và phiên bản văn bản giải thích mà anh
          chị đã đọc lúc đó ({PHIEN_BAN_VAN_BAN_DONG_Y}). Đây là bằng chứng để chứng minh Ô Ly đã hỏi
          trước khi làm.
        </p>
        {bangGhi.length === 0 ? (
          <p className="m-0 text-sm">Chưa có thay đổi nào.</p>
        ) : (
          <ul className="m-0 list-none space-y-1 p-0 text-sm">
            {bangGhi.slice().reverse().slice(0, 12).map((b, i) => (
              <li key={`${b.at}-${i}`}>
                {new Date(b.at).toLocaleString("vi-VN")} — {b.mucDich}: {b.dongY ? "bật" : "tắt"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
