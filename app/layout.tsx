import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NotificationBanner } from "@/components/common/NotificationBanner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LD OPEN HUB — 公益站导航",
  description: "公益站导航，由社区共建。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen font-sans antialiased`}
        suppressHydrationWarning
      >
        <NotificationBanner />
        {children}
      </body>
    </html>
  );
}
