import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | sendit scan",
  description: "How sendit scan handles your data, what we collect, and how to request deletion. Privacy policy for our Copart and IAA auction analyzer.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-bold text-[#fafafa] mb-2" style={{ fontFamily: "var(--font-grotesk)" }}>Privacy Policy</h1>
      <p className="text-[#52525b] text-sm mb-8">Last updated: May 12, 2026</p>

      <div className="space-y-6 text-[14px] text-[#a1a1aa] leading-relaxed">
        <section>
          <h2 className="text-[#e4e4e7] font-semibold mb-2">1. What We Collect</h2>
          <p><strong className="text-[#d4d4d8]">Account info:</strong> Email address and password when you sign up. We do not store passwords directly — authentication is handled by Supabase.</p>
          <p className="mt-2"><strong className="text-[#d4d4d8]">Profile info:</strong> Zip code, city, state, repair profile preferences, and sell channel — provided during onboarding.</p>
          <p className="mt-2"><strong className="text-[#d4d4d8]">Usage data:</strong> URLs you analyze, analysis results, vehicles you watch/track, and timestamps. Used to provide the service and improve accuracy.</p>
          <p className="mt-2"><strong className="text-[#d4d4d8]">Payment info:</strong> Processed by Stripe. We do not store credit card numbers.</p>
          <p className="mt-2"><strong className="text-[#d4d4d8]">Anonymous visitors:</strong> A fingerprint cookie is used to enforce free-tier limits. No personal information is collected from anonymous users.</p>
        </section>

        <section>
          <h2 className="text-[#e4e4e7] font-semibold mb-2">2. How We Use It</h2>
          <p>Your data is used to: provide vehicle analyses, calculate shipping/fees based on your location, enforce usage limits, process payments, improve our AI accuracy over time, and communicate service updates.</p>
        </section>

        <section>
          <h2 className="text-[#e4e4e7] font-semibold mb-2">3. What We Don't Do</h2>
          <p>We don't sell your personal information. We don't share your data with advertisers. We don't send marketing emails unless you opt in. We don't track you across other websites.</p>
        </section>

        <section>
          <h2 className="text-[#e4e4e7] font-semibold mb-2">4. Third-Party Services</h2>
          <p>We use the following third-party services that may process your data:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-[#71717a]">
            <li>Supabase — authentication and database hosting</li>
            <li>Stripe — payment processing</li>
            <li>Vercel — application hosting</li>
            <li>Anthropic (Claude) — AI analysis processing</li>
          </ul>
          <p className="mt-2">Vehicle photos from auction listings are sent to Anthropic's API for damage analysis. These photos are from public auction listings, not user-uploaded content.</p>
        </section>

        <section>
          <h2 className="text-[#e4e4e7] font-semibold mb-2">5. Data Retention</h2>
          <p>Analysis results are cached for up to 24 hours for performance. Your account data and flip tracking history are retained as long as your account is active. You may request deletion of your account and associated data at any time by emailing us.</p>
        </section>

        <section>
          <h2 className="text-[#e4e4e7] font-semibold mb-2">6. Cookies</h2>
          <p>We use essential cookies for authentication and a fingerprint cookie for anonymous rate limiting. No third-party tracking cookies are used.</p>
        </section>

        <section>
          <h2 className="text-[#e4e4e7] font-semibold mb-2">7. Your Rights</h2>
          <p>You can: access your data through the app, update your profile information, delete your account, and request a copy of your data. Email hello@senditscan.com for any data requests.</p>
        </section>

        <section>
          <h2 className="text-[#e4e4e7] font-semibold mb-2">8. Changes</h2>
          <p>We may update this policy as our service evolves. Material changes will be communicated via email to registered users.</p>
        </section>

        <section>
          <h2 className="text-[#e4e4e7] font-semibold mb-2">9. Contact</h2>
          <p>Privacy questions? Email us at hello@senditscan.com</p>
        </section>
      </div>
    </div>
  );
}
