import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koinonia — Digital Christian Fellowship Platform",
  description: "A dedicated, sacred space for Christian gathering, audio/video prayer rooms, and Bible study groups.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/apple-icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Koinonia",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-koinonia-navy text-slate-100 antialiased selection:bg-amber-600/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
