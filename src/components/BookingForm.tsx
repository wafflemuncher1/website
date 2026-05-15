import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Package, CalendarDays, User, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const steps = [
  { label: "Vehicle", icon: Car },
  { label: "Package", icon: Package },
  { label: "Date", icon: CalendarDays },
  { label: "Contact", icon: User },
];

const vehicles = ["Sedan", "SUV", "Truck", "Coupe", "Van"];
const pkgs = ["The Maintenance", "The Signature Detail", "The Showroom Prep"];

const BookingForm = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ vehicle: "", pkg: "", date: "", name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);

  const canNext =
    (step === 0 && form.vehicle) ||
    (step === 1 && form.pkg) ||
    (step === 2 && form.date) ||
    (step === 3 && form.name && form.email);

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  if (submitted) {
    return (
      <section id="booking" className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center rounded-xl border border-primary/30 bg-card p-12"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Booking Received</h3>
            <p className="text-muted-foreground font-body">
              We'll reach out within 24 hours to confirm your appointment. Thank you for choosing Glossworks.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Book Now</p>
          <h2 className="text-3xl md:text-5xl font-bold">Secure Your Date</h2>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-10">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
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
                    <h3 className="text-lg font-semibold mb-6">Select Your Vehicle Type</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {vehicles.map((v) => (
                        <button
                          key={v}
                          onClick={() => setForm({ ...form, vehicle: v })}
                          className={`rounded-lg border p-4 text-sm font-medium transition-all ${
                            form.vehicle === v
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6">Choose Your Package</h3>
                    <div className="space-y-3">
                      {pkgs.map((p) => (
                        <button
                          key={p}
                          onClick={() => setForm({ ...form, pkg: p })}
                          className={`w-full text-left rounded-lg border p-4 text-sm font-medium transition-all ${
                            form.pkg === p
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6">Preferred Date</h3>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="max-w-xs bg-secondary/50 border-border/50"
                    />
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6">Your Contact Info</h3>
                    <div className="space-y-4 max-w-sm">
                      <Input
                        placeholder="Full Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="bg-secondary/50 border-border/50"
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="bg-secondary/50 border-border/50"
                      />
                      <Input
                        placeholder="Phone (optional)"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="bg-secondary/50 border-border/50"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="border-border/50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setSubmitted(true)} disabled={!canNext}>
                Submit Booking <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingForm;
