import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const packages = [
  {
    name: "The Maintenance",
    tagline: "Express Wash & Protect",
    price: "$149",
    priceNote: "Starting at",
    popular: false,
    features: [
      "Exterior hand wash & dry",
      "Wheel & tire cleaning",
      "Interior vacuum & wipe-down",
      "UV protectant applied",
      "Glass cleaning inside & out",
    ],
  },
  {
    name: "The Signature Detail",
    tagline: "Full Interior & Exterior Deep Clean",
    price: "$349",
    priceNote: "Starting at",
    popular: true,
    features: [
      "Everything in Maintenance",
      "Clay bar decontamination",
      "One-step paint polish",
      "Leather conditioning",
      "Engine bay cleaning",
      "6-month sealant protection",
    ],
  },
  {
    name: "The Showroom Prep",
    tagline: "Paint Correction + Ceramic Coating",
    price: "$899",
    priceNote: "Starting at",
    popular: false,
    features: [
      "Everything in Signature",
      "Multi-step paint correction",
      "Ceramic coating (2-year)",
      "Trim & plastic restoration",
      "Headlight restoration",
      "Interior ceramic coating",
      "Premium Koch Chemie products",
    ],
  },
];

export default function PackagesSection() {
  return (
    <section id="packages" className="py-24 md:py-32 bg-black text-white">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-blue-500 text-sm tracking-[0.3em] uppercase mb-3">
            Packages
          </p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
            Choose Your Level
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative rounded-2xl border p-8 flex flex-col gap-4 ${
                pkg.popular
                  ? "border-blue-600 bg-zinc-900"
                  : "border-zinc-800 bg-black"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </div>
              )}

              <p className="text-zinc-400 text-sm tracking-wider uppercase">
                {pkg.tagline}
              </p>
              <h3 className="text-2xl font-bold">{pkg.name}</h3>

              <div>
                <span className="text-xs text-zinc-400">{pkg.priceNote}</span>
                <p className="text-4xl font-black text-blue-500">{pkg.price}</p>
              </div>

              <ul className="space-y-3 mt-2 flex-1">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#booking"
                className={`mt-4 w-full py-3 rounded-lg font-bold text-center transition ${
                  pkg.popular
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                }`}
              >
                Select Package
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}