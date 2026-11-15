import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { FinanceProvider } from "@/context/FinanceContext";
import PWAInstallPrompt from "@/components/layout/PWAInstallPrompt";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import OfflineNotice from "@/components/layout/OfflineNotice";

export const viewport: Viewport = {
  themeColor: "#f8faf9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "محفظتي — إدارة وتتبع المصروفات الشخصية",
  description: "تتبع دخلك ومصروفاتك ومحافظك المالية والميزانية الشهرية بكل دقة وسهولة بالجنيه المصري.",
  applicationName: "محفظتي",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "محفظتي",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <AuthProvider>
          <FinanceProvider>
            {children}
            <PWAInstallPrompt />
            <OfflineNotice />
            <ServiceWorkerRegister />
          </FinanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
