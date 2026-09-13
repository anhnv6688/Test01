import Link from "next/link";
import { danhSachCon, hoDauTien } from "@/lib/server/repo";
import { moiDuLieu } from "@/lib/server/seed";
import { ChonHoSo } from "./ChonHoSo";

export const dynamic = "force-dynamic";

/**
 * Màn hình chọn hồ sơ.
 *
 * BR-01 và nhu cầu của học sinh lớp 1: "không có chữ nào bắt buộc phải đọc mới
 * dùng được sản phẩm". Vì vậy mỗi hồ sơ có một hình khối và một màu riêng, bấm
 * vào là nghe đọc tên — trẻ chưa ráp được vần vẫn chọn đúng hồ sơ của mình.
 *
 * NT-03: không thu thập ảnh khuôn mặt của trẻ. Hình đại diện là hình khối do
 * sản phẩm vẽ, không phải ảnh.
 */
export default function TrangBe() {
  moiDuLieu();
  const ho = hoDauTien();
  const con = ho ? danhSachCon(ho.id) : [];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="m-0 text-2xl font-bold">Chào con!</h1>
        <Link href="/phu-huynh" className="nut text-sm no-underline" style={{ color: "var(--muc-nhat)" }}>
          Bố mẹ ơi
        </Link>
      </header>

      <p className="mb-6 text-lg" style={{ color: "var(--muc-nhat)" }}>
        Con bấm vào hình của mình nhé.
      </p>

      <ChonHoSo con={con.map((c) => ({ id: c.id, tenGoi: c.tenGoi, lop: c.lop }))} />
    </main>
  );
}
