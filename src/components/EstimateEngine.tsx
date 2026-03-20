import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Layers, ThermometerSun, ArrowRight, ArrowLeft, Calculator, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const steps = [
  { label: "Vehicle", icon: Car },
  { label: "Service", icon: Layers },
  { label: "Add Ons", icon: ThermometerSun },
  { label: "Quote", icon: Calculator },
];

// FLAT upcharges by vehicle size (edit these numbers to match your pricing)
const vehicleSizes = [
  { label: "Small", desc: "Coupe, Sedan", upcharge: 0 },
  { label: "Medium", desc: "Crossover, Wagon", upcharge: 15 },
  { label: "Large", desc: "SUV, Minivan", upcharge: 30 },
  { label: "XL", desc: "Full-size Truck, Suburban", upcharge: 50 },
];

// Base package prices
const serviceCategories = [
  { label: "Back to Basics", base: 125 },
  { label: "The Signature Detail", base: 165 },
  { label: "The Luxury", base: 240 },
];

// Multi-select add-ons (edit prices here)
const addOns = [
  { key: "engine", label: "Engine Bay Detail", desc: "Deep clean & dressing for your engine compartment", price: 85 },
  { key: "petHair", label: "Pet Hair Removal", desc: "Thorough extraction from seats, carpets & crevices", price: 40 },
  { key: "headlights", label: "Headlight Restoration", desc: "UV-damaged lenses restored to crystal clarity", price: 90 },
];

const EstimateEngine = () => {
  const [step, setStep] = useState(0);
  const [vehicle, setVehicle] = useState<number | null>(null);
  const [service, setService] = useState<number | null>(null);

  // multi-select add-ons: store indexes from addOns[]
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);

  const [showContact, setShowContact] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });

  // Add-ons step is optional, so we allow Next even with nothing selected on step 2.
  const canNext = (step === 0 && vehicle !== null) || (step === 1 && service !== null) || step === 2;

  const toggleAddOn = (idx: number) => {
    setSelectedAddOns((prev) => (prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]));
  };

  const getTotal = () => {
    if (vehicle === null || service === null) return 0;

    const base = serviceCategories[service].base;
    const sizeUpcharge = vehicleSizes[vehicle].upcharge;
    const addOnsTotal = selectedAddOns.reduce((sum, idx) => sum + addOns[idx].price, 0);

    return base + sizeUpcharge + addOnsTotal;
  };

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  if (submitted) {
    return (
      <section id="estimate" className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center rounded-xl border border-primary/30 bg-card p-12"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Quote Request Sent</h3>
            <p className="text-muted-foreground font-body">
              We'll reach out within 24 hours with your final quote. Thank you for choosing Glossworks.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  const total = getTotal();

  const basePrice = service !== null ? serviceCategories[service].base : 0;
  const sizeUpcharge = vehicle !== null ? vehicleSizes[vehicle].upcharge : 0;
  const addOnsTotal = selectedAddOns.reduce((sum, idx) => sum + addOns[idx].price, 0);

  return (
    <section id="estimate" className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Estimate</p>
          <h2 className="text-3xl md:text-5xl font-bold">Instant Estimate Engine</h2>
          <p className="text-muted-foreground mt-3 font-body max-w-md mx-auto">
            Get your ballpark investment in seconds — no commitment required - prices may vary.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-10">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="hidden sm:block text-xs font-medium text-muted-foreground">{s.label}</span>
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block w-12 lg:w-20 h-px mx-2 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="rounded-xl border border-border/50 bg-card p-8 min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {step === 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6">What's Your Vehicle Size?</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {vehicleSizes.map((v, i) => (
                        <button
                          key={v.label}
                          onClick={() => setVehicle(i)}
                          className={`rounded-lg border p-4 text-left transition-all ${
                            vehicle === i
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <span className="text-sm font-semibold block">{v.label}</span>
                          <span className="text-xs text-muted-foreground block">{v.desc}</span>
                          <span className="text-xs mt-2 block">
                            {v.upcharge === 0 ? "No size upcharge" : `+ $${v.upcharge} size upcharge`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6">Service Category</h3>
                    <div className="space-y-3">
                      {serviceCategories.map((s, i) => (
                        <button
                          key={s.label}
                          onClick={() => setService(i)}
                          className={`w-full text-left rounded-lg border p-4 text-sm font-medium transition-all ${
                            service === i
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{s.label}</span>
                            <span className="font-semibold">${s.base}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Add Ons (optional)</h3>
                    <p className="text-xs text-muted-foreground mb-6">Select as many as you want. We’ll total everything up.</p>

                    <div className="space-y-3">
                      {addOns.map((a, i) => {
                        const active = selectedAddOns.includes(i);

                        return (
                          <button
                            key={a.key}
                            onClick={() => toggleAddOn(i)}
                            className={`w-full text-left rounded-lg border p-4 transition-all ${
                              active
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <span className="text-sm font-semibold block">{a.label}</span>
                                <span className="text-xs text-muted-foreground">{a.desc}</span>
                              </div>
                              <div className="text-sm font-semibold whitespace-nowrap">${a.price}</div>
                            </div>
                            <div className="text-xs mt-2">{active ? "Selected" : "Click to add"}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Your Estimated Investment</h3>

                    <p className="text-5xl md:text-6xl font-bold text-primary my-6">${total}</p>

                    {/* Breakdown */}
                    <div className="max-w-sm mx-auto text-left rounded-lg border border-border/50 bg-secondary/30 p-4 mb-8">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Package</span>
                        <span className="font-medium">${basePrice}</span>
                      </div>

                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Vehicle size upcharge</span>
                        <span className="font-medium">${sizeUpcharge}</span>
                      </div>

                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Add-ons total</span>
                        <span className="font-medium">${addOnsTotal}</span>
                      </div>

                      {selectedAddOns.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Selected add-ons:</p>
                          <ul className="text-xs space-y-1">
                            {selectedAddOns.map((idx) => (
                              <li key={addOns[idx].key} className="flex justify-between gap-4">
                                <span>{addOns[idx].label}</span>
                                <span className="font-medium">${addOns[idx].price}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-between text-sm mt-4 pt-3 border-t border-border/50">
                        <span className="font-semibold">Total</span>
                        <span className="font-semibold">${total}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground font-body mb-8 max-w-sm mx-auto">
                      {vehicle !== null ? vehicleSizes[vehicle].label : ""} · {service !== null ? serviceCategories[service].label : ""}{" "}
                      {selectedAddOns.length > 0 ? `· ${selectedAddOns.length} add-on(s)` : "· No add-ons"}
                    </p>

                    {!showContact ? (
                      <Button onClick={() => setShowContact(true)} size="lg" className="px-8">
                        Get a Final Quote <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 max-w-sm mx-auto text-left"
                      >
                        <Input
                          placeholder="Full Name"
                          value={contact.name}
                          onChange={(e) => setContact({ ...contact, name: e.target.value })}
                          className="bg-secondary/50 border-border/50"
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={contact.email}
                          onChange={(e) => setContact({ ...contact, email: e.target.value })}
                          className="bg-secondary/50 border-border/50"
                        />
                        <Input
                          placeholder="Phone (optional)"
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                          className="bg-secondary/50 border-border/50"
                        />
                        <Button onClick={() => setSubmitted(true)} disabled={!contact.name || !contact.email} className="w-full">
                          Submit Quote Request <Send className="ml-2 h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowContact(false);
                setStep(step - 1);
              }}
              disabled={step === 0}
              className="border-border/50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < 3 && (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EstimateEngine;