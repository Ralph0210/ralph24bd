import type { Metadata, Viewport } from "next";
import { Geist, Nunito } from "next/font/google";
import "./globals.css";
import { FestiveBackground } from "@/components/FestiveBackground";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ralph's 24th | 生日快樂",
  description: "Birthday party + Lunar New Year celebration",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${nunito.variable} font-sans antialiased min-h-dvh landing-pattern`}>
        <FestiveBackground />
        {children}
      </body>
    </html>
  );
}
