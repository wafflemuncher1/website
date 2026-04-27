import StickyHeader from "@/components/StickyHeader";
import Footer from "@/components/Footer";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-xl font-bold mb-3 text-foreground">{title}</h2>
    <div className="text-muted-foreground font-body leading-relaxed space-y-3">{children}</div>
  </div>
);

const PrivacyPolicy = () => {
  const lastUpdated = "April 27, 2026";

  return (
    <div className="min-h-screen">
      <StickyHeader />

      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <div className="mb-12">
            <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Legal</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <Section title="1. Introduction">
            <p>
              Glossworks Mobile Detailing ("Glossworks," "we," "us," or "our") operates the website
              glossworksky.com and provides mobile detailing services in the Louisville, Kentucky
              area. This Privacy Policy explains how we collect, use, store, and protect your
              personal information when you visit our website or request our services.
            </p>
            <p>
              By submitting an estimate request, booking a service, or contacting us through any
              channel on this site, you agree to the practices described in this policy.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following categories of personal information when you use our website:</p>
            <p><strong className="text-foreground">Contact Information:</strong> Your name, email address, and phone number, provided when you submit an estimate request or contact form.</p>
            <p><strong className="text-foreground">Vehicle Information:</strong> Vehicle make, model, size, and condition as described by you when requesting a service.</p>
            <p><strong className="text-foreground">Service Address:</strong> The location where you would like service to be performed.</p>
            <p><strong className="text-foreground">Service Preferences:</strong> Selected service packages, add-ons, and any notes you provide about your vehicle or appointment.</p>
            <p><strong className="text-foreground">Consent Records:</strong> Records of your agreement to our service terms and any consent you provide for communications.</p>
            <p><strong className="text-foreground">Usage Data:</strong> General technical information such as browser type, device type, and pages visited, collected automatically when you use our website.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect for the following purposes:</p>
            <p>• To process your estimate request and schedule your detailing appointment.</p>
            <p>• To communicate with you about your booking, including confirmations, updates, and arrival notifications.</p>
            <p>• To send SMS text messages via Twilio regarding your appointment (see Section 4 below).</p>
            <p>• To send email communications related to your service.</p>
            <p>• To respond to inquiries and provide customer support.</p>
            <p>• To maintain records of services provided and associated consents.</p>
            <p>• To improve our website and service offerings.</p>
          </Section>

          <Section title="4. SMS Text Messaging (Twilio)">
            <p>
              Glossworks Mobile Detailing uses Twilio, a third-party SMS messaging platform, to
              send you text messages related to your service. By providing your phone number and
              submitting an estimate request, you expressly consent to receive SMS messages from us,
              including:
            </p>
            <p>• <strong className="text-foreground">Booking Confirmations:</strong> An automatic confirmation message when your estimate request is received.</p>
            <p>• <strong className="text-foreground">On My Way Notifications:</strong> A message sent manually by our team when a technician is en route to your location, including an estimated arrival time.</p>
            <p>
              <strong className="text-foreground">Message Frequency:</strong> Message frequency varies
              based on your service activity. You may receive up to 2 messages per appointment.
            </p>
            <p>
              <strong className="text-foreground">Opting Out:</strong> You may opt out of SMS
              communications at any time by replying <strong className="text-foreground">STOP</strong> to
              any message you receive from us. After opting out, you will receive a single
              confirmation message and no further texts. You may re-subscribe at any time by
              replying <strong className="text-foreground">START</strong>.
            </p>
            <p>
              <strong className="text-foreground">Help:</strong> For assistance, reply{" "}
              <strong className="text-foreground">HELP</strong> to any message or contact us
              at{" "}
              <a href="mailto:contact@glossworksky.com" className="text-primary hover:underline">
                contact@glossworksky.com
              </a>
              .
            </p>
            <p>
              <strong className="text-foreground">Message and Data Rates:</strong> Standard message
              and data rates may apply depending on your mobile carrier and plan. Glossworks is not
              responsible for any charges incurred by your carrier.
            </p>
            <p>
              Your phone number is shared with Twilio solely for the purpose of sending these
              messages. Twilio's privacy policy is available at{" "}
              <a
                href="https://www.twilio.com/en-us/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                twilio.com/en-us/legal/privacy
              </a>
              .
            </p>
          </Section>

          <Section title="5. Email Communications">
            <p>
              We may use the email address you provide to send transactional communications related
              to your booking or service. We do not send unsolicited marketing emails. If you
              contact us by email, we may retain that correspondence to assist with future inquiries.
            </p>
            <p>
              You may request removal of your email from our records at any time by contacting us
              at{" "}
              <a href="mailto:contact@glossworksky.com" className="text-primary hover:underline">
                contact@glossworksky.com
              </a>
              .
            </p>
          </Section>

          <Section title="6. Data Storage and Security">
            <p>
              Your personal information is stored securely using Supabase, a cloud database
              platform with enterprise-grade security, including encryption at rest and in transit.
              Our website is hosted on Vercel, a secure cloud hosting provider.
            </p>
            <p>
              We take reasonable technical and organizational measures to protect your information
              from unauthorized access, disclosure, alteration, or destruction. However, no method
              of transmission over the internet or electronic storage is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </Section>

          <Section title="7. Third-Party Services">
            <p>We use the following third-party services that may process your data:</p>
            <p>
              <strong className="text-foreground">Twilio</strong> — SMS messaging platform used to
              deliver appointment-related text messages. Privacy policy:{" "}
              <a href="https://www.twilio.com/en-us/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">twilio.com</a>
            </p>
            <p>
              <strong className="text-foreground">Supabase</strong> — Cloud database and backend
              infrastructure used to store booking and customer data. Privacy policy:{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com/privacy</a>
            </p>
            <p>
              <strong className="text-foreground">Vercel</strong> — Website hosting and deployment
              platform. Privacy policy:{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vercel.com/legal/privacy-policy</a>
            </p>
            <p>
              We do not sell, rent, or trade your personal information to third parties for
              marketing purposes. We only share your data with third parties as described in this
              policy or as required by law.
            </p>
          </Section>

          <Section title="8. Data Retention">
            <p>
              We retain your personal information for as long as necessary to provide our services,
              maintain business records, and comply with applicable legal obligations. Booking
              records are typically retained for up to 3 years for business and tax purposes.
            </p>
            <p>
              If you would like your information deleted, please contact us at{" "}
              <a href="mailto:contact@glossworksky.com" className="text-primary hover:underline">
                contact@glossworksky.com
              </a>{" "}
              and we will process your request within a reasonable time, subject to any legal
              retention requirements.
            </p>
          </Section>

          <Section title="9. Your Rights">
            <p>Depending on applicable law, you may have the right to:</p>
            <p>• <strong className="text-foreground">Access</strong> the personal information we hold about you.</p>
            <p>• <strong className="text-foreground">Correct</strong> inaccurate or incomplete information.</p>
            <p>• <strong className="text-foreground">Delete</strong> your personal information, subject to legal retention requirements.</p>
            <p>• <strong className="text-foreground">Opt out</strong> of SMS communications at any time by replying STOP.</p>
            <p>• <strong className="text-foreground">Withdraw consent</strong> for data processing, where processing is based on consent.</p>
            <p>
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:contact@glossworksky.com" className="text-primary hover:underline">
                contact@glossworksky.com
              </a>{" "}
              or by phone at{" "}
              <a href="tel:5026120430" className="text-primary hover:underline">
                (502) 612-0430
              </a>
              .
            </p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>
              Our services are not directed to individuals under the age of 18. We do not knowingly
              collect personal information from children. If you believe we have inadvertently
              collected information from a minor, please contact us immediately and we will take
              steps to delete that information.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices or applicable law. When we make material changes, we will update the "Last
              updated" date at the top of this page. Your continued use of our website or services
              after any update constitutes your acceptance of the revised policy.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or
              your personal data, please contact us:
            </p>
            <p>
              <strong className="text-foreground">Glossworks Mobile Detailing</strong>
              <br />
              Louisville, Kentucky
              <br />
              Email:{" "}
              <a href="mailto:contact@glossworksky.com" className="text-primary hover:underline">
                contact@glossworksky.com
              </a>
              <br />
              Phone:{" "}
              <a href="tel:5026120430" className="text-primary hover:underline">
                (502) 612-0430
              </a>
            </p>
          </Section>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
