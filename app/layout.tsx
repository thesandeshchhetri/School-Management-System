import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

// next/font self-hosts and preloads these at build time instead of a
// render-blocking @import from Google's CDN, which was adding latency
// to first paint on every page.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brightpath School Manager",
  description: "School management system — students, attendance, grades, fees, timetable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
