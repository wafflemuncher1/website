import { motion } from "framer-motion";
import { XCircle, CheckCircle } from "lucide-react";

const tunnelItems = [
  "Abrasive spinning brushes cause micro-scratches",
  "Harsh, acidic soap strips wax & sealant",
  "Missed spots — mirrors, jambs, wheels",
  "No interior attention whatsoever",
  "Takes 3 minutes — you get what you pay for",
];

const glossworksItems = [
  "Two-bucket hand wash method prevents swirls",
  "pH-neutral Koch Chemie shampoo preserves paint",
  "Paint-safe microfiber towels on every surface",
  "Deep interior decontamination & conditioning",
  "2–4 hours of meticulous, professional care",
];

const WashComparison = () => {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Education</p>
          <h2 className="text-3xl md:text-5xl font-bold">Car Wash vs. Full Detail</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Tunnel Wash */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-destructive/30 bg-card/50 p-8"
          >
            <h3 className="text-xl font-bold mb-1">The $20 Tunnel Wash</h3>
            <p className="text-xs text-muted-foreground mb-6 font-body">What you're really paying for</p>
            <ul className="space-y-4">
              {tunnelItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-secondary-foreground font-body">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Glossworks */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-primary/30 bg-card/50 p-8"
          >
            <h3 className="text-xl font-bold mb-1">The Glossworks Standard</h3>
            <p className="text-xs text-muted-foreground mb-6 font-body">The professional difference</p>
            <ul className="space-y-4">
              {glossworksItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-secondary-foreground font-body">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WashComparison;
