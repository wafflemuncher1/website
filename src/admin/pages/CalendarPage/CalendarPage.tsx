import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Plus,
  X,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  Car,
  Phone,
  DollarSign,
  Trash2,
  CalendarDays,
  CalendarRange,
  Ban,
  CalendarCheck,
  Settings,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  vehicle_size: string;
  total_cents: number;
  booking_date: string;
  booking_time: string;
  duration_mins: number;
  address: string;
  city: string;
  zip_code: string;
  completed: boolean;
};

type CalBlock = {
  id: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  note: string;
  block_type: string;
  estimate_request_id: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const todayStr = () => ymd(new Date());

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const fmtMoney = (cents: number) => `$${(cents / 100).toFixed(0)}`;

const fmtDate = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const fmtShortDate = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const fmtMonthTitle = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const fmtWeekTitle = (days: string[]) => {
  if (!days.length) return "";
  const s = new Date(days[0] + "T00:00:00");
  const e = new Date(days[6] + "T00:00:00");
  if (s.getMonth() === e.getMonth())
    return `${s.toLocaleDateString("en-US", { month: "long" })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  return `${fmtShortDate(days[0])} – ${fmtShortDate(days[6])}, ${e.getFullYear()}`;
};

const fmt12 = (t: string) => {
  // "09:00" → "9:00 AM"
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr);
  const m = mStr || "00";
  const ap = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ap}`;
};

const parseHour24 = (timeStr: string): number => {
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 9;
  let h = parseInt(m[1]);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h;
};

const startOfWeekSun = (d: Date) => {
  const r = new Date(d);
  r.setDate(d.getDate() - d.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
};

const getWeekDays = (anchor: Date): string[] => {
  const sun = startOfWeekSun(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    return ymd(d);
  });
};

const getMonthCells = (anchor: Date) => {
  const y = anchor.getFullYear();
  const mo = anchor.getMonth();
  const first = new Date(y, mo, 1);
  const last = new Date(y, mo + 1, 0);
  const cells: { date: string; cur: boolean }[] = [];
  for (let i = first.getDay() - 1; i >= 0; i--) {
    const d = new Date(y, mo, -i);
    cells.push({ date: ymd(d), cur: false });
  }
  for (let i = 1; i <= last.getDate(); i++)
    cells.push({ date: ymd(new Date(y, mo, i)), cur: true });
  const tail = 6 - last.getDay();
  for (let i = 1; i <= tail; i++)
    cells.push({ date: ymd(new Date(y, mo + 1, i)), cur: false });
  return cells;
};

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const fmtHour = (h: number) =>
  h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WINDOW_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "1 month", value: 30 },
  { label: "3 months", value: 90 },
];

// ─── Component ────────────────────────────────────────────────────────────────

const CalendarPage = () => {
  const [view, setView] = useState<"month" | "week">("month");
  const [anchor, setAnchor] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<CalBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingWindowDays, setBookingWindowDays] = useState(30);
  const [savingWindow, setSavingWindow] = useState(false);
  const { toast } = useToast();

  // ── Block modal (multi-day) ──────────────────────────────────────────────
  const [blockModal, setBlockModal] = useState(false);
  const [blockSelectedDays, setBlockSelectedDays] = useState<string[]>([]);
  const [blockMultiAnchor, setBlockMultiAnchor] = useState(new Date());
  const [blockAllDay, setBlockAllDay] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState("09:00");
  const [blockEndTime, setBlockEndTime] = useState("17:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockSaving, setBlockSaving] = useState(false);

  // ── Reschedule, rain, delete ─────────────────────────────────────────────
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "" });
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  const [rainModal, setRainModal] = useState(false);
  const [rainForm, setRainForm] = useState({
    fromDate: todayStr(),
    reason: "Rain cancellation — we will reach out to reschedule.",
  });
  const [rainSaving, setRainSaving] = useState(false);

  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const getRanges = useCallback(() => {
    if (view === "week") {
      const days = getWeekDays(anchor);
      return { from: days[0], to: days[6] };
    }
    const y = anchor.getFullYear();
    const mo = anchor.getMonth();
    return { from: ymd(new Date(y, mo, 1)), to: ymd(new Date(y, mo + 1, 0)) };
  }, [anchor, view]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getRanges();
    const [bRes, cbRes, settRes] = await Promise.all([
      supabase
        .from("estimate_requests")
        .select("id,name,email,phone,service,vehicle_size,total_cents,booking_date,booking_time,duration_mins,address,city,zip_code,completed")
        .not("booking_date", "is", null)
        .gte("booking_date", from)
        .lte("booking_date", to),
      supabase
        .from("calendar_blocks")
        .select("*")
        .gte("start_at", from + "T00:00:00")
        .lte("start_at", to + "T23:59:59"),
      supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "booking_window_days")
        .single(),
    ]);
    if (bRes.data) setBookings(bRes.data as Booking[]);
    if (cbRes.data) setBlocks(cbRes.data as CalBlock[]);
    if (settRes.data) setBookingWindowDays(parseInt(settRes.data.value) || 30);
    setLoading(false);
  }, [getRanges]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const prev = () => setAnchor(a => {
    const d = new Date(a);
    view === "month" ? d.setMonth(d.getMonth() - 1) : d.setDate(d.getDate() - 7);
    return d;
  });
  const next = () => setAnchor(a => {
    const d = new Date(a);
    view === "month" ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 7);
    return d;
  });
  const goToday = () => setAnchor(new Date());

  // ── Data helpers ──────────────────────────────────────────────────────────

  const bookingsOnDay = (d: string) => bookings.filter(b => b.booking_date === d);

  const manualBlocksOnDay = (d: string) =>
    blocks.filter(bl => bl.start_at.slice(0, 10) === d && bl.block_type !== "booking");

  const isDayFullyBlocked = (d: string) =>
    blocks.some(bl => bl.start_at.slice(0, 10) === d && bl.all_day && bl.block_type !== "booking");

  const bookingsForHour = (d: string, h: number) =>
    bookings.filter(b => {
      if (b.booking_date !== d) return false;
      const startH = parseHour24(b.booking_time || "9:00 AM");
      const endH = startH + Math.ceil((b.duration_mins || 120) / 60);
      return h >= startH && h < endH;
    });

  const isHourBlocked = (d: string, h: number) =>
    blocks.some(bl => {
      if (bl.block_type === "booking" || bl.start_at.slice(0, 10) !== d) return false;
      if (bl.all_day) return true;
      const startH = new Date(bl.start_at).getHours();
      const endH = new Date(bl.end_at).getHours();
      return h >= startH && h < endH;
    });

  // Cutoff date based on booking window
  const cutoffDate = ymd(addDays(new Date(), bookingWindowDays));

  // ── Stats ─────────────────────────────────────────────────────────────────

  const todayBookings = bookings.filter(b => b.booking_date === todayStr()).length;
  const weekDays = getWeekDays(new Date());
  const weekBookings = bookings.filter(
    b => b.booking_date >= weekDays[0] && b.booking_date <= weekDays[6]
  ).length;
  const upcomingRevenue = bookings
    .filter(b => !b.completed && b.booking_date >= todayStr())
    .reduce((s, b) => s + b.total_cents, 0);

  // ── Block multi-day calendar helpers ─────────────────────────────────────

  const blockMonthCells = getMonthCells(blockMultiAnchor);

  const toggleBlockDay = (d: string) => {
    setBlockSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    );
  };

  // ── Save booking window ───────────────────────────────────────────────────

  const saveBookingWindow = async (days: number) => {
    setSavingWindow(true);
    const { error } = await supabase
      .from("admin_settings")
      .upsert({ key: "booking_window_days", value: String(days), updated_at: new Date().toISOString() });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setBookingWindowDays(days);
      toast({ title: `Booking window set to ${WINDOW_OPTIONS.find(o => o.value === days)?.label}` });
    }
    setSavingWindow(false);
  };

  // ── Save multi-day block ──────────────────────────────────────────────────

  const handleMultiBlockSave = async () => {
    if (!blockSelectedDays.length || !blockReason.trim()) {
      toast({ title: "Select at least one day and enter a reason", variant: "destructive" });
      return;
    }
    setBlockSaving(true);

    const inserts = blockSelectedDays.map(date => {
      const start = blockAllDay
        ? new Date(date + "T00:00:00-04:00").toISOString()
        : new Date(date + "T" + blockStartTime + ":00-04:00").toISOString();
      const end = blockAllDay
        ? new Date(date + "T23:59:59-04:00").toISOString()
        : new Date(date + "T" + blockEndTime + ":00-04:00").toISOString();
      return { start_at: start, end_at: end, all_day: blockAllDay, note: blockReason, block_type: "manual" };
    });

    const { error } = await supabase.from("calendar_blocks").insert(inserts);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: `${blockSelectedDays.length} day${blockSelectedDays.length > 1 ? "s" : ""} blocked ✓` });
      setBlockModal(false);
      setBlockSelectedDays([]);
      setBlockReason("");
      setBlockAllDay(false);
      setBlockStartTime("09:00");
      setBlockEndTime("17:00");
      fetchData();
    }
    setBlockSaving(false);
  };

  // ── Delete block ──────────────────────────────────────────────────────────

  const handleDeleteBlock = async () => {
    if (!deleteBlockId) return;
    const { error } = await supabase.from("calendar_blocks").delete().eq("id", deleteBlockId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Block removed" }); fetchData(); }
    setDeleteBlockId(null);
  };

  // ── Reschedule booking ────────────────────────────────────────────────────

  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !rescheduleForm.date || !rescheduleForm.time) return;
    setRescheduleSaving(true);
    const { error: bErr } = await supabase
      .from("estimate_requests")
      .update({ booking_date: rescheduleForm.date, booking_time: rescheduleForm.time })
      .eq("id", selectedBooking.id);

    if (bErr) { toast({ title: "Error", description: bErr.message, variant: "destructive" }); setRescheduleSaving(false); return; }

    await supabase.from("calendar_blocks").delete().eq("estimate_request_id", selectedBooking.id);

    const h24 = parseHour24(rescheduleForm.time);
    const padH = h24.toString().padStart(2, "0");
    const newStart = new Date(`${rescheduleForm.date}T${padH}:00:00-04:00`).toISOString();
    const newEnd = new Date(new Date(`${rescheduleForm.date}T${padH}:00:00-04:00`).getTime() + (selectedBooking.duration_mins || 120) * 60000).toISOString();

    await supabase.from("calendar_blocks").insert({
      start_at: newStart, end_at: newEnd, all_day: false,
      note: `Booking: ${selectedBooking.name} — ${selectedBooking.service}`,
      estimate_request_id: selectedBooking.id, block_type: "booking",
    });

    toast({ title: "Booking rescheduled ✓" });
    setRescheduleModal(false);
    setSelectedBooking(null);
    setRescheduleForm({ date: "", time: "" });
    fetchData();
    setRescheduleSaving(false);
  };

  // ── Mark complete ─────────────────────────────────────────────────────────

  const handleMarkComplete = async (id: string) => {
    const { error } = await supabase.from("estimate_requests").update({ completed: true }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Marked complete ✓" }); setSelectedBooking(null); fetchData(); }
  };

  // ── Rain day ──────────────────────────────────────────────────────────────

  const handleRainDay = async () => {
    if (!rainForm.fromDate) return;
    setRainSaving(true);
    await supabase.from("reschedule_requests").insert({ day: rainForm.fromDate, reason: rainForm.reason, status: "pending" });
    await supabase.from("calendar_blocks").insert({
      start_at: new Date(rainForm.fromDate + "T00:00:00-04:00").toISOString(),
      end_at: new Date(rainForm.fromDate + "T23:59:59-04:00").toISOString(),
      all_day: true, note: `🌧 Rain Day — ${rainForm.reason}`, block_type: "rain_day",
    });
    toast({ title: "Rain day set ✓", description: `${fmtShortDate(rainForm.fromDate)} is blocked.` });
    setRainModal(false);
    setRainForm({ fromDate: todayStr(), reason: "Rain cancellation — we will reach out to reschedule." });
    fetchData();
    setRainSaving(false);
  };

  // ── Block label helper ────────────────────────────────────────────────────

  const blockLabel = (bl: CalBlock) => {
    if (bl.all_day) return bl.note || "All day";
    const s = new Date(bl.start_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const e = new Date(bl.end_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${s}–${e}${bl.note ? ` · ${bl.note}` : ""}`;
  };

  // ── Month View ────────────────────────────────────────────────────────────

  const MonthView = () => {
    const cells = getMonthCells(anchor);
    const today = todayStr();
    return (
      <div>
        <div className="grid grid-cols-7 mb-1">
          {DAY_ABBR.map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
          {cells.map(({ date, cur }) => {
            const dayBookings = bookingsOnDay(date);
            const blocked = isDayFullyBlocked(date);
            const manualBlocks = manualBlocksOnDay(date);
            const isToday = date === today;
            const isPast = date < today;
            const isBeyondWindow = date > cutoffDate;
            const isSelected = date === selectedDay;

            return (
              <button
                key={date}
                onClick={() => setSelectedDay(isSelected ? null : date)}
                className={[
                  "min-h-[80px] p-1.5 text-left transition-colors relative bg-background hover:bg-muted/50",
                  !cur ? "opacity-25" : "",
                  isPast && cur ? "opacity-55" : "",
                  isBeyondWindow && !isPast ? "bg-muted/30" : "",
                  isSelected ? "ring-2 ring-inset ring-primary" : "",
                  blocked ? "bg-red-50 dark:bg-red-950/20" : "",
                ].join(" ")}
              >
                {/* Date number */}
                <span className={[
                  "text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full",
                  isToday ? "bg-primary text-primary-foreground font-bold" : "text-foreground",
                ].join(" ")}>
                  {parseInt(date.slice(-2))}
                </span>

                {/* Beyond window indicator */}
                {isBeyondWindow && !isPast && cur && (
                  <div className="absolute top-1.5 right-1.5 text-[9px] text-muted-foreground/60">lock</div>
                )}

                {/* Block indicators */}
                {manualBlocks.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    {manualBlocks.slice(0, 2).map(bl => (
                      <div key={bl.id} className={[
                        "text-[9px] truncate rounded px-1 py-0.5 font-medium leading-tight",
                        bl.block_type === "rain_day"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                      ].join(" ")}>
                        {blockLabel(bl)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Booking pills */}
                <div className="mt-0.5 space-y-0.5">
                  {dayBookings.slice(0, 2).map(b => (
                    <div key={b.id} className={[
                      "text-[9px] truncate rounded px-1 py-0.5 font-medium",
                      b.completed ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
                    ].join(" ")}>
                      {b.booking_time?.replace(/ (AM|PM)/, "$1")} {b.name.split(" ")[0]}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-[9px] text-muted-foreground pl-1">+{dayBookings.length - 2} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Week View ─────────────────────────────────────────────────────────────

  const WeekView = () => {
    const days = getWeekDays(anchor);
    const today = todayStr();
    return (
      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-[640px]">
          <div className="grid border-b" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
            <div className="border-r" />
            {days.map((d, i) => {
              const isToday = d === today;
              const isBeyond = d > cutoffDate;
              return (
                <div key={d} className={["py-2 text-center border-r last:border-r-0", isToday ? "bg-primary/5" : "", isBeyond ? "bg-muted/20" : ""].join(" ")}>
                  <div className="text-xs text-muted-foreground">{DAY_ABBR[i]}</div>
                  <div className={["mx-auto mt-0.5 text-sm font-semibold w-7 h-7 rounded-full flex items-center justify-center", isToday ? "bg-primary text-primary-foreground" : ""].join(" ")}>
                    {parseInt(d.slice(-2))}
                  </div>
                  {bookingsOnDay(d).length > 0 && (
                    <div className="text-[10px] text-primary font-medium mt-0.5">
                      {bookingsOnDay(d).length} job{bookingsOnDay(d).length > 1 ? "s" : ""}
                    </div>
                  )}
                  {isBeyond && (
                    <div className="text-[9px] text-muted-foreground/50 mt-0.5">locked</div>
                  )}
                </div>
              );
            })}
          </div>
          {HOURS.map(h => (
            <div key={h} className="grid border-b last:border-b-0" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", minHeight: "52px" }}>
              <div className="border-r flex items-start justify-end pr-2 pt-1">
                <span className="text-[10px] text-muted-foreground">{fmtHour(h)}</span>
              </div>
              {days.map(d => {
                const bForHour = bookingsForHour(d, h);
                const blocked = isHourBlocked(d, h);
                const manualBl = blocks.filter(bl =>
                  bl.block_type !== "booking" && bl.start_at.slice(0, 10) === d &&
                  (bl.all_day || (new Date(bl.start_at).getHours() === h))
                );
                return (
                  <div key={d} className={["border-r last:border-r-0 p-0.5", blocked ? "bg-red-50 dark:bg-red-950/20" : ""].join(" ")}>
                    {bForHour.map(b => {
                      if (parseHour24(b.booking_time || "9:00 AM") !== h) return null;
                      return (
                        <button key={b.id} onClick={() => setSelectedBooking(b)}
                          className={["w-full text-left rounded p-1.5 text-[10px] font-medium leading-tight mb-0.5",
                            b.completed ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary hover:bg-primary/30",
                          ].join(" ")}>
                          <div className="font-semibold truncate">{b.name.split(" ")[0]}</div>
                          <div className="truncate opacity-70">{b.service}</div>
                        </button>
                      );
                    })}
                    {manualBl.map(bl => (
                      bl.all_day || new Date(bl.start_at).getHours() === h ? (
                        <div key={bl.id} className={["text-[9px] rounded p-1 leading-tight truncate font-medium",
                          bl.block_type === "rain_day"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                        ].join(" ")}>
                          {bl.note || "Blocked"}
                        </div>
                      ) : null
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Day Panel ─────────────────────────────────────────────────────────────

  const DayPanel = () => {
    if (!selectedDay) return null;
    const dayBookings = bookingsOnDay(selectedDay);
    const dayManualBlocks = manualBlocksOnDay(selectedDay);
    const isPast = selectedDay < todayStr();

    return (
      <div className="mt-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="font-semibold text-sm">{fmtDate(selectedDay)}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}
              {dayManualBlocks.length > 0 && ` · ${dayManualBlocks.length} block${dayManualBlocks.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isPast && (
              <>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                  onClick={() => { setBlockMultiAnchor(new Date(selectedDay + "T00:00:00")); setBlockSelectedDays([selectedDay]); setBlockModal(true); }}>
                  <Ban className="h-3 w-3" /> Block
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={() => { setRainForm(f => ({ ...f, fromDate: selectedDay })); setRainModal(true); }}>
                  <CloudRain className="h-3 w-3" /> Rain Day
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedDay(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          {dayBookings.length === 0 && dayManualBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No bookings or blocks for this day.</p>
          ) : (
            <div className="space-y-3">
              {dayBookings.map(b => (
                <div key={b.id} className="rounded-lg border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{b.name}</span>
                        {b.completed && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] h-4">Done</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.booking_time} · {b.duration_mins} min</span>
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{fmtMoney(b.total_cents)}</span>
                        <span className="flex items-center gap-1"><Car className="h-3 w-3" />{b.vehicle_size} · {b.service}</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{b.phone}</span>
                        {b.address && <span className="flex items-center gap-1 col-span-2"><MapPin className="h-3 w-3" />{b.address}, {b.city}</span>}
                      </div>
                    </div>
                    {!b.completed && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => { setSelectedBooking(b); setRescheduleForm({ date: b.booking_date, time: "" }); setRescheduleModal(true); }}>
                          <RotateCcw className="h-3 w-3" /> Reschedule
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => handleMarkComplete(b.id)}>
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {dayManualBlocks.map(bl => (
                <div key={bl.id} className={["rounded-lg border p-3 flex items-center justify-between",
                  bl.block_type === "rain_day"
                    ? "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
                    : "border-red-200 bg-red-50 dark:bg-red-950/20",
                ].join(" ")}>
                  <div>
                    <div className="flex items-center gap-2">
                      {bl.block_type === "rain_day"
                        ? <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                        : <Ban className="h-3.5 w-3.5 text-red-500" />}
                      <span className={["text-sm font-semibold", bl.block_type === "rain_day" ? "text-blue-700 dark:text-blue-300" : "text-red-700 dark:text-red-300"].join(" ")}>
                        {bl.all_day ? "All Day" : `${new Date(bl.start_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${new Date(bl.end_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                      </span>
                    </div>
                    {bl.note && (
                      <p className={["text-xs mt-0.5 ml-5", bl.block_type === "rain_day" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"].join(" ")}>
                        {bl.note}
                      </p>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteBlockId(bl.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Title ─────────────────────────────────────────────────────────────────

  const weekDaysForTitle = getWeekDays(anchor);
  const title = view === "month" ? fmtMonthTitle(anchor) : fmtWeekTitle(weekDaysForTitle);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="text-2xl font-bold">{todayBookings}</p>
          <p className="text-xs text-muted-foreground">booking{todayBookings !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">This week</p>
          <p className="text-2xl font-bold">{weekBookings}</p>
          <p className="text-xs text-muted-foreground">booking{weekBookings !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Upcoming revenue</p>
          <p className="text-2xl font-bold">{fmtMoney(upcomingRevenue)}</p>
          <p className="text-xs text-muted-foreground">not yet complete</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToday}>Today</Button>
          <h2 className="text-base font-semibold ml-1">{title}</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <button onClick={() => setView("month")} className={["flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors", view === "month" ? "bg-primary text-primary-foreground" : "hover:bg-muted"].join(" ")}>
              <CalendarRange className="h-3.5 w-3.5" /> Month
            </button>
            <button onClick={() => setView("week")} className={["flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l", view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted"].join(" ")}>
              <CalendarDays className="h-3.5 w-3.5" /> Week
            </button>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => setRainModal(true)}>
            <CloudRain className="h-3.5 w-3.5" /> Rain Day
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => { setBlockSelectedDays([]); setBlockReason(""); setBlockAllDay(false); setBlockStartTime("09:00"); setBlockEndTime("17:00"); setBlockModal(true); }}>
            <Plus className="h-3.5 w-3.5" /> Block Time
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5" /> Settings
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/20" /> Booking</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30" /> Blocked</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30" /> Rain day</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted/50" /> Beyond booking window</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" /> Today</span>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : view === "month" ? <MonthView /> : <WeekView />}

      <DayPanel />

      {/* ── Settings Modal ───────────────────────────────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings className="h-4 w-4" /> Calendar Settings</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Booking window</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">How far ahead customers can book</p>
              <div className="grid grid-cols-2 gap-2">
                {WINDOW_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => saveBookingWindow(opt.value)} disabled={savingWindow}
                    className={["rounded-lg border p-3 text-sm font-medium transition-colors text-left",
                      bookingWindowDays === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50",
                    ].join(" ")}>
                    {opt.label}
                    {bookingWindowDays === opt.value && (
                      <span className="block text-[10px] text-primary/70 mt-0.5">Current</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Cutoff date: <span className="font-medium text-foreground">{fmtShortDate(cutoffDate)}</span>
                &nbsp;— days beyond this are greyed out on the calendar.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ⚠ You also need to enforce this in your <code className="text-xs bg-muted px-1 rounded">Estimate.tsx</code> date picker — set the <code className="text-xs bg-muted px-1 rounded">max</code> attribute on the date input to the cutoff date (read from Supabase on load).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSettingsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Multi-Day Block Modal ─────────────────────────────────────────── */}
      <Dialog open={blockModal} onOpenChange={setBlockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Block Time</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Reason first — most important */}
            <div>
              <Label className="text-xs mb-1 block">Reason / Name *</Label>
              <Input placeholder="e.g. School, Personal, Vacation" value={blockReason}
                onChange={e => setBlockReason(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">This shows on the calendar instead of just "Blocked"</p>
            </div>

            {/* All day toggle */}
            <div className="flex items-center gap-2">
              <Switch checked={blockAllDay} onCheckedChange={setBlockAllDay} />
              <Label className="text-sm">All day</Label>
            </div>

            {/* Time range */}
            {!blockAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">From</Label>
                  <Input type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">{fmt12(blockStartTime)}</p>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Until</Label>
                  <Input type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">{fmt12(blockEndTime)}</p>
                </div>
              </div>
            )}

            {/* Multi-day picker */}
            <div>
              <Label className="text-xs mb-2 block">
                Select days
                {blockSelectedDays.length > 0 && (
                  <span className="ml-2 text-primary font-medium">{blockSelectedDays.length} selected</span>
                )}
              </Label>

              {/* Mini calendar nav */}
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setBlockMultiAnchor(a => { const d = new Date(a); d.setMonth(d.getMonth() - 1); return d; })}
                  className="p-1 rounded hover:bg-muted"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <span className="text-xs font-medium">{fmtMonthTitle(blockMultiAnchor)}</span>
                <button onClick={() => setBlockMultiAnchor(a => { const d = new Date(a); d.setMonth(d.getMonth() + 1); return d; })}
                  className="p-1 rounded hover:bg-muted"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>

              {/* Day abbr header */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_ABBR.map(d => (
                  <div key={d} className="text-center text-[9px] font-medium text-muted-foreground py-0.5">{d[0]}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {blockMonthCells.map(({ date, cur }) => {
                  const selected = blockSelectedDays.includes(date);
                  const isPast = date < todayStr();
                  return (
                    <button key={date} disabled={!cur || isPast}
                      onClick={() => toggleBlockDay(date)}
                      className={[
                        "aspect-square rounded text-xs font-medium transition-colors",
                        !cur ? "opacity-0 pointer-events-none" : "",
                        isPast ? "opacity-25 cursor-not-allowed" : "",
                        selected ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground",
                      ].join(" ")}>
                      {cur ? parseInt(date.slice(-2)) : ""}
                    </button>
                  );
                })}
              </div>

              {/* Selected days list */}
              {blockSelectedDays.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {blockSelectedDays.map(d => (
                    <span key={d} className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5">
                      {fmtShortDate(d)}
                      <button onClick={() => toggleBlockDay(d)} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {blockSelectedDays.length > 0 && blockReason && (
              <div className="rounded-lg bg-muted p-2.5 text-xs">
                <p className="font-medium mb-0.5">Preview on calendar:</p>
                <p className="text-muted-foreground">
                  {blockAllDay ? "All day" : `${fmt12(blockStartTime)} – ${fmt12(blockEndTime)}`} · {blockReason}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {blockSelectedDays.length} day{blockSelectedDays.length > 1 ? "s" : ""}:{" "}
                  {blockSelectedDays.map(fmtShortDate).join(", ")}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockModal(false)}>Cancel</Button>
            <Button onClick={handleMultiBlockSave} disabled={blockSaving || !blockSelectedDays.length || !blockReason.trim()}>
              {blockSaving ? "Blocking…" : `Block ${blockSelectedDays.length || ""} Day${blockSelectedDays.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reschedule Modal ──────────────────────────────────────────────── */}
      <Dialog open={rescheduleModal} onOpenChange={setRescheduleModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reschedule — {selectedBooking?.name}</DialogTitle></DialogHeader>
          {selectedBooking && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground bg-muted rounded p-2">
                Currently: {selectedBooking.booking_date} at {selectedBooking.booking_time}
              </div>
              <div>
                <Label className="text-xs mb-1 block">New Date</Label>
                <Input type="date" value={rescheduleForm.date} min={todayStr()}
                  onChange={e => setRescheduleForm({ ...rescheduleForm, date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">New Time</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"].map(t => (
                    <button key={t} onClick={() => setRescheduleForm({ ...rescheduleForm, time: t })}
                      className={["rounded border px-2 py-1.5 text-xs transition-colors",
                        rescheduleForm.time === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50",
                      ].join(" ")}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRescheduleModal(false); setSelectedBooking(null); }}>Cancel</Button>
            <Button onClick={handleRescheduleBooking} disabled={rescheduleSaving || !rescheduleForm.date || !rescheduleForm.time}>
              {rescheduleSaving ? "Saving…" : "Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rain Day Modal ────────────────────────────────────────────────── */}
      <Dialog open={rainModal} onOpenChange={setRainModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CloudRain className="h-4 w-4 text-blue-500" /> Rain Day</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Blocks the entire day and logs a reschedule request.</p>
            <div>
              <Label className="text-xs mb-1 block">Day to cancel</Label>
              <Input type="date" value={rainForm.fromDate} onChange={e => setRainForm({ ...rainForm, fromDate: e.target.value })} />
            </div>
            {rainForm.fromDate && bookingsOnDay(rainForm.fromDate).length > 0 && (
              <div className="rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 p-2 text-xs text-orange-700 dark:text-orange-300">
                ⚠ {bookingsOnDay(rainForm.fromDate).length} booking{bookingsOnDay(rainForm.fromDate).length > 1 ? "s" : ""} need rescheduling.
              </div>
            )}
            <div>
              <Label className="text-xs mb-1 block">Message / Reason</Label>
              <Textarea value={rainForm.reason} onChange={e => setRainForm({ ...rainForm, reason: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRainModal(false)}>Cancel</Button>
            <Button onClick={handleRainDay} disabled={rainSaving || !rainForm.fromDate} className="bg-blue-600 hover:bg-blue-700 text-white">
              {rainSaving ? "Setting…" : "Set Rain Day"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Booking Detail Modal ──────────────────────────────────────────── */}
      <Dialog open={!!selectedBooking && !rescheduleModal} onOpenChange={o => { if (!o) setSelectedBooking(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedBooking?.name}</DialogTitle></DialogHeader>
          {selectedBooking && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Date" value={`${selectedBooking.booking_date} at ${selectedBooking.booking_time}`} />
                <Detail label="Duration" value={`${selectedBooking.duration_mins} min`} />
                <Detail label="Service" value={selectedBooking.service} />
                <Detail label="Vehicle" value={selectedBooking.vehicle_size} />
                <Detail label="Total" value={fmtMoney(selectedBooking.total_cents)} />
                <Detail label="Phone" value={selectedBooking.phone} />
                <Detail label="Email" value={selectedBooking.email} />
                {selectedBooking.address && <Detail label="Address" value={`${selectedBooking.address}, ${selectedBooking.city}`} />}
              </div>
              {!selectedBooking.completed && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" variant="outline"
                    onClick={() => { setRescheduleForm({ date: selectedBooking.booking_date, time: "" }); setRescheduleModal(true); }}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reschedule
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleMarkComplete(selectedBooking.id)}>
                    <CalendarCheck className="mr-2 h-4 w-4" /> Mark Done
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Block Confirm ──────────────────────────────────────────── */}
      <Dialog open={!!deleteBlockId} onOpenChange={() => setDeleteBlockId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Block?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will unblock that time slot.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBlockId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteBlock}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="font-medium text-sm">{value || "—"}</p>
  </div>
);

export default CalendarPage;