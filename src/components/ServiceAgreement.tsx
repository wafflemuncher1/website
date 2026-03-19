import { motion } from "framer-motion";
import { FileText, Droplets, CloudRain, Package } from "lucide-react";

const policies = [
  { icon: Package, title: "Personal Items", text: "Please remove all personal belongings from the vehicle before your appointment. Glossworks is not responsible for items left inside." },
  { icon: Droplets, title: "Water & Electric Access", text: "We require access to a standard outdoor water spigot and a 110V electrical outlet within 50 feet of the vehicle." },
  { icon: CloudRain, title: "Weather Rescheduling", text: "If rain or severe weather is forecasted, we'll contact you to reschedule at the next available date — no charge." },
  { icon: FileText, title: "Cancellation Policy", text: "We ask for 24 hours notice for cancellations. Same-day cancellations may incur a $50 service fee." },
];

const ServiceAgreement = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Policies</p>
          <h2 className="text-3xl md:text-5xl font-bold">Service Agreement</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {policies.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-6"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">{p.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceAgreement;
