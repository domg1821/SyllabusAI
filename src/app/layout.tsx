import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeScript } from "@/components/ThemeProvider";
import BackToTop from "@/components/BackToTop";

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
    default: "SyllabusAI — AI Study Planner for College Students",
    template: "%s — SyllabusAI",
  },
  description:
    "Upload your syllabus and get an instant AI study plan, deadline tracker, practice tests, and flashcards. The easiest way for college students to stay on top of every class.",
  keywords: [
    "syllabus AI",
    "AI study planner",
    "college study app",
    "syllabus analyzer",
    "study plan generator",
    "AI flashcards",
    "practice test generator",
    "deadline tracker for students",
    "AI homework helper",
    "college productivity app",
    "study schedule maker",
    "exam preparation tool",
  ],
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "SyllabusAI",
    title: "SyllabusAI — AI Study Planner for College Students",
    description:
      "Upload your syllabus and get an instant AI study plan, deadline tracker, practice tests, and flashcards. Free to start.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SyllabusAI — AI-powered study planner for college students",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SyllabusAI — AI Study Planner for College Students",
    description:
      "Upload your syllabus and get an instant AI study plan, deadline tracker, practice tests, and flashcards. Free to start.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: APP_URL,
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
          <div className="animate-page-enter min-h-full flex flex-col">
            {children}
          </div>
          <BackToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
