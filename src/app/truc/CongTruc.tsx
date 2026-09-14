"use client";

import { useActionState } from "react";
import { hanhDongMoCongTruc } from "./actions";

/**
 * Cổng vào bảng trực.
 *
 * Hỏi TÊN NGƯỜI TRỰC chứ không chỉ hỏi mã: mọi thao tác trên bảng này đều vào
 * nhật ký kèm tên người làm, và CR-06 đòi nhật ký xử lý đầy đủ. Một nhật ký
 * không biết ai đã bấm nút thì không dùng được khi bị kiểm tra.
 */
export function CongTruc() {
  const [trangThai, gui, dangGui] = useActionState(hanhDongMoCongTruc, null);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="the p-7">
        <p className="m-0 text-sm font-semibold tracking-wide" style={{ color: "var(--son)" }}>
          Ô LY · NỘI BỘ
        </p>
        <h1 className="mt-2 text-2xl font-bold">Bảng trực xử lý yêu cầu</h1>
        <p style={{ color: "var(--muc-nhat)" }}>
          Dành cho nhân sự trực của Ô Ly. Đây không phải phần của phụ huynh.
        </p>

        <form action={gui} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="block font-semibold">Tên người trực</span>
            <span className="block text-xs" style={{ color: "var(--muc-nhat)" }}>
              Mọi thao tác sẽ được ghi vào nhật ký kèm tên này.
            </span>
            <input
              name="nguoiTruc"
              autoComplete="off"
              className="mt-2 w-full rounded-xl px-4 py-3"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
            />
          </label>
          <label className="block text-sm">
            <span className="block font-semibold">Mã trực</span>
            <input
              name="ma"
              type="password"
              autoComplete="off"
              className="mt-2 w-full rounded-xl px-4 py-3"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
            />
          </label>
          {trangThai?.loi && (
            <p className="m-0 text-sm" role="alert" style={{ color: "var(--son)" }}>{trangThai.loi}</p>
          )}
          <button type="submit" className="nut nut-chinh w-full" disabled={dangGui}>
            {dangGui ? "Đang mở…" : "Vào ca trực"}
          </button>
        </form>

        <p className="mt-6 text-xs" style={{ color: "var(--muc-nhat)" }}>
          Bản dựng thử nghiệm dùng sẵn mã trực2026. Trước khi mở cho người dùng thật, phần này
          phải thay bằng tài khoản nhân sự có phân quyền và có nhật ký đăng nhập.
        </p>
      </div>
    </main>
  );
}
