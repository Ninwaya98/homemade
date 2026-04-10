import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HomeMade — Real food & handmade goods, made by real people",
  description:
    "A marketplace connecting home cooks and artisan sellers with neighbours who want authentic, homemade food and handmade goods.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafaf9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f8f7ff] text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
