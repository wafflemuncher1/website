import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
    label: "Current Packages",
    packages: [
      {
        name: "The Baseline",
        tagline: "Express Exterior Wash & Gloss",
        price: "$75",
        interior: [],
        exterior: [ "Multi-Stage Prep: pH-neutral foam bath to safely lift surface grit.",
      "Wheels: Deep barrel cleaning & tire scrub.",
      "De-Greasing: Intensive bug removal and cleaning of fuel doors and door jambs.",
      "Protection: Finished with Bead Maker for signature slickness and high gloss.",
      "Tire Finish: Premium tire dressing applied.",],
      },

      {
        name: "The Signature Detail",
        badge: "Most Popular",
        badgeVariant: "popular",
        tagline: "High-Performance Interior & Exterior Deep Clean",
        price: "$130",
        interior: [
    "High-Power Deep Vacuum: Complete debris removal from cabin, trunk, and tight crevices.",
    "Full Interior Sanitization & Wipe Down",
    "UV Surface Armor (Prevents Fading & Cracking)",
    "Intricate Detail (Cup Holders, Vents, & Crevices)",
    "Streak-Free Glass & Mirror Restoration",
    "Deep-Clean Floor Mats (Rubber and Carpet)",
    "Hand-Cleaned Door Jambs & Thresholds",
  ],
  
  exterior: [
    "Full Baseline Process: Includes everything in the $75 package.",
    "German-Engineered pH-Neutral Foam Bath",
    "Premium High-Gloss Tire Dressing",
    "Glass Clarity: Streak-free restoration of all interior and exterior glass and mirrors.",
    "Fuel Door & Trim De-Greasing",
  ],
      },
      {
        name: "",
        badge: "",
        tagline: "",
        price: "$",
        interior: [
    "Coming Soon",
  ],
  
  exterior: [
    "",
  ],
      },
    ],
  },
  exterior: {
    label: "Exterior Only",
    packages: [
      {
        name: "",
        badge: "VIP",
        badgeVariant: "vip",
        tagline: "",
        price: "$",
        interior: ["Coming Soon"],
        exterior: [
          "",
        ],
      },
       {
        name: "",
        badge: "VIP",
        badgeVariant: "vip",
        tagline: "",
        price: "$",
        interior: ["Coming Soon"],
        exterior: [
          "",
        ],
      },
      {
        name: "",
        badge: "VIP",
        badgeVariant: "vip",
        tagline: "",
        price: "$",
        interior: ["Coming Soon"],
        exterior: [
          "",
        ],
      },
    ],
  },
  interior: {
    label: "",
    packages: [
      {
        name: "",
        tagline: "",
        price: "$",
        interior: ["Coming Soon"],
        exterior: [],
      },
      {
        name: "",
        badge: "Most Popular",
        badgeVariant: "popular",
        tagline: "",
        price: "$",
        interior: [
          "Coming Soon",
        ],
        exterior: [],
      },
      {
        name: "",
        badge: "VIP",
        badgeVariant: "vip",
        tagline: "",
        price: "$",
        interior: [
          "Coming Soon",
        ],
        exterior: [],
      },
    ],
  },
};

const categories: { key: ServiceCategory; label: string }[] = [
  { key: "full", label: "Packages" },
  { key: "exterior", label: "Not avalible" },
  { key: "interior", label: "Not avalible" },
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
          <p className="text-muted-foreground text-sm font-body">Swirl & Scratch Prevention</p>
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
  <Link to="/estimate">
    Get Estimate <ArrowRight className="ml-2 h-4 w-4" />
  </Link>
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