import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { FinanceProvider } from "@/context/FinanceContext";
import PWAInstallPrompt from "@/components/layout/PWAInstallPrompt";

export const viewport: Viewport = {
  themeColor: "#0b100d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "بيني وايز — متتبع المصروفات والميزانية الشخصية",
  description: "تتبع دخلك ومصروفاتك ومحافظك المالية والميزانية الشهرية بكل دقة وسهولة بالجنيه المصري.",
  applicationName: "بيني وايز",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "بيني وايز",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: "/icons/icon-192.png",
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
          </FinanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
