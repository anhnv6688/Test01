"use client";

import { useActionState } from "react";
import { CHO_GIUA_HAI_LAN_GUI_GIAY, HAN_DUNG_PHUT, SO_CHU_SO } from "@/lib/privacy/ma-mot-lan";
import { TEN_QUAN_HE, type QuanHe } from "@/lib/privacy/nguoi-giam-ho";
import { cheSo } from "@/lib/privacy/so-dien-thoai";
import { hanhDongGuiMa, hanhDongXacMinhMa } from "../actions";

/**
 * Xác minh bằng mã một lần gửi qua số điện thoại.
 *
 * Hai biểu mẫu tách rời chứ không phải một luồng nhiều bước có trạng thái trên
 * máy chủ: bấm gửi mã, rồi nhập mã. Làm vậy để tải lại trang giữa chừng không
 * làm mất việc — phụ huynh hay chuyển sang ứng dụng tin nhắn rồi quay lại, và
 * trên điện thoại thì việc quay lại đó có khi là tải lại cả trang.
 */
export function XacMinhSoDienThoai({ quanHeMacDinh, hoTenMacDinh }: {
  quanHeMacDinh: QuanHe;
  hoTenMacDinh: string;
}) {
  const [gui, guiAction, dangGui] = useActionState(hanhDongGuiMa, null);
  const [xac, xacAction, dangXac] = useActionState(hanhDongXacMinhMa, null);

  return (
    <div className="the mt-4 p-5">
      <h3 className="mt-0 mb-1 text-base font-bold">Xác minh bằng mã gửi qua điện thoại</h3>
      <p className="m-0 mb-4 text-sm" style={{ color: "var(--muc-nhat)" }}>
        Ô Ly nhắn một mã {SO_CHU_SO} chữ số tới số máy của anh chị. Ô Ly{" "}
        <strong>không lưu số điện thoại</strong> — chỉ giữ hai số cuối để anh chị nhận ra số của
        mình, và một dấu vân tay không đọc ngược ra số được.
      </p>

      <form action={guiAction} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Số điện thoại
          <input name="soDienThoai" inputMode="tel" required placeholder="09xx xxx xxx"
            className="the ml-2 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="nut text-sm" disabled={dangGui}>
          {dangGui ? "Đang gửi…" : "Gửi mã"}
        </button>
        <span className="text-sm" style={{ color: "var(--muc-nhat)" }}>
          Mỗi lần xin mã cách nhau {CHO_GIUA_HAI_LAN_GUI_GIAY} giây.
        </span>
      </form>

      {gui && "loi" in gui && gui.loi && (
        <p className="the mt-3 mb-0 p-3 text-sm"
          style={{ background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
          {gui.loi}
        </p>
      )}

      {gui && "daGui" in gui && gui.daGui && (
        <>
          <p className="m-0 mt-3 text-sm">
            Đã gửi tới {cheSo(gui.haiSoCuoi)}. Mã dùng trong {HAN_DUNG_PHUT} phút.
          </p>
          {gui.maHienThi && (
            // Chỉ hiện khi đang chạy bản giả lập — không có tin nhắn nào được
            // gửi đi, nên nếu không hiện thì không ai thử được luồng này.
            <p className="the mt-2 mb-0 p-3 text-sm"
              style={{ background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
              <strong>Bản dựng thử:</strong> không có tin nhắn nào được gửi ra ngoài. Mã là{" "}
              <code>{gui.maHienThi}</code>. Vì mã hiện ở đây nên lần xác minh này{" "}
              <strong>không chứng minh</strong> anh chị giữ số máy đó, và Ô Ly sẽ ghi đúng như vậy
              vào hồ sơ.
            </p>
          )}
        </>
      )}

      <form action={xacAction} className="mt-5 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Họ tên
            <input name="hoTen" required defaultValue={hoTenMacDinh}
              className="the ml-2 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm">
            Quan hệ với con
            <select name="quanHe" defaultValue={quanHeMacDinh} className="the ml-2 px-3 py-2 text-sm">
              {(["cha", "me", "nguoi-giam-ho"] as const).map((q) => (
                <option key={q} value={q}>{TEN_QUAN_HE[q]}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Mã vừa nhận
            <input name="ma" inputMode="numeric" autoComplete="one-time-code"
              maxLength={SO_CHU_SO} required className="the ml-2 w-28 px-3 py-2 text-sm" />
          </label>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="tuXacNhan" value="1" className="mt-1" required />
          <span>
            Tôi xác nhận tôi đã thành niên và là cha, mẹ hoặc người giám hộ của cháu, và tôi đồng ý
            chịu trách nhiệm về các lựa chọn quyền riêng tư của tài khoản này.
          </span>
        </label>

        <button type="submit" className="nut" disabled={dangXac}>
          {dangXac ? "Đang kiểm…" : "Xác minh"}
        </button>
      </form>

      {xac && "loi" in xac && xac.loi && (
        <p className="the mt-3 mb-0 p-3 text-sm"
          style={{ background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
          {xac.loi}
        </p>
      )}
      {xac && "xong" in xac && xac.xong && (
        <p className="m-0 mt-3 text-sm"><strong>Xong.</strong> Ô Ly đã ghi lại lần xác minh này.</p>
      )}
    </div>
  );
}
