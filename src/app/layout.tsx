import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jazel Golf Scorecard",
  description: "Track your golf rounds, find Morocco golf courses, and improve your game with Jazel - the ultimate golf scorecard app.",
  keywords: ["Jazel", "Golf", "Scorecard", "Morocco", "Golf Courses", "Golf Tracking", "Handicap"],
  authors: [{ name: "Jazel Team" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Jazel Golf Scorecard",
    description: "Track your golf rounds and find Morocco golf courses",
    url: "https://jazel.golf",
    siteName: "Jazel",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jazel Golf Scorecard",
    description: "Track your golf rounds and find Morocco golf courses",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
