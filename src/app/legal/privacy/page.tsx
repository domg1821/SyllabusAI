import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — SyllabusAI",
  description: "Privacy Policy for SyllabusAI",
};

const EFFECTIVE_DATE = "May 13, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Logo */}
        <Link href="/" className="mb-10 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">SyllabusAI</span>
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm sm:px-12">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Effective date: {EFFECTIVE_DATE}</p>

          <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            These are template terms provided for informational purposes. Have a qualified attorney review them before launch.
          </div>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">1. Overview</h2>
              <p>SyllabusAI (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data when you use syllabusai.com (the &ldquo;Service&rdquo;).</p>
              <p className="mt-2">By using the Service, you agree to the collection and use of information in accordance with this policy.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">2. Data We Collect</h2>

              <h3 className="mb-1.5 mt-4 font-medium text-gray-900">Account Information</h3>
              <p>When you create an account, we collect your <strong>email address</strong> and a hashed version of your password. We do not store plain-text passwords.</p>

              <h3 className="mb-1.5 mt-4 font-medium text-gray-900">Course and Syllabus Data</h3>
              <p>When you use the Service, we store the data you provide and generate, including:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Syllabus text you upload or paste (PDF, Word, image, or plain text)</li>
                <li>Course information extracted from your syllabi (course name, schedule, deadlines)</li>
                <li>Study plans, task completion status, and grade entries you record</li>
                <li>Practice test questions and your answers</li>
              </ul>
              <p className="mt-2">This data is stored in your account and is not shared with other users.</p>

              <h3 className="mb-1.5 mt-4 font-medium text-gray-900">Usage Data</h3>
              <p>We automatically collect certain technical data when you use the Service:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Number of syllabus analyses performed (to enforce free-tier limits)</li>
                <li>IP address (used for rate limiting unauthenticated requests)</li>
                <li>Browser type and approximate location (via standard web request headers)</li>
                <li>Error events and crash reports (collected via Sentry for debugging)</li>
              </ul>

              <h3 className="mb-1.5 mt-4 font-medium text-gray-900">Payment Information</h3>
              <p>If you subscribe to Pro, payment details (card number, billing address) are collected and processed directly by <strong>Stripe</strong>. We never see or store your full card number. We receive and store your Stripe customer ID and subscription status to manage your Pro access.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">3. How We Use Your Data</h2>
              <p>We use the data we collect to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Provide, operate, and improve the Service</li>
                <li>Authenticate you and manage your account</li>
                <li>Process AI analysis of your uploaded syllabi via the Anthropic API</li>
                <li>Enforce free-tier usage limits and manage Pro subscription access</li>
                <li>Detect and prevent abuse, fraud, and security incidents</li>
                <li>Respond to your support requests</li>
                <li>Send transactional emails (account confirmation, password reset)</li>
              </ul>
              <p className="mt-2">We do not sell your personal data to third parties. We do not use your course content or syllabus data to train AI models.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">4. Third-Party Services</h2>
              <p>The Service relies on the following third-party providers to function:</p>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">Supabase</p>
                  <p className="mt-1 text-gray-600">Used for user authentication, session management, and database storage of your account and course data. Data is stored in the United States. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Supabase&apos;s Privacy Policy</a>.</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">Stripe</p>
                  <p className="mt-1 text-gray-600">Used for payment processing and subscription management. Stripe collects and processes your payment information directly. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Stripe&apos;s Privacy Policy</a>.</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">Anthropic</p>
                  <p className="mt-1 text-gray-600">Used to power AI analysis features. When you analyze a syllabus or generate a practice test, the relevant text is sent to Anthropic&apos;s API. Anthropic&apos;s API data handling policies apply to this processing. See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Anthropic&apos;s Privacy Policy</a>.</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">Sentry</p>
                  <p className="mt-1 text-gray-600">Used for error monitoring and crash reporting. Error data may include your user ID and truncated request context to help us diagnose bugs. See <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Sentry&apos;s Privacy Policy</a>.</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">Upstash</p>
                  <p className="mt-1 text-gray-600">Used for API rate limiting. Stores anonymized request counts keyed by user ID or IP address. No personal content is stored. See <a href="https://upstash.com/static/trust/privacy.pdf" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Upstash&apos;s Privacy Policy</a>.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">5. Data Retention</h2>
              <p>We retain your account data and course content for as long as your account is active. If you delete your account, your profile, course data, and practice test history are permanently deleted from our database within 30 days.</p>
              <p className="mt-2">Stripe retains transaction records independently as required by financial regulations; deleting your SyllabusAI account does not delete Stripe&apos;s records of past transactions.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">6. Your Rights</h2>
              <p>You have the following rights regarding your data:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Access:</strong> You can view your stored course and profile data in your dashboard at any time.</li>
                <li><strong>Correction:</strong> You can update your email address and password from your account settings page.</li>
                <li><strong>Deletion:</strong> You can permanently delete your account and all associated data from Settings → Account → Delete Account. This action is irreversible.</li>
                <li><strong>Export:</strong> To request a copy of your data, contact us at the email below.</li>
              </ul>
              <p className="mt-2">If you are located in the European Economic Area (EEA), you may have additional rights under GDPR. Contact us to exercise these rights.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">7. Cookies</h2>
              <p>The Service uses cookies and similar technologies solely for authentication and session management (via Supabase). We do not use cookies for advertising or cross-site tracking.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">8. Children&apos;s Privacy</h2>
              <p>The Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal data, we will delete it promptly.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the effective date at the top of this page. We encourage you to review this policy periodically.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">10. Contact</h2>
              <p>If you have any questions about this Privacy Policy or how we handle your data, please contact us at:</p>
              <p className="mt-2">
                <a href="mailto:domgbp21@gmail.com" className="font-medium text-indigo-600 hover:underline">domgbp21@gmail.com</a>
              </p>
            </section>

          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          <Link href="/legal/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          {" · "}
          <Link href="/" className="hover:text-gray-600 transition-colors">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
