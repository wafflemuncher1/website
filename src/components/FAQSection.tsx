import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "How long does a full detail take?", a: "A full interior and exterior detail typically takes 2–4 hours depending on vehicle size and condition." },
  { q: "Do you come to me?", a: "Absolutely. We're a fully mobile operation. We come to your home, office, or anywhere with water and electric access in our service areas." },
  { q: "What if it rains on my appointment day?", a: "We monitor the forecast closely. If rain is expected, we'll reach out to reschedule at the next available date" },
  { q: "What products do you use?", a: "We exclusively use High quality porducts such as Koch Chemie — German-engineered, professional-grade detailing chemicals trusted by the world's top detailers." },
  { q: "How often should I get my car detailed?", a: "We recommend a maintenance wash every 2–4 weeks and a full detail every 3–6 months. Waxed and sealant vehicles can go longer between details." },
  { q: "Do you offer Wax and sealants?", a: "Yes! We're factory-trained waxing and sealant applicators. Our coatings can provide anywhere from 4 weeks to 9 months of protection with proper maintenance." },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">FAQ</p>
          <h2 className="text-3xl md:text-5xl font-bold">Common Questions</h2>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border/50 bg-card/50 px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground font-body leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
