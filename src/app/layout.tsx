import type { Metadata, Viewport } from "next";
import { Figtree, Lora } from "next/font/google";

import "./globals.css";
import { ToastProvider } from "@/lib/toast";
import { ThemeProvider } from "@/lib/theme";

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

const heading = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Meso Craft | Handmade in Iraq",
  description:
    "A marketplace for handmade goods from local artisans in your neighbourhood.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f3ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full text-slate-900 dark:text-stone-100 font-sans">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
