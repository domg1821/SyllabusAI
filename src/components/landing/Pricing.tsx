import AnimateIn from "@/components/AnimateIn";
import PricingCards from "@/components/pricing/PricingCards";

export default function Pricing() {
  return (
    <section id="pricing" className="bg-gray-50 dark:bg-slate-900 py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <AnimateIn direction="up">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Pricing
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50 sm:text-4xl">
              Free to start. Pro when you need it.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500 dark:text-slate-400">
              Try everything free — upgrade when you want unlimited access and AI study modes.
            </p>
          </div>
        </AnimateIn>

        <AnimateIn direction="up" delay={100}>
          <PricingCards variant="landing" />
        </AnimateIn>

        {/* Money-back guarantee */}
        <AnimateIn direction="up" delay={150}>
          <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 px-6 py-4">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">30-day money-back guarantee</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Not happy? Email us within 30 days of your first charge and we&apos;ll refund you in full.
              </p>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
