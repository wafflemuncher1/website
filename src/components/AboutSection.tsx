import { motion } from "framer-motion";
import { Award, Heart } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">About</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">The Vision Behind Glossworks</h2>
            <p className="text-secondary-foreground font-body leading-relaxed mb-4">
              Most people see a car wash as a chore.
               At Glossworks, we see it as a technical restoration.
               Born in Louisville from a passion for automotive engineering,
               we don't just "clean" cars—we perform a surgical decontamination of every surface.
            </p>
            <p className="text-secondary-foreground font-body leading-relaxed">
              As an ASE-certified technician, I approach your vehicle with a diagnostic eye.
              I don't hide dirt under cheap waxes; I use German-engineered chemistry and
              pH-balanced techniques to restore your vehicle’s factory-matte finish and crystal clarity.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-6">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">ASE Certified</h3>
                <p className="text-xs text-muted-foreground font-body">Industry-recognized certification ensuring professional-grade results on every vehicle.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-6">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Passion-Driven</h3>
                <p className="text-xs text-muted-foreground font-body">Every job gets 100% — because we genuinely love making vehicles look their absolute best.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
