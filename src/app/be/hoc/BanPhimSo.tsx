"use client";

/**
 * Bàn phím số.
 *
 * Học sinh lớp 1 "chưa gõ bàn phím" và dùng thiết bị của bố mẹ. Một ô nhập chữ
 * bình thường sẽ bật bàn phím hệ thống với đủ chữ cái và dấu — quá nhiều thứ
 * cho một đứa trẻ sáu tuổi. Ở đây chỉ có mười phím số, một phím xóa, một phím
 * gửi, tất cả đều đủ to để bấm bằng ngón tay.
 */
export function BanPhimSo({
  gia, donVi, dangGui, onDoi, onGui,
}: {
  gia: string;
  donVi?: string;
  dangGui: boolean;
  onDoi: (v: string) => void;
  onGui: () => void;
}) {
  const them = (d: string) => {
    if (gia.length >= 4) return;
    onDoi(gia === "0" ? d : gia + d);
  };

  return (
    <div>
      <p className="mb-4 text-center" aria-live="polite">
        <span
          className="inline-block min-w-[8rem] rounded-2xl px-6 py-3 text-4xl font-bold"
          style={{ background: "var(--giay)", border: "2px dashed var(--vien)" }}
        >
          {gia || "?"}
        </span>
        {donVi && <span className="ml-3 text-xl" style={{ color: "var(--muc-nhat)" }}>{donVi}</span>}
      </p>

      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" className="nut nut-tre" onClick={() => them(d)}>{d}</button>
        ))}
        <button type="button" className="nut nut-tre" aria-label="Xóa một chữ số"
          onClick={() => onDoi(gia.slice(0, -1))}>⌫</button>
        <button type="button" className="nut nut-tre" onClick={() => them("0")}>0</button>
        <button
          type="button"
          className="nut nut-tre"
          style={{ background: "var(--xanh-la-nen)", borderColor: "var(--xanh-la)" }}
          aria-label="Gửi câu trả lời"
          disabled={dangGui || gia === ""}
          onClick={onGui}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
