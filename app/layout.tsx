import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Draft Scoreboard",
  description:
    "Live standings for our 6-manager fantasy draft of the 2026 FIFA World Cup.",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
