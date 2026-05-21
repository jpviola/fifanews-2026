import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Publisher ID hardcodeado: es información pública (está en ads.txt) y debe
// estar siempre en el HTML para que Google AdSense pueda verificar el sitio,
// independientemente de si NEXT_PUBLIC_ADSENSE_CLIENT está seteado al build.
const ADSENSE_PUBLISHER_ID = "ca-pub-1971729858495340";

export const metadata: Metadata = {
  title: {
    default: "Mundial 2026 | Noticias, selecciones, estadios y fixture",
    template: "%s | Mundial 2026",
  },
  description:
    "Noticias del Mundial 2026: selecciones, países anfitriones, estadios, jugadores, entradas y fixture.",
  other: {
    // Requerido por AdSense para verificación del sitio
    "google-adsense-account": ADSENSE_PUBLISHER_ID,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseClient =
    (process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "").trim() || ADSENSE_PUBLISHER_ID;
  const adsenseHeaderSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER ?? "";
  const gamEnabled = Boolean(process.env.NEXT_PUBLIC_GAM_NETWORK_CODE);
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full premium-bg text-zinc-900">
        {/* AdSense script — habilita Auto Ads globalmente y sirve los ad units manuales */}
        <Script
          id="adsense-init"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {gamEnabled ? (
          <Script
            async
            src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
            strategy="afterInteractive"
          />
        ) : null}
        <div className="min-h-full">
          {adsenseHeaderSlot ? (
            <div className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/90 backdrop-blur">
              <div className="mx-auto w-full max-w-6xl px-4 py-2">
                <AdSlot
                  provider="adsense"
                  slot={adsenseHeaderSlot}
                  className="mx-auto w-full"
                />
              </div>
            </div>
          ) : null}
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl px-4 py-6">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
