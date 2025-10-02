import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = { title: "Surge Conf Secure" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="container-page py-8">
          <ToastProvider>{children}</ToastProvider>
        </div>
      </body>
    </html>
  );
}
