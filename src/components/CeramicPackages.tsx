import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const packages = [
  {
    name: "Quick Coat",
    protection: "1+ Year Protection",
    tagline: "For those who prioritize protection",
    price: "$450",
    popular: false,
    maintenance: null,
    features: [
      "Full exterior detail",
      "Minor clay treatment",
      "Paint decontamination",
      "1+ year ceramic coating",
    ],
  },
  {
    name: "Premium Coat",
    protection: "3 Year Protection",
    tagline: "Protection and enhanced gloss",
    price: "$1,100",
    popular: false,
    maintenance: "Includes 3 Months of Maintenance",
    features: [
      "Full exterior detail",
      "Deep clay treatment",
      "Paint decontamination",
      "Paint enhancement",
      "3 year ceramic coating",
    ],
  },
  {
    name: "Elite Coat",
    protection: "5 Year Protection",
    tagline: "Protection, defect removal & gloss",
    price: "$1,300",
    popular: true,
    maintenance: "Includes Annual Maintenance",
    features: [
      "Full exterior detail",
      "Deep clay treatment",
      "Paint decontamination",
      "2-step paint correction",
      "5 year ceramic coating",
    ],
  },
  {
    name: "Signature Coat",
    protection: "7 Year Protection",
    tagline: "Top-tier protection with showroom finish",
    price: "$2,100",
    popular: false,
    maintenance: null,
    features: [
      "Full exterior detail",
      "Deep clay treatment",
      "Paint decontamination",
      "Flawless paint correction",
      "7 year ceramic coating",
    ],
  },
];

const CeramicPackages = () => {
  return (
    <section id="ceramic" className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Long-Lasting Protection</p>
          <h2 className="text-3xl md:text-5xl font-bold">Ceramic Coating Packages</h2>
          <p className="text-muted-foreground mt-3 font-body max-w-lg mx-auto">
            Premium ceramic coatings for unmatched protection and brilliant shine
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`card-glow relative rounded-xl border p-6 flex flex-col ${
                pkg.popular ? "border-primary/50 bg-card" : "border-border/50 bg-card/50"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
              <p className="text-primary text-sm font-semibold mb-1">{pkg.protection}</p>
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

              {pkg.maintenance && (
                <p className="text-xs text-primary font-medium mb-4 text-center">{pkg.maintenance}</p>
              )}

              <Button variant={pkg.popular ? "default" : "outline"} className="w-full py-5" asChild>
                <a href="#estimate">Book Now</a>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CeramicPackages;
