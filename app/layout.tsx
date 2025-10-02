import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Surge Conf Secure" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-2xl mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}
