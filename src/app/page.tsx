import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Demo from "@/components/landing/Demo";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <>
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
