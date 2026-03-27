import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Layers, Sparkles, ArrowRight, ArrowLeft, Calculator, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";


const steps = [
  { label: "Vehicle", icon: Car },
  { label: "Service", icon: Layers },
  { label: "Add-Ons", icon: Plus },
  { label: "Quote", icon: Calculator },
];

// FLAT upcharges by vehicle size
const vehicleSizes = [
  { label: "Small", desc: "Coupe / Sedan", upcharge: 0 },
  { label: "Medium", desc: "Small SUV / Crossover", upcharge: 15 },
  { label: "Large", desc: "Large SUV / Truck", upcharge: 25 },
  { label: "XL", desc: "XL Vehicle / Minivan", upcharge: 50 },
];

// Base package prices
const serviceCategories = [
  { label: "The Baseline", base: 110 },
  { label: "Interior Only", base: 125 },
  { label: "The Signature Detail", base: 165 },
  { label: "The Signature Transformation", base: 240 },
];

// Multi-select add-ons
const addOns = [
  { key: "trim", label: "Trim Restoration", desc: "Restoring faded exterior plastics to deep black — Price varies", price: 60 },
  { key: "engine", label: "Engine Bay Cleaning", desc: "Pristine engine compartment", price: 85 },
  { key: "pet", label: "Pet Hair Removal", desc: "Thorough fur extraction — Price varies", price: 40 },
  { key: "hardwax", label: "Hard Wax Upgrade", desc: "Hand-applied Paste Wax for that deep wet look", price: 45 },
  { key: "machinewax", label: "Machine Liquid Wax", desc: "High quality liquid wax via DA Polisher with soft finishing pad", price: 65 },
  { key: "stain", label: "Stain Removal", desc: "Price varies by stain type and fabric", price: 50 },
  { key: "iron", label: "Iron Decontamination", desc: "Chemical removal of iron particles rusting into paint", price: 35 },
  { key: "headlights", label: "Headlight Restoration", desc: "UV-damaged lenses restored to crystal clarity", price: 90 },
];

// Google Sheets submission helper — replace SHEET_ENDPOINT with your Apps Script web app URL
const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbwepoRsRMuzDTFfbVTh7xa5m7QF0xciOFY3LHkWyHAqYgpBZYD1crx8H-6l5AZLJhnb/exec";

const submitToGoogleSheets = async (data: Record<string, string>) => {
  if (!SHEET_ENDPOINT) {
    console.log("Google Sheets endpoint not configured. Payload:", data);
    return;
  }
  try {
    await fetch(SHEET_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("Failed to submit to Google Sheets:", err);
  }
};

const EstimateEngine = () => {
  const [step, setStep] = useState(0);
  const [vehicle, setVehicle] = useState<number | null>(null);
  const [service, setService] = useState<number | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);
  const [showContact, setShowContact] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });

  const canNext =
    (step === 0 && vehicle !== null) ||
    (step === 1 && service !== null) ||
    step === 2;

  const toggleAddOn = (idx: number) => {
    setSelectedAddOns((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
    );
  };

  const getTotal = () => {
    if (vehicle === null || service === null) return 0;
    const base = serviceCategories[service].base;
    const sizeUpcharge = vehicleSizes[vehicle].upcharge;
    const addOnsTotal = selectedAddOns.reduce((sum, idx) => sum + addOns[idx].price, 0);
    return base + sizeUpcharge + addOnsTotal;
  };

  const handleSubmit = () => {
    const total = getTotal();
    const payload = {
      timestamp: new Date().toISOString(),
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      vehicleSize: vehicle !== null ? vehicleSizes[vehicle].label : "",
      service: service !== null ? serviceCategories[service].label : "",
      addOns: selectedAddOns.map((idx) => addOns[idx].label).join(", ") || "None",
      total: `$${total}`,
      consent: consent ? "Yes" : "No",
    };
    submitToGoogleSheets(payload);
    setSubmitted(true);
  };

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  const total = getTotal();
  const basePrice = service !== null ? serviceCategories[service].base : 0;
  const sizeUpcharge = vehicle !== null ? vehicleSizes[vehicle].upcharge : 0;
  const addOnsTotal = selectedAddOns.reduce((sum, idx) => sum + addOns[idx].price, 0);

  if (submitted) {
    return (
      <section id="estimate" className="py-24 md:py-32 relative bg-black overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center rounded-xl border border-primary/30 bg-black p-12"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">Quote Request Sent</h3>
            <p className="text-muted-foreground font-body">
              We'll reach out within 24 hours with your final quote. Thank you for choosing Glossworks.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="estimate" className="py-24 md:py-32 relative bg-black overflow-hidden">
      
      <div className="container relative z-10 mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Estimate</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white">Instant Estimate Engine</h2>
          <p className="text-muted-foreground mt-3 font-body max-w-md mx-auto">
            Get your ballpark investment in seconds — no commitment required. Prices may vary.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-10">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i <= step ? "bg-primary text-primary-foreground" : "bg-neutral-800 text-muted-foreground"
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="hidden sm:block text-xs font-medium text-muted-foreground">{s.label}</span>
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block w-12 lg:w-20 h-px mx-2 ${i < step ? "bg-primary" : "bg-neutral-700"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-8 min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                {/* Step 0: Vehicle Size */}
                {step === 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-white">What's Your Vehicle Size?</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {vehicleSizes.map((v, i) => (
                        <button
                          key={v.label}
                          onClick={() => setVehicle(i)}
                          className={`rounded-lg border p-4 text-left transition-all ${
                            vehicle === i
                              ? "border-primary bg-primary/10 text-white"
                              : "border-neutral-800 bg-neutral-900 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <span className="text-sm font-semibold block">{v.label}</span>
                          <span className="text-xs text-muted-foreground">{v.desc}</span>
                          <span className="text-xs text-primary/70 block mt-1">
                            {v.upcharge === 0 ? "No size upcharge" : `+ $${v.upcharge} size upcharge`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 1: Service */}
                {step === 1 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-white">Service Category</h3>
                    <div className="space-y-3">
                      {serviceCategories.map((s, i) => (
                        <button
                          key={s.label}
                          onClick={() => setService(i)}
                          className={`w-full text-left rounded-lg border p-4 text-sm font-medium transition-all ${
                            service === i
                              ? "border-primary bg-primary/10 text-white"
                              : "border-neutral-800 bg-neutral-900 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{s.label}</span>
                            <span className="text-primary">${s.base}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Add-Ons */}
                {step === 2 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Add-Ons (optional)</h3>
                    <p className="text-xs text-muted-foreground mb-5">Select as many as you want. We'll total everything up.</p>
                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      {addOns.map((a, i) => {
                        const active = selectedAddOns.includes(i);
                        return (
                          <button
                            key={a.key}
                            onClick={() => toggleAddOn(i)}
                            className={`w-full text-left rounded-lg border p-4 transition-all ${
                              active
                                ? "border-primary bg-primary/10 text-white"
                                : "border-neutral-800 bg-neutral-900 text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-sm font-semibold block">{a.label}</span>
                                <span className="text-xs text-muted-foreground">{a.desc}</span>
                              </div>
                              <span className="text-primary font-semibold text-sm">${a.price}</span>
                            </div>
                            <span className="text-[10px] text-primary/60 mt-1 block">{active ? "✓ Selected" : "Click to add"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Quote */}
                {step === 3 && (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2 text-white">Your Estimated Investment</h3>
                    <p className="text-5xl md:text-6xl font-bold text-primary my-6">${total}</p>

                    {/* Breakdown */}
                    <div className="text-left text-sm space-y-2 border border-neutral-800 rounded-lg p-4 mb-6 bg-neutral-900">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Package</span><span>${basePrice}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Vehicle size upcharge</span><span>${sizeUpcharge}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Add-ons total</span><span>${addOnsTotal}</span>
                      </div>
                      {selectedAddOns.length > 0 && (
                        <div className="pt-2 border-t border-neutral-800">
                          <p className="text-xs text-muted-foreground mb-1">Selected add-ons:</p>
                          <div className="space-y-1">
                            {selectedAddOns.map((idx) => (
                              <div key={addOns[idx].key} className="flex justify-between text-xs text-muted-foreground">
                                <span>{addOns[idx].label}</span><span>${addOns[idx].price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-white pt-2 border-t border-neutral-800">
                        <span>Total</span><span>${total}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground font-body mb-6">
                      {vehicle !== null ? vehicleSizes[vehicle].label : ""} · {service !== null ? serviceCategories[service].label : ""}{" "}
                      {selectedAddOns.length > 0 ? `· ${selectedAddOns.length} add-on(s)` : "· No add-ons"}
                    </p>

                    {!showContact ? (
                      <Button onClick={() => setShowContact(true)} size="lg" className="px-8">
                        Get a Final Quote <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-sm mx-auto text-left">
                        <Input placeholder="Full Name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="bg-neutral-900 border-neutral-800" />
                        <Input placeholder="Email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="bg-neutral-900 border-neutral-800" />
                        <Input placeholder="Phone" type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="bg-neutral-900 border-neutral-800" />
                        <div className="flex items-start gap-3 py-2">
                          <Checkbox
                            id="consent"
                            checked={consent}
                            onCheckedChange={(v) => setConsent(v === true)}
                            className="mt-0.5 border-neutral-600"
                          />
                          <label htmlFor="consent" className="text-xs text-muted-foreground leading-snug cursor-pointer">
                            I consent to receive text messages and emails from Glossworks Mobile Detailing regarding my services. Message & data rates may apply.
                          </label>
                        </div>
                        <Button onClick={handleSubmit} disabled={!contact.name || !contact.email || !consent} className="w-full">
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
            <Button variant="outline" onClick={() => { setShowContact(false); setStep(step - 1); }} disabled={step === 0} className="border-neutral-800">
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
