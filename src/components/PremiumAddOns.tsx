import { motion } from "framer-motion";
import { Lightbulb, Cog, PawPrint, Wind, Droplets, CircleDot, ShieldCheck, Wrench } from "lucide-react";

const addOns = [
  { icon: Lightbulb, name: "Headlight Restoration", desc: "Crystal clear visibility restored", price: "$90" },
  { icon: Cog, name: "Engine Bay Cleaning", desc: "Pristine engine compartment", price: "$85" },
  { icon: PawPrint, name: "Pet Hair Removal", desc: "Thorough fur extraction", price: "$40" },
  { icon: Wind, name: "Odor Removal", desc: "Eliminate unwanted smells", price: "$110/hr" },
  { icon: Droplets, name: "Windshield Coating", desc: "Rain-repelling protection", price: "$100" },
  { icon: CircleDot, name: "Wheel Ceramic Coating", desc: "Durable wheel protection", price: "$120/wheel" },
  { icon: ShieldCheck, name: "Interior Coating", desc: "Repels stains & prevents UV damage", price: "$150" },
  { icon: Wrench, name: "Touch Up Service", desc: "Fix rock chips & deep scratches", price: "From $50" },
];

const PremiumAddOns = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Premium Add-Ons</p>
          <h2 className="text-3xl md:text-5xl font-bold">Enhance Your Detail</h2>
          <p className="text-muted-foreground mt-3 font-body max-w-md mx-auto">
            Customize your service with our specialized treatments
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {addOns.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="card-glow rounded-xl border border-border/50 bg-card/50 p-5 text-center"
            >
              <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
              <p className="text-xs text-muted-foreground font-body mb-2">{item.desc}</p>
              <p className="text-primary font-bold text-sm">{item.price}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumAddOns;
