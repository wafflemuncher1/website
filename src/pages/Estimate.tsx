import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Send,
  Plus,
  Calendar,
  MapPin,
  User,
  ClipboardList,
  Check,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import StickyHeader from "@/components/StickyHeader";
import Footer from "@/components/Footer";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTACT_PHONE = "(502) 612-0430";
const NO_AVAILABILITY_MESSAGE = `Sorry, no times are available for this date. Please contact ${CONTACT_PHONE} for more info.`;

const SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzdxiRLadUk1R3y5uFfB6MUPtGDMDc6qoCVig1_PwmSueUf0e0ubjKRGF68K5wwpQFObw/exec";

// ─── Types ────────────────────────────────────────────────────────────────────

// Shape coming back from the `packages` Supabase table
interface DbPackage {
  id: string;
  label: string;
  price_cents: number;
  duration_mins: number;
  features: string[];
  active: boolean;
  sort_order: number;
}

// Shape the UI already expects (keeps all existing rendering code untouched)
interface UiPackage {
  id: string;
  label: string;
  price: number;          // dollars
  duration_mins: number;
  popular?: boolean;
  features: string[];
}

// ─── Static data (unchanged) ──────────────────────────────────────────────────

const steps = [
  { label: "Vehicle",   icon: Car },
  { label: "Condition", icon: ShieldCheck },
  { label: "Category",  icon: Layers },
  { label: "Package",   icon: Sparkles },
  { label: "Add-Ons",   icon: Plus },
  { label: "Date & Time", icon: Calendar },
  { label: "Location",  icon: MapPin },
  { label: "Your Info", icon: User },
  { label: "Summary",   icon: ClipboardList },
];

const vehicleSizes = [
  { label: "Small",  desc: "Coupe / Sedan",            upcharge: 0  },
  { label: "Medium", desc: "Small SUV / Crossover",    upcharge: 15 },
  { label: "Large",  desc: "Large SUV / Truck",        upcharge: 25 },
  { label: "XL",     desc: "XL Vehicle / Minivan",     upcharge: 50 },
];

const vehicleConditions = [
  { label: "Clean",    desc: "Recently washed, minimal dirt",                upcharge: 0  },
  { label: "Moderate", desc: "Average daily driver condition",               upcharge: 0  },
  { label: "Dirty",    desc: "Heavy buildup, hasn't been washed in a while", upcharge: 25 },
  { label: "Extreme",  desc: "Excessive dirt, pet hair, or neglect",         upcharge: 50 },
];

const serviceCategories = [
  { label: "Details", desc: "All bundles" },
];

const addOns = [
  { key: "iron", label: "Iron Decontamination", desc: "Chemical removal of iron particles", price: 35 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => /^[\d\s\-\+\(\)]{7,15}$/.test(phone.trim());

// ─── Scheduling helpers (mirrors the rules set on the admin Calendar page) ────

// Matches the shape saved by the admin's "Work Hours" dialog:
// { "0": { enabled: false }, "1": { enabled: true, start: "08:00", end: "18:00" }, ... }
// where the key is JS's Date.getDay() (0 = Sunday).
type DayHours = { enabled: boolean; start?: string; end?: string };
type WeeklySchedule = Record<string, DayHours>;

// Local (not UTC) y-m-d — avoids the classic "toISOString() shifts near midnight" bug.
const toYmdLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDaysLocal = (base: Date, n: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};

// "HH:MM" (24h) -> minutes since midnight
const hhmmToMins = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

// "9:00 AM" -> minutes since midnight
const time12ToMins = (t: string) => {
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 9 * 60;
  let h = parseInt(m[1]);
  const mins = parseInt(m[2]);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + mins;
};

// minutes since midnight -> "9:00 AM"
const minsTo12 = (totalMins: number) => {
  let h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ap = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
};

/** Convert a flat list of active DB packages into the UI shape */
const toUiPackages = (rows: DbPackage[]): UiPackage[] =>
  rows.map((r) => ({
    id:           r.id,
    label:        r.label,
    price:        r.price_cents / 100,
    duration_mins: r.duration_mins,
    features:     r.features,
  }));

// ─── Component ────────────────────────────────────────────────────────────────

const Estimate = () => {
  // ── Packages loaded from Supabase ──────────────────────────────────────────
  const [dbPackages, setDbPackages] = useState<UiPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  useEffect(() => {
    const loadPackages = async () => {
      setPackagesLoading(true);
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!error && data) {
        setDbPackages(toUiPackages(data as DbPackage[]));
      }
      setPackagesLoading(false);
    };
    loadPackages();
  }, []);

  // ── Scheduling rules loaded from Supabase (set on the admin Calendar page) ──
  useEffect(() => {
    const loadSchedulingSettings = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("key,value")
        .in("key", ["booking_window_days", "weekly_schedule", "slot_interval_mins"]);

      const map: Record<string, string> = {};
      (data ?? []).forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });

      if (map.booking_window_days) setBookingWindowDays(parseInt(map.booking_window_days) || 30);
      if (map.slot_interval_mins) setSlotIntervalMins(parseInt(map.slot_interval_mins) || 30);
      if (map.weekly_schedule) {
        try { setWeeklySchedule(JSON.parse(map.weekly_schedule)); } catch { /* fall back to "always open" below */ }
      }
      setSchedulingSettingsLoaded(true);
    };
    loadSchedulingSettings();
  }, []);

  // ── Form state (unchanged) ─────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [vehicle, setVehicle] = useState<number | null>(null);
  const [condition, setCondition] = useState<number | null>(null);
  const [category, setCategory] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  // ── Scheduling rules pulled from the admin Calendar page ──────────────────
  const [bookingWindowDays, setBookingWindowDays] = useState(30);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [slotIntervalMins, setSlotIntervalMins] = useState(30);
  const [schedulingSettingsLoaded, setSchedulingSettingsLoaded] = useState(false);

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [notes, setNotes] = useState("");

  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agreedToServiceContract, setAgreedToServiceContract] = useState(false);

  // ── Derived helpers ────────────────────────────────────────────────────────

  const getCategoryLabel = () =>
    category !== null ? serviceCategories[category].label : "";

  /**
   * Returns the packages for the currently selected category.
   * Since all packages live in Supabase under one category ("Details"),
   * we just return all loaded packages regardless of category label.
   */
  const getCategoryPackages = (): UiPackage[] => dbPackages;

  /**
   * Duration comes directly from the selected package's duration_mins field.
   * No more hard-coded switch statement — changing it in Settings is enough.
   */
  const getDurationMins = (): number => {
    const pkgs = getCategoryPackages();
    const pkg = selectedPackage !== null ? pkgs[selectedPackage] : null;
    return pkg?.duration_mins ?? 180;
  };

  // ── Availability — follows whatever's set on the admin Calendar page ────────
  useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedDate || !schedulingSettingsLoaded) return;

      setLoadingSlots(true);
      setSlotError(null);
      setAvailableSlots([]);
      setSelectedTime("");

      try {
        const todayYmd = toYmdLocal(new Date());
        const maxYmd = toYmdLocal(addDaysLocal(new Date(), bookingWindowDays));

        // 0. Booking-window guard (the date input's max already stops most of
        //    this, but the input is still a plain HTML control, so double-check).
        if (selectedDate < todayYmd || selectedDate > maxYmd) {
          setSlotError(NO_AVAILABILITY_MESSAGE);
          return;
        }

        // 1. Any one-off override for this exact date? (opens a normally-off
        //    day, closes a normally-open one, or gives it custom hours)
        const { data: overrideRow } = await supabase
          .from("schedule_overrides")
          .select("status,start_time,end_time")
          .eq("date", selectedDate)
          .maybeSingle();

        const dow = new Date(selectedDate + "T00:00:00").getDay(); // 0-6
        const weeklyDay = weeklySchedule?.[String(dow)];

        let working = false;
        let dayStart = "08:00";
        let dayEnd = "18:00";

        if (overrideRow?.status === "closed") {
          working = false;
        } else if (overrideRow?.status === "open" || overrideRow?.status === "custom") {
          working = true;
          dayStart = overrideRow.start_time || weeklyDay?.start || dayStart;
          dayEnd = overrideRow.end_time || weeklyDay?.end || dayEnd;
        } else if (weeklyDay) {
          working = weeklyDay.enabled;
          dayStart = weeklyDay.start || dayStart;
          dayEnd = weeklyDay.end || dayEnd;
        } else if (!weeklySchedule) {
          // Settings failed to load for some reason — fail open with the old
          // default hours rather than blocking every date on the site.
          working = true;
        }

        if (!working) {
          setSlotError(NO_AVAILABILITY_MESSAGE);
          return;
        }

        // 2. Any manual all-day block (vacation, rain day, etc.) on this date?
        const { data: dayBlocks } = await supabase
          .from("calendar_blocks")
          .select("start_at,end_at,all_day,block_type")
          .gte("start_at", selectedDate + "T00:00:00")
          .lte("start_at", selectedDate + "T23:59:59")
          .neq("block_type", "booking");

        const busy: { start: number; end: number }[] = [];
        for (const bl of dayBlocks ?? []) {
          if (bl.all_day) { busy.push({ start: 0, end: 24 * 60 }); continue; }
          const s = new Date(bl.start_at);
          const e = new Date(bl.end_at);
          busy.push({ start: s.getHours() * 60 + s.getMinutes(), end: e.getHours() * 60 + e.getMinutes() });
        }

        if (busy.some((b) => b.start === 0 && b.end === 24 * 60)) {
          setSlotError(NO_AVAILABILITY_MESSAGE);
          return;
        }

        // 3. Existing (non-completed) bookings on this date
        const { data: bookings, error: bookingsError } = await supabase
          .from("estimate_requests")
          .select("booking_time, duration_mins")
          .eq("booking_date", selectedDate)
          .eq("completed", false);

        if (bookingsError) throw bookingsError;

        for (const booking of bookings ?? []) {
          const start = time12ToMins(booking.booking_time ?? "9:00 AM");
          busy.push({ start, end: start + (booking.duration_mins ?? 120) });
        }

        // 4. Build candidate start times across THIS day's actual hours, at
        //    the admin's configured slot interval, long enough to fit the job.
        const durationMins = getDurationMins();
        const dayStartMin = hhmmToMins(dayStart);
        const dayEndMin = hhmmToMins(dayEnd);
        const interval = slotIntervalMins || 30;

        const available: string[] = [];
        for (let t = dayStartMin; t + durationMins <= dayEndMin; t += interval) {
          const overlaps = busy.some((b) => t < b.end && t + durationMins > b.start);
          if (!overlaps) available.push(minsTo12(t));
        }

        setAvailableSlots(available);
        if (available.length === 0) setSlotError(NO_AVAILABILITY_MESSAGE);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load availability";
        setSlotError(msg);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, schedulingSettingsLoaded, weeklySchedule, bookingWindowDays, slotIntervalMins]);

  // ── Scroll to top on step change (unchanged) ───────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // ── canNext (unchanged logic) ──────────────────────────────────────────────
  const canNext = (() => {
    switch (step) {
      case 0: return vehicle !== null;
      case 1: return condition !== null;
      case 2: return category !== null;
      case 3: return selectedPackage !== null;
      case 4: return true;
      case 5: return selectedDate !== "" && selectedTime !== "";
      case 6: return address.trim() !== "" && city.trim() !== "" && zipCode.trim() !== "";
      case 7:
        return (
          contact.name.trim() !== "" &&
          isValidEmail(contact.email) &&
          isValidPhone(contact.phone) &&
          consent
        );
      default: return false;
    }
  })();

  const toggleAddOn = (idx: number) =>
    setSelectedAddOns((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx],
    );

  const handleCategoryChange = (idx: number) => {
    setCategory(idx);
    setSelectedPackage(null);
  };

  const getTotal = () => {
    const pkgs = getCategoryPackages();
    const pkgPrice = selectedPackage !== null && pkgs[selectedPackage] ? pkgs[selectedPackage].price : 0;
    const sizeUpcharge = vehicle !== null ? vehicleSizes[vehicle].upcharge : 0;
    const conditionUpcharge = condition !== null ? vehicleConditions[condition].upcharge : 0;
    const addOnsTotal = selectedAddOns.reduce((sum, idx) => sum + addOns[idx].price, 0);
    return pkgPrice + sizeUpcharge + conditionUpcharge + addOnsTotal;
  };

  // ── Submit (unchanged — still hits Google Sheet for calendar) ─────────────
  const handleSubmit = async () => {
    if (!agreedToServiceContract) {
      alert("Please agree to the Service Contract before submitting.");
      return;
    }

    const pkgs = getCategoryPackages();
    const packageLabel =
      selectedPackage !== null && pkgs[selectedPackage]
        ? pkgs[selectedPackage].label
        : "";

    const payload = {
      action: "createBooking",
      date: selectedDate,
      timeLabel: selectedTime,
      durationMins: getDurationMins(),
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address,
      city,
      zipCode,
      notes,
      vehicleSize: vehicle !== null ? vehicleSizes[vehicle].label : "",
      vehicleCondition: condition !== null ? vehicleConditions[condition].label : "",
      category: getCategoryLabel(),
      packageLabel,
      addOns: selectedAddOns.map((idx) => addOns[idx].label).join(", ") || "None",
      total: `$${getTotal()}`,
      consent: consent ? "Yes" : "No",
    };

    try {
      const res = await fetch(SHEET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Booking failed");

      // Mirror to Supabase (best-effort)
      try {
        await supabase.from("estimate_requests").insert({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          address,
          city,
          zip_code: zipCode,
          vehicle_size: vehicle !== null ? vehicleSizes[vehicle].label : "",
          condition: condition !== null ? vehicleConditions[condition].label : "",
          service: packageLabel || getCategoryLabel(),
          add_ons: selectedAddOns.map((idx) => addOns[idx].label),
          total_cents: getTotal() * 100,
          consent: true,
          booking_date: selectedDate,
          booking_time: selectedTime,
          duration_mins: getDurationMins(),
          notify_status: "sent",
          completed: false,
        });
      } catch (supabaseErr) {
        console.error("Supabase mirror failed (booking still confirmed):", supabaseErr);
      }

      setSubmitted(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Booking failed. Please try another time.";
      alert(msg);
    }
  };

  const goToStep = (s: number) => setStep(s);

  const slideVariants = {
    enter:  { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit:   { opacity: 0, x: -30 },
  };

  const total = getTotal();
  const pkgs = getCategoryPackages();

  // ── Submitted screen (unchanged) ───────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <StickyHeader />
        <div className="flex-1 flex items-center justify-center px-4 pt-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full text-center rounded-xl border border-primary/30 bg-neutral-950 p-12"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">Booking Confirmed!</h3>
            <p className="text-muted-foreground font-body">
              You're on the schedule. We'll reach out soon to confirm details. Thank you for choosing Glossworks.
            </p>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Mini summary (unchanged) ───────────────────────────────────────────────
  const MiniSummary = () => (
    <div className="mt-6 border border-neutral-800 rounded-lg p-4 bg-neutral-900">
      <h4 className="text-sm font-semibold text-white mb-3">Your Estimate So Far</h4>
      <div className="text-xs space-y-1.5 text-muted-foreground">
        <div className="flex justify-between">
          <span>Vehicle</span>
          <span className="text-white">{vehicle !== null ? vehicleSizes[vehicle].label : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>Condition</span>
          <span className="text-white">{condition !== null ? vehicleConditions[condition].label : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>Package</span>
          <span className="text-white">
            {selectedPackage !== null && pkgs[selectedPackage]
              ? `${pkgs[selectedPackage].label} — $${pkgs[selectedPackage].price}`
              : "—"}
          </span>
        </div>
        {vehicle !== null && vehicleSizes[vehicle].upcharge > 0 && (
          <div className="flex justify-between">
            <span>Size upcharge</span>
            <span className="text-white">+ ${vehicleSizes[vehicle].upcharge}</span>
          </div>
        )}
        {condition !== null && vehicleConditions[condition].upcharge > 0 && (
          <div className="flex justify-between">
            <span>Condition upcharge</span>
            <span className="text-white">+ ${vehicleConditions[condition].upcharge}</span>
          </div>
        )}
        {selectedAddOns.length > 0 && (
          <div className="flex justify-between">
            <span>Add-ons ({selectedAddOns.length})</span>
            <span className="text-white">
              + ${selectedAddOns.reduce((s, i) => s + addOns[i].price, 0)}
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold text-white pt-2 border-t border-neutral-800">
          <span>Estimated Total</span>
          <span className="text-primary">${total}</span>
        </div>
      </div>
      <Button onClick={() => goToStep(5)} className="w-full mt-4" size="lg">
        Book Now <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black flex flex-col overflow-x-hidden">
      <StickyHeader />
      <div className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white">Book Your Detail</h1>
            <p className="text-muted-foreground mt-2 font-body">
              Complete each step to get your personalized quote.
            </p>
          </motion.div>

          {/* Step indicator */}
          <div
            className="mb-10 overflow-x-auto scrollbar-hide -mx-4 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
            <div className="flex items-center gap-1 min-w-max mx-auto justify-center">
              {steps.map((s, i) => (
                <div key={s.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        i < step
                          ? "bg-primary text-primary-foreground"
                          : i === step
                            ? "bg-primary text-primary-foreground ring-2 ring-primary/40 ring-offset-2 ring-offset-black"
                            : "bg-neutral-800 text-muted-foreground"
                      }`}
                    >
                      {i < step ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                    </div>
                    <span className="text-[9px] md:text-xs text-muted-foreground whitespace-nowrap">
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-4 md:w-10 h-px mx-0.5 mt-[-16px] ${
                        i < step ? "bg-primary" : "bg-neutral-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 md:p-8 min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
              >

                {/* Step 0: Vehicle */}
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
                            {v.upcharge === 0 ? "No upcharge" : `+ $${v.upcharge}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 1: Condition */}
                {step === 1 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-white">Vehicle Condition</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {vehicleConditions.map((c, i) => (
                        <button
                          key={c.label}
                          onClick={() => setCondition(i)}
                          className={`rounded-lg border p-4 text-left transition-all ${
                            condition === i
                              ? "border-primary bg-primary/10 text-white"
                              : "border-neutral-800 bg-neutral-900 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <span className="text-sm font-semibold block">{c.label}</span>
                          <span className="text-xs text-muted-foreground">{c.desc}</span>
                          <span className="text-xs text-primary/70 block mt-1">
                            {c.upcharge === 0 ? "No upcharge" : `+ $${c.upcharge}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Category */}
                {step === 2 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-white">Service Category</h3>
                    <div className="space-y-3">
                      {serviceCategories.map((c, i) => (
                        <button
                          key={c.label}
                          onClick={() => handleCategoryChange(i)}
                          className={`w-full text-left rounded-lg border p-4 transition-all ${
                            category === i
                              ? "border-primary bg-primary/10 text-white"
                              : "border-neutral-800 bg-neutral-900 text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <span className="text-sm font-semibold block">{c.label}</span>
                          <span className="text-xs text-muted-foreground">{c.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Package */}
                {step === 3 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Choose a Package</h3>
                    <p className="text-xs text-muted-foreground mb-5">{getCategoryLabel()} packages</p>
                    {packagesLoading ? (
                      <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="h-32 rounded-lg bg-neutral-800 animate-pulse" />
                        ))}
                      </div>
                    ) : pkgs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No packages available. Add them in Settings.</p>
                    ) : (
                      <div className="space-y-3">
                        {pkgs.map((p, i) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedPackage(i)}
                            className={`w-full text-left rounded-lg border p-4 transition-all relative ${
                              selectedPackage === i
                                ? "border-primary bg-primary/10 text-white"
                                : "border-neutral-800 bg-neutral-900 text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            {p.popular && (
                              <span className="absolute -top-2.5 right-3 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                                Most Popular
                              </span>
                            )}
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-semibold">{p.label}</span>
                              <span className="text-primary font-bold">${p.price}</span>
                            </div>
                            <ul className="space-y-1">
                              {p.features.map((f, fi) => (
                                <li key={fi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-muted-foreground mt-2 opacity-60">
                              ⏱ ~{(p.duration_mins / 60).toFixed(1)} hrs
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Add-Ons + Mini Summary */}
                {step === 4 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Add-Ons (optional)</h3>
                    <p className="text-xs text-muted-foreground mb-5">Select as many as you'd like.</p>
                    <div className="space-y-3">
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
                            <span className="text-[10px] text-primary/60 mt-1 block">
                              {active ? "✓ Selected" : "Click to add"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <MiniSummary />
                  </div>
                )}

                {/* Step 5: Date & Time */}
                {step === 5 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-white">Preferred Date & Time</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Date</label>
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-neutral-900 border-neutral-800 text-white"
                          min={toYmdLocal(new Date())}
                          max={toYmdLocal(addDaysLocal(new Date(), bookingWindowDays))}
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          We book up to {bookingWindowDays} days out.
                        </p>
                      </div>

                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Time Slot</label>
                        {!selectedDate ? (
                          <p className="text-sm text-muted-foreground">Pick a date first.</p>
                        ) : loadingSlots ? (
                          <p className="text-sm text-muted-foreground">Loading available times...</p>
                        ) : slotError ? (
                          <p className="text-sm text-red-400">{slotError}</p>
                        ) : availableSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground">{NO_AVAILABILITY_MESSAGE}</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {availableSlots.map((t) => (
                              <button
                                key={t}
                                onClick={() => setSelectedTime(t)}
                                className={`rounded-lg border px-3 py-2.5 text-sm transition-all ${
                                  selectedTime === t
                                    ? "border-primary bg-primary/10 text-white"
                                    : "border-neutral-800 bg-neutral-900 text-muted-foreground hover:border-primary/30"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Location */}
                {step === 6 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-white">Service Location</h3>
                    <div className="space-y-4">
                      <Input
                        placeholder="Street Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-neutral-900 border-neutral-800 text-white"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="bg-neutral-900 border-neutral-800 text-white"
                        />
                        <Input
                          placeholder="Zip Code"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          className="bg-neutral-900 border-neutral-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Notes (optional)</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Gate code, parking instructions, etc."
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 text-white p-3 text-sm min-h-[80px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 7: Your Info */}
                {step === 7 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-white">Your Information</h3>
                    <div className="space-y-4">
                      <Input
                        placeholder="Full Name"
                        value={contact.name}
                        onChange={(e) => setContact({ ...contact, name: e.target.value })}
                        className="bg-neutral-900 border-neutral-800 text-white"
                      />
                      <div>
                        <Input
                          placeholder="Email"
                          type="email"
                          value={contact.email}
                          onChange={(e) => setContact({ ...contact, email: e.target.value })}
                          className="bg-neutral-900 border-neutral-800 text-white"
                        />
                        {contact.email && !isValidEmail(contact.email) && (
                          <p className="text-xs text-red-400 mt-1">Please enter a valid email address</p>
                        )}
                      </div>
                      <div>
                        <Input
                          placeholder="Phone (e.g. 502-555-1234)"
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                          className="bg-neutral-900 border-neutral-800 text-white"
                        />
                        {contact.phone && !isValidPhone(contact.phone) && (
                          <p className="text-xs text-red-400 mt-1">Please enter a valid phone number</p>
                        )}
                      </div>
                      <div className="flex items-start gap-3 py-2">
                        <Checkbox
                          id="consent-page"
                          checked={consent}
                          onCheckedChange={(v) => setConsent(v === true)}
                          className="mt-0.5 border-neutral-600"
                        />
                        <label
                          htmlFor="consent-page"
                          className="text-xs text-muted-foreground leading-snug cursor-pointer"
                        >
                          I consent to receive text messages and emails from Glossworks Mobile Detailing regarding my
                          services. Message & data rates may apply.
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 8: Summary */}
                {step === 8 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-white text-center">Booking Summary</h3>
                    <p className="text-3xl md:text-4xl font-bold text-primary text-center my-4">${total}</p>

                    <div className="text-sm space-y-2 border border-neutral-800 rounded-lg p-4 bg-neutral-900 mb-6">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Vehicle</span>
                        <span className="text-white">
                          {vehicle !== null ? `${vehicleSizes[vehicle].label} (${vehicleSizes[vehicle].desc})` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Condition</span>
                        <span className="text-white">{condition !== null ? vehicleConditions[condition].label : "—"}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Category</span>
                        <span className="text-white">{getCategoryLabel() || "—"}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Package</span>
                        <span className="text-white">
                          {selectedPackage !== null && pkgs[selectedPackage]
                            ? `${pkgs[selectedPackage].label} — $${pkgs[selectedPackage].price}`
                            : "—"}
                        </span>
                      </div>
                      {vehicle !== null && vehicleSizes[vehicle].upcharge > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Size upcharge</span>
                          <span className="text-white">+ ${vehicleSizes[vehicle].upcharge}</span>
                        </div>
                      )}
                      {condition !== null && vehicleConditions[condition].upcharge > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Condition upcharge</span>
                          <span className="text-white">+ ${vehicleConditions[condition].upcharge}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>Add-ons</span>
                        <span className="text-white">
                          {selectedAddOns.length > 0
                            ? `${selectedAddOns.length} selected — $${selectedAddOns.reduce((s, i) => s + addOns[i].price, 0)}`
                            : "None"}
                        </span>
                      </div>
                      {selectedAddOns.length > 0 && (
                        <div className="pl-4 space-y-1 pt-1">
                          {selectedAddOns.map((idx) => (
                            <div key={addOns[idx].key} className="flex justify-between text-xs text-muted-foreground">
                              <span>{addOns[idx].label}</span>
                              <span>${addOns[idx].price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-neutral-800 pt-2 mt-2">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Date & Time</span>
                          <span className="text-white">{selectedDate} at {selectedTime}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground mt-1">
                          <span>Location</span>
                          <span className="text-white text-right max-w-[200px]">
                            {address}, {city} {zipCode}
                          </span>
                        </div>
                        {notes && (
                          <div className="flex justify-between text-muted-foreground mt-1">
                            <span>Notes</span>
                            <span className="text-white text-right max-w-[200px]">{notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-neutral-800 pt-2 mt-2">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Name</span>
                          <span className="text-white">{contact.name}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground mt-1">
                          <span>Email</span>
                          <span className="text-white">{contact.email}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground mt-1">
                          <span>Phone</span>
                          <span className="text-white">{contact.phone}</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-bold text-white pt-2 border-t border-neutral-800">
                        <span>Total Estimate</span>
                        <span>${total}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 py-3 mt-2 border border-neutral-800 bg-neutral-900 rounded-lg px-4 mb-4">
                      <Checkbox
                        id="service-contract"
                        checked={agreedToServiceContract}
                        onCheckedChange={(v) => setAgreedToServiceContract(v === true)}
                        className="mt-0.5 border-neutral-600"
                      />
                      <label
                        htmlFor="service-contract"
                        className="text-xs text-muted-foreground leading-snug cursor-pointer"
                      >
                        I agree to the{" "}
                        <a
                          href="https://docs.google.com/document/d/1THUKnhmFFCmNiYjJ_WNiwbss3F8MPF-NoSL00hKulnw/edit?usp=sharing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-4 hover:text-primary/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Service Contract
                        </a>
                        .
                      </label>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      className="w-full"
                      size="lg"
                      disabled={!agreedToServiceContract}
                    >
                      Confirm & Submit <Send className="ml-2 h-4 w-4" />
                    </Button>
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
              className="border-neutral-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < 8 && step !== 4 && (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Estimate;
