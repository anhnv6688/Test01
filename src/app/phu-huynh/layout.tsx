import { Suspense } from "react";
import Link from "next/link";
import { DaiBaoBanThu } from "@/components/DaiBaoBanThu";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { hanhDongDongCong } from "./actions";

export const dynamic = "force-dynamic";

const MUC = [
  { href: "/phu-huynh", ten: "Bản tin tối" },
  { href: "/phu-huynh/chup", ten: "Chụp bài" },
  { href: "/phu-huynh/lich-su", ten: "Lịch sử học" },
  { href: "/phu-huynh/quyen-rieng-tu", ten: "Quyền riêng tư" },
  { href: "/phu-huynh/nguoi-giam-ho", ten: "Người đại diện của con" },
  { href: "/phu-huynh/goi-cuoc", ten: "Chi phí và gói" },
  { href: "/phu-huynh/du-lieu-cua-toi", ten: "Dữ liệu của tôi" },
];

export default async function PhuHuynhLayout({ children }: { children: React.ReactNode }) {
  const ho = await daMoCong();

  return (
    <>
      {/*
        Bọc Suspense vì DaiBaoBanThu gọi `connection()` để đọc biến môi trường
        LÚC CHẠY. Không bọc thì cả trang bị kéo sang chế độ dựng theo từng yêu
        cầu.
      */}
      <Suspense fallback={null}>
        <DaiBaoBanThu />
      </Suspense>
      <div className="min-h-screen">
        <header className="border-b" style={{ borderColor: "var(--vien)" }}>
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/phu-huynh" className="text-lg font-bold no-underline" style={{ color: "var(--muc)" }}>
              Ô Ly · phần của bố mẹ
            </Link>
            {ho && (
              <form action={hanhDongDongCong}>
                <button type="submit" className="nut text-sm">Khóa lại</button>
              </form>
            )}
          </div>
          {ho && (
            <nav aria-label="Mục lục phần của bố mẹ"
              className="mx-auto w-full max-w-4xl overflow-x-auto px-4 pb-3">
              <ul className="m-0 flex list-none gap-2 p-0 text-sm">
                {MUC.map((m) => (
                  <li key={m.href} className="shrink-0">
                    <Link href={m.href} className="nut inline-block no-underline" style={{ color: "var(--muc)" }}>
                      {m.ten}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </header>
        {children}
        <footer className="mx-auto w-full max-w-4xl px-4 py-10 text-sm" style={{ color: "var(--muc-nhat)" }}>
          <p className="m-0">
            <Link href="/cach-cham-bai" style={{ color: "inherit" }}>Ô Ly chấm bài thế nào</Link>
            {" · "}
            <Link href="/go-bo-noi-dung" style={{ color: "inherit" }}>Yêu cầu gỡ bỏ nội dung</Link>
          </p>
        </footer>
      </div>
    </>
  );
}
