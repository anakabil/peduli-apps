import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from "@/lib/constants";
import { PwaProvider } from "@/components/pwa/pwa-provider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${APP_NAME} - ${COMPANY_NAME}`, template: `%s | ${APP_NAME}` },
  description: `${APP_TAGLINE}. Aplikasi pelaporan bahaya ${COMPANY_NAME}.`,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32" }, { url: "/icons/favicon-64.png", sizes: "64x64" }],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PEDULI" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#006042",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="antialiased">
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
