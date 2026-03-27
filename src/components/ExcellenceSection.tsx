import { motion } from "framer-motion";
import { Award, FlaskConical, ShieldCheck, Droplets } from "lucide-react";

const items = [
  {
    icon: Award,
    title: "Instant Digital Quotes",
    desc: "Our proprietary estimate engine provides immediate, transparent pricing—no phone calls or waiting required.",
  },
  {
    icon: FlaskConical,
    title: "Zero-Friction Booking",
    desc: "Automated SMS and email confirmations ensure your appointment is locked in the second you hit submit.",
  },
  {
    icon: ShieldCheck,
    title: "ASE Certified Mastery",
    desc: "Unlike standard detailers, our founder is a fully ASE-certified technician, bringing expert mechanical knowledge to every surface.",
  },
  {
    icon: Droplets,
    title: "Precision Work Ethic",
    desc: "Built on eight years of high-intensity service labor, bringing a first-light to sunset discipline to every job.",
  },
];

const ExcellenceSection = () => {
  return (
    <section id="excellence" className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Why Glossworks</p>
          <h2 className="text-3xl md:text-5xl font-bold">Technical Excellence</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-glow rounded-xl border border-border/50 bg-card/50 p-6 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExcellenceSection;
