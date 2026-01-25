import type { Metadata } from "next";
import { Geist, Geist_Mono, Dancing_Script } from "next/font/google";
import { ThemeProvider } from "next-themes";
import ThemeManager from "@/components/ThemeManager";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cursiveFont = Dancing_Script({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-cursive",
});

export const metadata: Metadata = {
  title: "Lawvics - 50-State Survey Engine",
  description: "AI-powered legal research across all 50 US jurisdictions",
  icons: {
    icon: [
      { url: '/brand/transparent/Lawvics person-dark.png', media: '(prefers-color-scheme: light)' },
      { url: '/brand/transparent/Lawvics person-light.png', media: '(prefers-color-scheme: dark)' }
    ]
  }
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cursiveFont.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeManager />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
