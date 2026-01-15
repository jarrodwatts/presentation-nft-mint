import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import { Providers } from "@/lib/providers";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Abstract NFT",
  description: "Collect your Abstract presentation NFT",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Abstract NFT",
    description: "Collect your Abstract presentation NFT",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Abstract NFT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Abstract NFT",
    description: "Collect your Abstract presentation NFT",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${manrope.variable} antialiased font-body bg-background text-foreground`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
