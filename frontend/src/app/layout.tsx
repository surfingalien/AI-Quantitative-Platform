import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AI Quantitative Trading Platform",
  description: "Advanced AI-powered institutional-grade trading assistant with real-time signals, portfolio optimization, and automated execution",
  viewport: "width=device-width, initial-scale=1",
  keywords: "trading, AI, quantitative, algorithmic, signals, portfolio, optimization",
  authors: [{ name: "Suhas GM" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
