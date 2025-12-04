// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fifth Avenue Spa",
  description: "Wellness, hammam, massage, hair, nails & beauty in the heart of the city Marrakech.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F3EE] text-slate-50 antialiased">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
