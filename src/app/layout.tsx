import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeScript } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://syllabusai.com";

export const metadata: Metadata = {
  title: {
    default: "SyllabusAI — Turn Any Syllabus Into a Study Plan in Seconds",
    template: "%s — SyllabusAI",
  },
  description:
    "Upload or paste your course syllabus. SyllabusAI extracts every deadline and builds a personalized study plan so you never fall behind.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "SyllabusAI",
    title: "SyllabusAI — Turn Any Syllabus Into a Study Plan in Seconds",
    description:
      "Upload or paste your course syllabus. SyllabusAI extracts every deadline and builds a personalized study plan so you never fall behind.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SyllabusAI — AI-powered study planner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SyllabusAI — Turn Any Syllabus Into a Study Plan in Seconds",
    description:
      "Upload or paste your course syllabus. SyllabusAI extracts every deadline and builds a personalized study plan so you never fall behind.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Blocking script: applies .dark before first paint to prevent theme flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
