import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ServiceCategory = "full" | "exterior" | "interior";

interface Package {
  name: string;
  badge?: string;
  badgeVariant?: "popular" | "vip";
  tagline: string;

  // ✅ Pricing: edit here per package (ex: "$300" or "300$")
  price?: string;

  interior: string[];
  exterior: string[];
  image?: string;
}

const categoryData: Record<ServiceCategory, { label: string; packages: Package[] }> = {
  full: {
    label: "Full Detail",
    packages: [
      {
        name: "Refresh",
        tagline: "Our Refresh Package. Best for maintenance or quick refresh.",
        price: "$110",
        interior: [
          "Interior Vacuum",
          "Wipe all surfaces",
          "Stains (Spot Treatment)",
          "Windows & Mirrors",
          "Door Jambs",
          "Floor Mats",
          "Detail Trunk",
        ],
        exterior: ["Quick Hand Wash", "Clean Rims & Tires", "Wax Protection (3 Months)"],
      },
      {
        name: "Gold Standard",
        badge: "Most Popular",
        badgeVariant: "popular",
        tagline: "Our Standard Package. A very thorough inside-out detail.",
        price: "$160",
        interior: [
          "Double Vacuum Interior",
          "Wipe all surfaces",
          "Stains (Spot Treatment)",
          "Windows & Mirrors",
          "Clean & Protect Plastic",
          "Detail Floor Mats and Shine",
          "Detail Trunk & Door Jambs",
        ],
        exterior: [
          "Spot Polish",
          "Professional Hand Wash",
          "Detail Rims & Tires",
          "Wheel Wells",
          "Wax Protection (3 Months)",
        ],
      },
      {
        name: "Masterpiece Detail",
        badge: "VIP",
        badgeVariant: "vip",
        tagline: "Ultimate Detail Experience. Includes Full Polish & Shampoo/Extraction.",
        price: "$250",
        interior: [
          "Shampoo Seats & Carpet",
          "Double Vacuum Interior",
          "Wipe all Surfaces",
          "Stain (Spot Treatment)",
          "Clean & Protect Plastic",
          "Windows & Mirrors",
          "Detail Floor Mats and Shine",
          "Detail Trunk",
        ],
        exterior: [
          "Full Paint Enhancement Polish",
          "Professional Hand Wash",
          "Clay Bar Exterior",
          "Wash Wheel Wells",
          "Dress Trims/Tires",
          "Clean Door Jams",
          "Wax Protection (3 Months)",
        ],
      },
    ],
  },
  exterior: {
    label: "Exterior Only",
    packages: [
      {
        name: "Quick Wash",
        tagline: "Express exterior hand wash and dry with tire dressing.",
        price: "$60",
        interior: [],
        exterior: [ "Exterior: Multi-stage foam bath & hand wash.",
      "Wheels: Deep barrel cleaning & tire scrub.",
      "Detailing: Bug & grime removal.",
      "Protection: Finished with Bead Maker for signature slickness and high gloss.",
      "Premium tire dressing applied.",],
      },
      {
        name: "Exterior Detail",
        badge: "Most Popular",
        badgeVariant: "popular",
        tagline: "Full exterior decontamination with clay bar and wax protection.",
        price: "$140",
        interior: [],
        exterior: [
          "Professional Hand Wash",
          "Clay Bar Treatment",
          "Detail Rims & Tires",
          "Wheel Wells",
          "Trim Dressing",
          "Wax Protection (3 Months)",
        ],
      },
      {
        name: "Exterior Masterpiece",
        badge: "VIP",
        badgeVariant: "vip",
        tagline: "Full paint correction polish with ceramic-level wax protection.",
        price: "$220",
        interior: [],
        exterior: [
          "Full Paint Enhancement Polish",
          "Professional Hand Wash",
          "Clay Bar Exterior",
          "Wash Wheel Wells",
          "Dress Trims/Tires",
          "Door Jambs",
          "Wax Protection (3 Months)",
        ],
      },
    ],
  },
  interior: {
    label: "Interior Only",
    packages: [
      {
        name: "Quick Interior",
        tagline: "Express vacuum and wipe-down for a fresh cabin feel.",
        price: "$75",
        interior: ["Interior Vacuum", "Wipe All Surfaces", "Windows & Mirrors", "Floor Mats"],
        exterior: [],
      },
      {
        name: "Interior Detail",
        badge: "Most Popular",
        badgeVariant: "popular",
        tagline: "Thorough interior deep clean with plastic protection.",
        price: "$300",
        interior: [
          "Double Vacuum Interior",
          "Wipe All Surfaces",
          "Stains (Spot Treatment)",
          "Windows & Mirrors",
          "Clean & Protect Plastic",
          "Detail Floor Mats and Shine",
          "Detail Trunk & Door Jambs",
        ],
        exterior: [],
      },
      {
        name: "Interior Masterpiece",
        badge: "VIP",
        badgeVariant: "vip",
        tagline: "Full shampoo extraction with odor treatment and leather care.",
        price: "$200",
        interior: [
          "Shampoo Seats & Carpet",
          "Double Vacuum Interior",
          "Wipe All Surfaces",
          "Stain (Spot Treatment)",
          "Clean & Protect Plastic",
          "Leather Conditioning",
          "Windows & Mirrors",
          "Detail Floor Mats and Shine",
          "Detail Trunk",
        ],
        exterior: [],
      },
    ],
  },
};

const categories: { key: ServiceCategory; label: string }[] = [
  { key: "full", label: "Full Detail" },
  { key: "exterior", label: "Exterior Only" },
  { key: "interior", label: "Interior Only" },
];

const PackagesSection = () => {
  const [active, setActive] = useState<ServiceCategory>("full");
  const data = categoryData[active];

  return (
    <section id="packages" className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Services</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-2">View Pricing & Packages Below</h2>
          <p className="text-muted-foreground text-sm font-body">Swirl & Scratch Removal</p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 mb-12 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                active === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Package Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {data.packages.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`card-glow relative rounded-xl border flex flex-col overflow-hidden ${
                  pkg.badgeVariant === "popular"
                    ? "border-primary/50 bg-card"
                    : pkg.badgeVariant === "vip"
                    ? "border-accent/40 bg-card"
                    : "border-border/50 bg-card/50"
                }`}
              >
                {/* Badge */}
                {pkg.badge && (
                  <div
                    className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 z-10 ${
                      pkg.badgeVariant === "vip"
                        ? "bg-accent/20 text-accent"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {pkg.badgeVariant === "vip" ? (
                      <Crown className="h-3 w-3" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {pkg.badge}
                  </div>
                )}

                {/* Image Placeholder */}
                <div className="w-full h-44 bg-secondary/60 flex items-center justify-center">
                  <span className="text-muted-foreground text-xs tracking-wider uppercase">
                    {pkg.name}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>

                  <p className="text-muted-foreground text-sm font-body mb-2">{pkg.tagline}</p>

                  {/* ✅ Price AFTER tagline, BEFORE features */}
                  {pkg.price && <p className="text-2xl font-extrabold mb-6">{pkg.price}</p>}

                  {/* Interior features */}
                  {pkg.interior.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold mb-3">
                        Interior
                      </p>
                      <ul className="space-y-2">
                        {pkg.interior.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-sm text-secondary-foreground font-body"
                          >
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Exterior features */}
                  {pkg.exterior.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold mb-3">
                        Exterior
                      </p>
                      <ul className="space-y-2">
                        {pkg.exterior.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-sm text-secondary-foreground font-body"
                          >
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-auto">
                    <Button
                      variant={pkg.badgeVariant ? "default" : "outline"}
                      className="w-full py-5"
                      asChild
                    >
                      <a href="#estimate">
                        Get Estimate <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default PackagesSection;