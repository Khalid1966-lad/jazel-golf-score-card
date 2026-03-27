import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PWAProvider } from "@/components/PWAProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jazelgolf.org'),
  title: 'Jazel Golf Scorecard',
  description: 'Track your golf rounds, find Morocco golf courses, and improve your game with Jazel - the ultimate golf scorecard app.',
  keywords: ["Jazel", "Golf", "Scorecard", "Morocco", "Golf Courses", "Golf Tracking", "Handicap"],
  authors: [{ name: "Jazel Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: 'Jazel Golf Scorecard',
    description: 'Track your golf rounds, find Morocco golf courses, and improve your game with Jazel - the ultimate golf scorecard app.',
    url: 'https://jazelgolf.org',
    siteName: 'Jazel',
    images: [
      {
        url: '/og-image.jpg',
        width: 1344,
        height: 768,
        alt: 'Jazel Golf Scorecard - Track your golf rounds',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jazel Golf Scorecard',
    description: 'Track your golf rounds, find Morocco golf courses and improve your game with Jazel - the ultimate golf scorecard app.',
    images: ['/og-image.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jazel",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#15803d" },
  ],
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
        <PWAProvider>
          {children}
        </PWAProvider>
        <Toaster />
      </body>
    </html>
  );
}
