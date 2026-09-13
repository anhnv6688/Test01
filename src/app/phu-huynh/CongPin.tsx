"use client";

import { useActionState } from "react";
import { hanhDongMoCong } from "./actions";

/**
 * Cổng mã PIN.
 *
 * Đây là chỗ duy nhất dẫn vào phần chứa lời giải đầy đủ (NT-10). Câu giải thích
 * bên dưới ô nhập không phải để trang trí: phụ huynh cần hiểu vì sao sản phẩm
 * lại khóa phần của chính họ, nếu không họ sẽ tưởng đây là một rào cản bán hàng.
 */
export function CongPin() {
  const [trangThai, gui, dangGui] = useActionState(hanhDongMoCong, null);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="the p-7">
        <h1 className="mt-0 text-2xl font-bold">Phần này dành cho bố mẹ</h1>
        <p style={{ color: "var(--muc-nhat)" }}>
          Ở đây có lời giải đầy đủ của các bài. Ô Ly khóa lại bằng mã PIN để bé không mở
          được khi mượn điện thoại — nếu bé xem được đáp án thì phần luyện tập mất tác dụng.
        </p>
        <form action={gui} className="mt-6">
          <label htmlFor="pin" className="block text-sm font-semibold">Mã PIN bốn số</label>
          <input
            id="pin"
            name="pin"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            className="mt-2 w-full rounded-xl px-4 py-3 text-2xl tracking-[0.4em]"
            style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
          />
          {trangThai?.loi && (
            <p className="mt-3 text-sm" role="alert" style={{ color: "var(--son)" }}>{trangThai.loi}</p>
          )}
          <button type="submit" className="nut nut-chinh mt-5 w-full" disabled={dangGui}>
            {dangGui ? "Đang mở…" : "Mở"}
          </button>
        </form>
        <p className="mt-6 text-xs" style={{ color: "var(--muc-nhat)" }}>
          Bản dựng thử nghiệm dùng sẵn mã 1234.
        </p>
      </div>
    </main>
  );
}
