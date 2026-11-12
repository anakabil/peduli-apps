import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from "@/lib/constants";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { LangProvider } from "@/components/i18n/lang-provider";
import { getLang } from "@/lib/i18n-server";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
  title: { default: `${APP_NAME} - ${COMPANY_NAME}`, template: `%s | ${APP_NAME}` },
  description: lang === "en" ? `Hazard Reporting and Control. Hazard reporting application of ${COMPANY_NAME}.` : `${APP_TAGLINE}. Aplikasi pelaporan bahaya ${COMPANY_NAME}.`,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32" }, { url: "/icons/favicon-64.png", sizes: "64x64" }],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PEDULI" },
  formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#006042",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang} className={jakarta.variable}>
      <body className="antialiased">
        <LangProvider lang={lang}>
          <PwaProvider>{children}</PwaProvider>
        </LangProvider>
      </body>
    </html>
  );
}
