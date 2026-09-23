import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RespiraShield AI — Monitoring Risiko Pernapasan",
  description:
    "Aplikasi klasifikasi risiko gangguan pernapasan berbasis kualitas udara dan data pengguna. Pantau kondisi udara, terima notifikasi risiko, dan lindungi kesehatan pernapasan Anda.",
  keywords: [
    "respirashield",
    "air quality",
    "respiratory risk",
    "IoT",
    "machine learning",
    "kesehatan pernapasan",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
