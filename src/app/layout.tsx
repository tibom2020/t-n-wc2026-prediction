import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NHẬN ĐỊNH BÓNG ĐÁ WC 2026",
  description: "Nhận định bóng đá World Cup 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
