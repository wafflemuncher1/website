import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle, Search, Eye, Plus, Phone, ChevronLeft, ChevronRight,
  Trash2, ExternalLink, CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip_code: string;
  vehicle_size: string;
  condition: string;
  service: string;
  add_ons: string[];
  total_cents: number;
  consent: boolean;
  service_agreement_url: string | null;
  completed: boolean;
  ticket_number: string;
  notify_status: string;
  notes?: string;
  booking_date?: string;
  booking_time?: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const VEHICLE_SIZES = [
  { label: "Small",  desc: "Coupe / Sedan",            upcharge: 0   },
  { label: "Medium", desc: "Small SUV / Crossover",    upcharge: 15  },
  { label: "Large",  desc: "Large SUV / Truck",        upcharge: 25  },
  { label: "XL",     desc: "XL Vehicle / Minivan",     upcharge: 50  },
];

const CONDITIONS = [
  { label: "Clean",    desc: "Recently washed, minimal dirt",                upcharge: 0  },
  { label: "Moderate", desc: "Average daily driver condition",               upcharge: 0  },
  { label: "Dirty",    desc: "Heavy buildup, hasn't been washed in a while", upcharge: 25 },
  { label: "Extreme",  desc: "Excessive dirt, pet hair, or neglect",         upcharge: 50 },
];

const PACKAGES = [
  {
    label: "The Baseline", price: 75, duration_mins: 120,
    features: [
      "pH-neutral foam bath to safely lift surface grit",
      "Wheels: deep barrel cleaning & tire scrub",
      "Bug removal and cleaning of fuel doors and door jambs",
      "Finished with Bead Maker for signature slickness",
      "Premium tire dressing applied",
    ],
  },
  {
    label: "The Signature Detail", price: 165, duration_mins: 180, popular: true,
    features: [
      "Full Baseline Process included",
      "High-power deep vacuum: cabin, trunk, tight crevices",
      "Full interior sanitization & wipe down",
      "Deep-clean floor mats (rubber and carpet)",
      "UV surface armor (prevents fading & cracking)",
    ],
  },
];

const ADD_ONS = [
  { key: "iron", label: "Iron Decontamination", desc: "Chemical removal of iron particles", price: 35 },
];

const TIME_SLOTS = [
  "8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCents = (c: number) => (c ? `$${(c / 100).toFixed(2)}` : "—");
const fmtDate  = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const parseAddOns = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
};

// ─── Manual Booking Wizard ────────────────────────────────────────────────────

const STEPS = ["Vehicle", "Package", "Add-Ons", "Date & Time", "Location", "Customer"] as const;
type Step = 0 | 1 | 2 | 3 | 4 | 5;

type BookingDraft = {
  vehicleIdx: number | null; conditionIdx: number | null; packageIdx: number | null;
  addOns: number[]; date: string; time: string;
  address: string; city: string; zipCode: string; notes: string;
  name: string; email: string; phone: string;
};

const blankDraft = (): BookingDraft => ({
  vehicleIdx: null, conditionIdx: null, packageIdx: null,
  addOns: [], date: "", time: "",
  address: "", city: "", zipCode: "", notes: "",
  name: "", email: "", phone: "",
});

const getTotal = (d: BookingDraft) => {
  const pkg   = d.packageIdx !== null ? PACKAGES[d.packageIdx].price : 0;
  const size  = d.vehicleIdx !== null ? VEHICLE_SIZES[d.vehicleIdx].upcharge : 0;
  const cond  = d.conditionIdx !== null ? CONDITIONS[d.conditionIdx].upcharge : 0;
  const addOn = d.addOns.reduce((s, i) => s + ADD_ONS[i].price, 0);
  return pkg + size + cond + addOn;
};

const canAdvance = (step: Step, d: BookingDraft) => {
  switch (step) {
    case 0: return d.vehicleIdx !== null && d.conditionIdx !== null;
    case 1: return d.packageIdx !== null;
    case 2: return true;
    case 3: return d.date !== "" && d.time !== "";
    case 4: return d.address.trim() !== "" && d.city.trim() !== "" && d.zipCode.trim() !== "";
    case 5: return d.name.trim() !== "" && d.phone.trim() !== "";
    default: return false;
  }
};

const ManualBookingWizard = ({
  open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<BookingDraft>(blankDraft());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const reset = () => { setStep(0); setDraft(blankDraft()); };
  const handleClose = () => { reset(); onClose(); };
  const toggleAddOn = (i: number) =>
    setDraft(d => ({ ...d, addOns: d.addOns.includes(i) ? d.addOns.filter(x => x !== i) : [...d.addOns, i] }));

  const handleSave = async () => {
    setSaving(true);
    const pkg   = draft.packageIdx !== null ? PACKAGES[draft.packageIdx] : null;
    const total = getTotal(draft);
    const { error } = await supabase.from("estimate_requests").insert({
      name: draft.name.trim(), email: draft.email.trim() || null, phone: draft.phone.trim(),
      address: draft.address.trim(), city: draft.city.trim(), zip_code: draft.zipCode.trim(),
      notes: draft.notes.trim() || null,
      vehicle_size: draft.vehicleIdx !== null ? VEHICLE_SIZES[draft.vehicleIdx].label : null,
      condition: draft.conditionIdx !== null ? CONDITIONS[draft.conditionIdx].label : null,
      service: pkg?.label ?? null,
      add_ons: draft.addOns.map(i => ADD_ONS[i].label),
      total_cents: total * 100,
      booking_date: draft.date || null, booking_time: draft.time || null,
      duration_mins: pkg?.duration_mins ?? 120,
      consent: true, completed: false, notify_status: "sent",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Booking created for ${draft.name} ✓` });
      reset(); onClose(); onSaved();
    }
    setSaving(false);
  };

  const total = getTotal(draft);
  const selectedPkg = draft.packageIdx !== null ? PACKAGES[draft.packageIdx] : null;

  const MiniSummary = () => (
    <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
      {draft.vehicleIdx !== null && <SRow label="Vehicle" value={VEHICLE_SIZES[draft.vehicleIdx].label} />}
      {draft.conditionIdx !== null && <SRow label="Condition" value={CONDITIONS[draft.conditionIdx].label} />}
      {selectedPkg && <SRow label="Package" value={`${selectedPkg.label} — $${selectedPkg.price}`} />}
      {draft.addOns.length > 0 && <SRow label="Add-ons" value={`+$${draft.addOns.reduce((s, i) => s + ADD_ONS[i].price, 0)}`} />}
      {total > 0 && (
        <div className="flex justify-between font-bold pt-1 border-t">
          <span>Estimated Total</span><span className="text-primary">${total}</span>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4" /> Manual Booking
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={["w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                "bg-muted text-muted-foreground"].join(" ")}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-4 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
          <span className="ml-2 text-xs text-muted-foreground">{STEPS[step]}</span>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold mb-2 block">Vehicle Size</Label>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_SIZES.map((v, i) => (
                  <button key={v.label} onClick={() => setDraft(d => ({ ...d, vehicleIdx: i }))}
                    className={["rounded-lg border p-3 text-left text-sm transition-all",
                      draft.vehicleIdx === i ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"].join(" ")}>
                    <span className="font-semibold block">{v.label}</span>
                    <span className="text-xs text-muted-foreground">{v.desc}</span>
                    <span className="text-xs text-primary/70 block mt-0.5">{v.upcharge === 0 ? "No upcharge" : `+$${v.upcharge}`}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">Condition</Label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map((c, i) => (
                  <button key={c.label} onClick={() => setDraft(d => ({ ...d, conditionIdx: i }))}
                    className={["rounded-lg border p-3 text-left text-sm transition-all",
                      draft.conditionIdx === i ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"].join(" ")}>
                    <span className="font-semibold block">{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.desc}</span>
                    <span className="text-xs text-primary/70 block mt-0.5">{c.upcharge === 0 ? "No upcharge" : `+$${c.upcharge}`}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <Label className="text-xs font-semibold mb-1 block">Choose Package</Label>
            {PACKAGES.map((pkg, i) => (
              <button key={pkg.label} onClick={() => setDraft(d => ({ ...d, packageIdx: i }))}
                className={["w-full text-left rounded-lg border p-4 transition-all relative",
                  draft.packageIdx === i ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"].join(" ")}>
                {pkg.popular && (
                  <span className="absolute -top-2.5 right-3 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">Most Popular</span>
                )}
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-semibold text-sm">{pkg.label}</span>
                  <span className="text-primary font-bold">${pkg.price}</span>
                </div>
                <ul className="space-y-0.5">
                  {pkg.features.map((f, fi) => (
                    <li key={fi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary shrink-0 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-muted-foreground mt-2">⏱ ~{pkg.duration_mins / 60} hrs</div>
              </button>
            ))}
            {(draft.vehicleIdx !== null || draft.conditionIdx !== null) && <MiniSummary />}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <Label className="text-xs font-semibold block">Add-Ons <span className="text-muted-foreground font-normal">(optional)</span></Label>
            {ADD_ONS.map((a, i) => {
              const active = draft.addOns.includes(i);
              return (
                <button key={a.key} onClick={() => toggleAddOn(i)}
                  className={["w-full text-left rounded-lg border p-4 transition-all",
                    active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"].join(" ")}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-semibold block">{a.label}</span>
                      <span className="text-xs text-muted-foreground">{a.desc}</span>
                    </div>
                    <span className="text-primary font-semibold">${a.price}</span>
                  </div>
                  <span className="text-[10px] text-primary/60 mt-1 block">{active ? "✓ Selected — click to remove" : "Click to add"}</span>
                </button>
              );
            })}
            <MiniSummary />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold mb-2 block">Date</Label>
              <Input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">Time Slot</Label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map(t => (
                  <button key={t} onClick={() => setDraft(d => ({ ...d, time: t }))}
                    className={["rounded-lg border px-2 py-2.5 text-xs font-medium transition-all",
                      draft.time === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"].join(" ")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <MiniSummary />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Street Address *</Label>
              <Input placeholder="123 Main St" value={draft.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">City *</Label>
                <Input placeholder="Louisville" value={draft.city} onChange={e => setDraft(d => ({ ...d, city: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Zip Code *</Label>
                <Input placeholder="40202" value={draft.zipCode} onChange={e => setDraft(d => ({ ...d, zipCode: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Notes</Label>
              <Textarea placeholder="Gate code, parking instructions, extra details…"
                value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} rows={3} />
            </div>
            <MiniSummary />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Full Name *</Label>
              <Input placeholder="John Smith" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Phone *</Label>
              <Input type="tel" placeholder="502-555-1234" value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Email <span className="text-muted-foreground">(optional)</span></Label>
              <Input type="email" placeholder="john@email.com" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1.5 mt-2">
              <p className="font-semibold text-sm mb-2">Booking Summary</p>
              <SRow label="Vehicle" value={draft.vehicleIdx !== null ? `${VEHICLE_SIZES[draft.vehicleIdx].label} — ${VEHICLE_SIZES[draft.vehicleIdx].desc}` : "—"} />
              <SRow label="Condition" value={draft.conditionIdx !== null ? CONDITIONS[draft.conditionIdx].label : "—"} />
              <SRow label="Package" value={selectedPkg ? `${selectedPkg.label} — $${selectedPkg.price}` : "—"} />
              {draft.vehicleIdx !== null && VEHICLE_SIZES[draft.vehicleIdx].upcharge > 0 && (
                <SRow label="Size upcharge" value={`+$${VEHICLE_SIZES[draft.vehicleIdx].upcharge}`} />
              )}
              {draft.conditionIdx !== null && CONDITIONS[draft.conditionIdx].upcharge > 0 && (
                <SRow label="Condition upcharge" value={`+$${CONDITIONS[draft.conditionIdx].upcharge}`} />
              )}
              {draft.addOns.length > 0 && <SRow label="Add-ons" value={draft.addOns.map(i => ADD_ONS[i].label).join(", ")} />}
              <SRow label="Date & Time" value={draft.date && draft.time ? `${draft.date} at ${draft.time}` : "—"} />
              <SRow label="Address" value={draft.address ? `${draft.address}, ${draft.city} ${draft.zipCode}` : "—"} />
              {draft.notes && <SRow label="Notes" value={draft.notes} />}
              <div className="flex justify-between font-bold pt-2 border-t text-sm">
                <span>Estimated Total</span>
                <span className="text-primary">${total}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row justify-between mt-2">
          <Button variant="outline" onClick={step === 0 ? handleClose : () => setStep(s => (s - 1) as Step)} className="gap-1">
            <ChevronLeft className="h-4 w-4" />{step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 5 ? (
            <Button onClick={() => setStep(s => (s + 1) as Step)} disabled={!canAdvance(step, draft)} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving || !canAdvance(step, draft)} className="gap-1.5">
              {saving ? "Creating…" : <><CheckCircle className="h-4 w-4" /> Create Booking</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const { toast } = useToast();

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("estimate_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setBookings(data as Booking[]);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const markComplete = async (id: string) => {
    const { error } = await supabase.from("estimate_requests").update({ completed: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marked as complete ✓" });
      fetchBookings();
      setSelected(null);
    }
  };

  const deleteBooking = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("estimate_requests").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Error deleting booking", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Booking for ${deleteTarget.name} deleted` });
      setDeleteTarget(null);
      setSelected(null);
      fetchBookings();
    }
    setDeleting(false);
  };

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      b.name?.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q) ||
      b.phone?.includes(q) ||
      b.ticket_number?.toLowerCase().includes(q) ||
      b.service?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "active" && !b.completed) ||
      (filter === "completed" && b.completed);
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {bookings.filter(b => !b.completed).length} active · {bookings.length} total
          </p>
        </div>
        <Button onClick={() => setManualOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <Phone className="h-4 w-4" />
          Manual Booking
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, ticket, service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "completed"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm"
              onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No bookings found.</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap text-xs">Created</TableHead>
                <TableHead className="whitespace-nowrap text-xs">Name</TableHead>
                <TableHead className="whitespace-nowrap text-xs">Email</TableHead>
                <TableHead className="whitespace-nowrap text-xs">Phone</TableHead>
                <TableHead className="whitespace-nowrap text-xs">Vehicle</TableHead>
                <TableHead className="whitespace-nowrap text-xs">Condition</TableHead>
                <TableHead className="whitespace-nowrap text-xs">Service</TableHead>
                <TableHead className="whitespace-nowrap text-xs">Add-ons</TableHead>
                <TableHead className="whitespace-nowrap text-xs">Total</TableHead>
                <TableHead className="whitespace-nowrap text-xs text-center">Consent</TableHead>
                <TableHead className="whitespace-nowrap text-xs text-center">Agreement</TableHead>
                <TableHead className="whitespace-nowrap text-xs text-center">Completed</TableHead>
                <TableHead className="whitespace-nowrap text-xs">Ticket</TableHead>
                <TableHead className="w-20 text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => {
                const addOns = parseAddOns(b.add_ons);
                return (
                  <TableRow key={b.id} className="text-xs">
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(b.created_at)}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{b.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[140px] truncate">{b.email || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-[11px]">{b.phone || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{b.vehicle_size || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{b.condition || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap max-w-[130px] truncate">{b.service || "—"}</TableCell>
                    <TableCell className="max-w-[120px]">
                      {addOns.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {addOns.map((a, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] h-4 px-1">{a}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{fmtCents(b.total_cents)}</TableCell>
                    <TableCell className="text-center">
                      {b.consent
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto" />
                        : <XCircle className="h-3.5 w-3.5 text-red-400 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {b.service_agreement_url ? (
                        <a href={b.service_agreement_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center justify-center hover:text-primary transition-colors"
                          onClick={e => e.stopPropagation()}>
                          <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {b.completed
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto" />
                        : <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 mx-auto" />}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] whitespace-nowrap">{b.ticket_number || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(b)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => setDeleteTarget(b)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Detail dialog ────────────────────────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking — {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const addOns = parseAddOns(selected.add_ons);
            return (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Created" value={fmtDateTime(selected.created_at)} />
                  <Detail label="Ticket" value={selected.ticket_number || "—"} />
                  <Detail label="Name" value={selected.name} />
                  <Detail label="Phone" value={selected.phone} />
                  <Detail label="Email" value={selected.email || "—"} />
                  <Detail label="Vehicle" value={selected.vehicle_size || "—"} />
                  <Detail label="Condition" value={selected.condition || "—"} />
                  <Detail label="Service" value={selected.service || "—"} />
                  <Detail label="Total" value={fmtCents(selected.total_cents)} />
                  <Detail label="Consent" value={selected.consent ? "Yes ✓" : "No"} />
                  {selected.booking_date && (
                    <Detail label="Scheduled" value={`${selected.booking_date}${selected.booking_time ? ` at ${selected.booking_time}` : ""}`} />
                  )}
                  <Detail label="Address" value={`${selected.address || ""}, ${selected.city || ""} ${selected.zip_code || ""}`.trim()} />
                  <Detail label="Completed" value={selected.completed ? "Yes ✓" : "No"} />
                </div>

                {addOns.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1.5">Add-ons</p>
                    <div className="flex flex-wrap gap-1.5">
                      {addOns.map((a, i) => <Badge key={i} variant="outline" className="text-xs">{a}</Badge>)}
                    </div>
                  </div>
                )}

                {selected.service_agreement_url && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Service Agreement</p>
                    <a href={selected.service_agreement_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-xs flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> View signed agreement
                    </a>
                  </div>
                )}

                {selected.notes && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Notes</p>
                    <p>{selected.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {!selected.completed && (
                    <Button className="flex-1 gap-1.5" onClick={() => markComplete(selected.id)}>
                      <CheckCircle className="h-4 w-4" /> Mark Complete
                    </Button>
                  )}
                  <Button variant="destructive" className="gap-1.5" onClick={() => { setDeleteTarget(selected); setSelected(null); }}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ───────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Delete Booking
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm">
              Are you sure you want to delete the booking for{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>?
            </p>
            <p className="text-xs text-muted-foreground">
              This will permanently remove the booking and cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={deleteBooking} className="gap-1.5">
              {deleting ? "Deleting…" : <><Trash2 className="h-3.5 w-3.5" /> Delete</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual booking wizard */}
      <ManualBookingWizard
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onSaved={fetchBookings}
      />
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="font-medium">{value || "—"}</p>
  </div>
);

export default BookingsPage;