import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingNav from "@/components/landing/LandingNav";
import UrgencyBanner from "@/components/landing/UrgencyBanner";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Demo from "@/components/landing/Demo";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://syllabusai.vercel.app";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SyllabusAI",
  applicationCategory: "EducationApplication",
  operatingSystem: "Web",
  url: BASE,
  description:
    "AI-powered student study assistant. Upload your syllabus to get a personalized study plan, practice tests, flashcards, and deadline tracking — all in one place.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan available. Pro plan at $9.99/month.",
  },
  featureList: [
    "Syllabus analysis and deadline extraction",
    "AI-generated study plans",
    "Practice tests and flashcards",
    "Grade tracking",
    "Exam cram mode",
    "Teach It Back (Feynman technique)",
    "Memory Map concept organizer",
    "Exam-style questions",
  ],
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
  },
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <>
      {/* Structured data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <UrgencyBanner />
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <Features />
        <Demo />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
