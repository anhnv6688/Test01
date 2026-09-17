import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { DaiBaoBanThu } from "@/components/DaiBaoBanThu";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ô Ly — học Toán tiểu học",
  description:
    "Ô Ly giúp trẻ lớp 1–2 làm được bài mà không phụ thuộc khả năng đọc, và giúp bố mẹ biết con sai vì lý do gì.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Ô Ly", statusBarStyle: "default" },
};

// RB-06: thiết bị chính nhiều khả năng là điện thoại của phụ huynh.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcf8" },
    { media: "(prefers-color-scheme: dark)", color: "#14171f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        {/*
          Bọc trong Suspense để một mình dải báo phụ thuộc vào lúc chạy, còn
          các trang tĩnh vẫn dựng sẵn được. Không bọc thì `connection()` trong
          bố cục gốc kéo TOÀN BỘ trang sang chế độ dựng theo từng yêu cầu.
        */}
        <Suspense fallback={null}>
          <DaiBaoBanThu />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
