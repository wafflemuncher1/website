import { motion } from "framer-motion";
import { Cog, PawPrint, Lightbulb, Sparkles, Wind } from "lucide-react";

const addOns = [
  { icon: Cog, name: "Engine Bay Detail $85 ", desc: "Deep clean & dressing for your engine compartment." },
  { icon: PawPrint, name: "Pet Hair Removal $40 ", desc: "Thorough extraction from seats, carpets & crevices." },
  { icon: Lightbulb, name: "Headlight Restoration $90 ", desc: "UV-damaged lenses restored to crystal clarity." },
  { icon: Sparkles, name: "Clay Bar & Wax 20$ ", desc: "Surface decontamination plus protective carnauba wax." },

];

const AddOnBoutique = () => {
  return (
    <section id="addons" className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Extras</p>
          <h2 className="text-3xl md:text-5xl font-bold">Service Boosters</h2>
          <p className="text-muted-foreground mt-3 font-body max-w-md mx-auto">
            Enhance any package with premium add-on services.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {addOns.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-glow flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-6"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AddOnBoutique;
