import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aloha — Grow with intention",
  description: "A personal social media companion for creators and communities.",
  icons: {
    icon: [
      { url: "/aloha.svg", type: "image/svg+xml" },
      { url: "/aloha.ico", sizes: "any" },
      { url: "/aloha.png", type: "image/png" },
    ],
    apple: { url: "/aloha.png", type: "image/png" },
    shortcut: "/aloha.ico",
  },
  openGraph: {
    title: "Aloha — Grow with intention",
    description:
      "A personal social media companion for creators and communities.",
    images: [{ url: "/aloha.jpg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
