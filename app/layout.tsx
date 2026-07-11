import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
