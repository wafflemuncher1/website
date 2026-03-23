import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const packages = [
  {
    name: "The Baseline",
    tagline: "Express Wash & Protect",
    price: "$110",
    priceNote: "Starting at",
    popular: false,
    features: [
      "Exterior: Multi-stage foam bath & hand wash.",
      "Wheels: Deep barrel cleaning & tire scrub.",
      "Detailing: Bug & grime removal.",
      "Protection: Finished with Bead Maker for signature slickness and high gloss.",
      "Premium tire dressing applied.",
    ],
  },
  {
    name: "The Signature Detail",
    tagline: "Full Interior & Exterior Deep Clean",
    price: "$165",
    priceNote: "Starting at",
    popular: true,
    features: [
      "Exterior: Everything in the Baseline",
      "High-Quality Spray Wax for added durability.",
      "Interior: Full vacuum,",
      "Dash/console wipe down",
      "UV protection on all plastics",
      "Streak-free glass",
      "Note: Does not include steam or extraction.",
    ],
  },
  {
    name: "The Luxury",
    tagline: "Our premium Reset service. Recommended every 6–12 months",
    price: "$240",
    priceNote: "Starting at",
    popular: false,
    features: [
      "Exterior: Multi-stage wash",
      "Heavy Sealant (6+ months of armor)",
      "Application of P&S Bead Maker for extreme slickness and water beading",
      "Interior: Full Interior Reset",
      "Includes high-temp steam cleaning of all crevices",
      "Hot Water Extraction of carpets/seats to pull out deep-set stains",
      "ASE Bonus: Includes a full ASE-Certified Engine Bay Detail to ensure your vehicle is as clean under the hood as it is on the street.",
    ],
  },
];

const PackagesSection = () => {
  return (
    <section id="packages" className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Packages</p>
          <h2 className="text-3xl md:text-5xl font-bold">Choose Your Level</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`card-glow relative rounded-xl border p-8 flex flex-col ${
                pkg.popular
                  ? "border-primary/50 bg-card"
                  : "border-border/50 bg-card/50"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </div>
              )}

              <p className="text-muted-foreground text-sm tracking-wider uppercase mb-1">{pkg.tagline}</p>
              <h3 className="text-2xl font-bold mb-4">{pkg.name}</h3>

              <div className="mb-6">
                <span className="text-xs text-muted-foreground">{pkg.priceNote}</span>
                <p className="text-4xl font-bold">{pkg.price}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-secondary-foreground font-body">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={pkg.popular ? "default" : "outline"}
                className="w-full py-5"
                asChild
              >
                <a href="#estimate">Get Estimate</a>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
