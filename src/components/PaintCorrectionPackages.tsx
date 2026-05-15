import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const packages = [
  {
    name: "Basic Package",
    tagline: "Glossy & smooth finish restoration",
    price: "$500",
    features: ["Exterior detail", "Paint decontamination", "1-step gloss enhancement"],
  },
  {
    name: "Standard Package",
    tagline: "High gloss with 30-50% defect reduction",
    price: "$650",
    features: ["Exterior detail", "Paint decontamination", "1-step paint correction", "Wax protection"],
  },
  {
    name: "Premium Package",
    tagline: "Insane gloss with 80-99% defect reduction",
    price: "$850",
    features: ["Exterior detail", "Paint decontamination", "2-step paint correction", "Wax protection"],
  },
  {
    name: "Elite Package",
    tagline: "Extreme gloss with 90-99% defect removal",
    price: "$1,400",
    features: ["Exterior detail", "Paint decontamination", "3-step paint correction", "Ceramic sealant"],
  },
  {
    name: "Signature Package",
    tagline: "Showroom finish, better than factory",
    price: "$2,500",
    features: [
      "Exterior detail",
      "Paint decontamination",
      "4-step paint correction",
      "Orange peel reduction",
      "Ceramic sealant",
    ],
  },
];

const PaintCorrectionPackages = () => {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Restore Your Finish</p>
          <h2 className="text-3xl md:text-5xl font-bold">Paint Correction Packages</h2>
          <p className="text-muted-foreground mt-3 font-body max-w-lg mx-auto">
            Remove swirls, scratches, and defects for a flawless finish
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 max-w-7xl mx-auto">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-glow relative rounded-xl border border-border/50 bg-card/50 p-6 flex flex-col"
            >
              <h3 className="text-lg font-bold mb-1">{pkg.name}</h3>
              <p className="text-xs text-muted-foreground mb-4 font-body">{pkg.tagline}</p>

              <div className="mb-5">
                <p className="text-3xl font-bold">{pkg.price}</p>
                <span className="text-xs text-muted-foreground">starting</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-secondary-foreground font-body">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full py-5" asChild>
                <a href="#estimate">Book Now</a>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PaintCorrectionPackages;