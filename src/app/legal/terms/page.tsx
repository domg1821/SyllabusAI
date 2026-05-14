import Link from "next/link";

export const metadata = {
  title: "Terms of Service — SyllabusAI",
  description: "Terms of Service for SyllabusAI",
};

const EFFECTIVE_DATE = "May 13, 2026";

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-500">Effective date: {EFFECTIVE_DATE}</p>

          <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            These are template terms provided for informational purposes. Have a qualified attorney review them before launch.
          </div>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">1. Service Description</h2>
              <p>SyllabusAI (&ldquo;the Service,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is an AI-powered study tool that helps students analyze course syllabi, track deadlines, generate study plans, and create practice tests. The Service is operated as a web application accessible at syllabusai.com.</p>
              <p className="mt-2">By accessing or using the Service, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">2. User Accounts</h2>
              <p>To access most features of the Service, you must create an account. You agree to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your password and promptly notify us of any unauthorized use</li>
                <li>Be responsible for all activity that occurs under your account</li>
                <li>Not share your account credentials with others</li>
              </ul>
              <p className="mt-2">You must be at least 13 years old to use the Service. By creating an account, you represent that you meet this age requirement.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">3. Acceptable Use</h2>
              <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Use the Service in any way that violates applicable laws or regulations</li>
                <li>Upload content that infringes on the intellectual property rights of others</li>
                <li>Attempt to reverse engineer, decompile, or otherwise derive the source code of the Service</li>
                <li>Use automated tools to scrape, crawl, or extract data from the Service</li>
                <li>Circumvent rate limits, access controls, or other technical restrictions</li>
                <li>Upload malicious files or content intended to harm the Service or other users</li>
                <li>Use the Service to generate academic work intended for fraudulent submission (academic dishonesty is solely your responsibility)</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">4. Subscription and Payment Terms</h2>

              <h3 className="mb-1.5 mt-4 font-medium text-gray-900">Free Plan</h3>
              <p>The Service offers a free tier with limited features, including a restricted number of syllabus analyses and practice tests per week.</p>

              <h3 className="mb-1.5 mt-4 font-medium text-gray-900">Pro Subscription</h3>
              <p>SyllabusAI Pro is a paid subscription providing unlimited access to all features. By subscribing to Pro, you agree to the following:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Billing:</strong> Subscriptions are billed monthly to the payment method you provide at checkout. Your subscription renews automatically at the end of each billing period unless cancelled.</li>
                <li><strong>Pricing:</strong> Current pricing is displayed on our pricing page. We reserve the right to change subscription prices with at least 30 days&apos; advance notice.</li>
                <li><strong>Payment Processing:</strong> All payments are processed securely by Stripe. We do not store your full credit card information.</li>
              </ul>

              <h3 className="mb-1.5 mt-4 font-medium text-gray-900">Cancellation</h3>
              <p>You may cancel your Pro subscription at any time from your account settings. Upon cancellation, your Pro access will remain active until the end of the current billing period, after which your account will revert to the free tier. We do not offer prorated refunds for partial billing periods.</p>

              <h3 className="mb-1.5 mt-4 font-medium text-gray-900">Refund Policy</h3>
              <p>We offer a 7-day money-back guarantee for new Pro subscribers. If you are not satisfied with your Pro subscription, contact us at <a href="mailto:domgbp21@gmail.com" className="text-indigo-600 hover:underline">domgbp21@gmail.com</a> within 7 days of your initial purchase for a full refund. After this period, subscription fees are non-refundable except as required by applicable law.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">5. Intellectual Property</h2>
              <p>The Service and its original content, features, and functionality are and will remain the exclusive property of SyllabusAI and its licensors. Our name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of SyllabusAI.</p>
              <p className="mt-2">You retain ownership of any content you upload to the Service (such as syllabus documents). By uploading content, you grant SyllabusAI a limited, non-exclusive license to process and store that content solely for the purpose of providing the Service to you.</p>
              <p className="mt-2">AI-generated outputs (study plans, practice tests, analyses) are provided as-is. We make no claim of ownership over content generated on your behalf, but we also make no guarantees of accuracy or fitness for any particular purpose.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">6. Disclaimer of Warranties</h2>
              <p>THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
              <p className="mt-2">We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. AI-generated content may be inaccurate, incomplete, or misleading — always verify important information with your course materials and instructors.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">7. Limitation of Liability</h2>
              <p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, SYLLABUSAI AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF REVENUE, OR ACADEMIC HARM.</p>
              <p className="mt-2">In no event shall our total liability to you for all claims exceed the amount you paid to us in the twelve (12) months preceding the claim, or $10 USD if you have not made any payments.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">8. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms shall be brought in the federal or state courts located in the United States, and you hereby consent to personal jurisdiction in such courts.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">9. Changes to These Terms</h2>
              <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes by updating the effective date at the top of this page and, where appropriate, by sending an email to registered users. Continued use of the Service after changes constitutes acceptance of the revised Terms.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold text-indigo-600">10. Contact</h2>
              <p>For questions about these Terms, please contact us at <a href="mailto:domgbp21@gmail.com" className="text-indigo-600 hover:underline">domgbp21@gmail.com</a>.</p>
            </section>

          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          <Link href="/legal/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          {" · "}
          <Link href="/" className="hover:text-gray-600 transition-colors">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
