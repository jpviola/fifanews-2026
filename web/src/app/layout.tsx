import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "Mundial 2026 | Noticias, selecciones, estadios y fixture",
    template: "%s | Mundial 2026",
  },
  description:
    "Noticias del Mundial 2026: selecciones, países anfitriones, estadios, jugadores, entradas y fixture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full premium-bg text-zinc-900">
        <div className="min-h-full">
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
