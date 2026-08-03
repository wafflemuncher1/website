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
  CalendarClock,
  Lock,
  Unlock,
  Sparkles,
  Copy,
  AlertTriangle,
  Loader2,
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

// ─── Scheduling / availability engine ─────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────

type DayHours = { enabled: boolean; start?: string; end?: string }; // start/end = "HH:MM" 24h
type WeeklySchedule = Record<string, DayHours>; // key "0"..."6", 0 = Sunday

type ScheduleOverride = {
  id?: string;
  date: string; // YYYY-MM-DD
  status: "closed" | "open" | "custom";
  start_time?: string | null;
  end_time?: string | null;
  note?: string | null;
};

type BusyBooking = {
  id: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // "9:00 AM"
  duration_mins: number;
};

type BusyBlock = {
  id: string;
  start_at: string; // ISO
  end_at: string;   // ISO
  all_day: boolean;
  block_type: string; // 'manual' | 'rain_day' | 'booking'
};

type EffectiveDayHours =
  | { working: false }
  | { working: true; start: string; end: string; source: "override" | "weekly" };

type AvailabilityContext = {
  weeklySchedule: WeeklySchedule;
  overrides: Map<string, ScheduleOverride>;
  bookings: BusyBooking[];
  blocks: BusyBlock[];
  bookingWindowDays: number;
  slotIntervalMins: number;
};

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  "0": { enabled: false },
  "1": { enabled: true, start: "08:00", end: "18:00" },
  "2": { enabled: true, start: "08:00", end: "18:00" },
  "3": { enabled: true, start: "08:00", end: "18:00" },
  "4": { enabled: true, start: "08:00", end: "18:00" },
  "5": { enabled: true, start: "08:00", end: "18:00" },
  "6": { enabled: false },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─── Small time helpers (all local, no timezone libs needed) ──────────────

// Safe LOCAL-timezone y-m-d string (unlike the page's own `ymd`, which uses
// toISOString() / UTC — that's fine for the existing month/week grid math, but
// would silently shift dates near midnight, so the scheduling engine below
// uses this instead for anything doing date-string arithmetic).
const localYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDaysStr = (dateStr: string, n: number) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return localYmd(d);
};

const dayOfWeek = (dateStr: string) => new Date(dateStr + "T00:00:00").getDay(); // 0-6

// "HH:MM" -> minutes since midnight
const hhmmToMins = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const minsToHHMM = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const minsTo12 = (totalMins: number) => {
  let h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ap = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
};

// ─── Fetching settings ──────────────────────────────────────────────────

const fetchWeeklySchedule = async (): Promise<WeeklySchedule> => {
  const { data } = await supabase.from("admin_settings").select("value").eq("key", "weekly_schedule").single();
  if (!data?.value) return DEFAULT_WEEKLY_SCHEDULE;
  try {
    return { ...DEFAULT_WEEKLY_SCHEDULE, ...JSON.parse(data.value) };
  } catch {
    return DEFAULT_WEEKLY_SCHEDULE;
  }
};

const saveWeeklySchedule = async (schedule: WeeklySchedule) => {
  return supabase.from("admin_settings").upsert({
    key: "weekly_schedule",
    value: JSON.stringify(schedule),
    updated_at: new Date().toISOString(),
  });
};

const fetchSlotIntervalMins = async (): Promise<number> => {
  const { data } = await supabase.from("admin_settings").select("value").eq("key", "slot_interval_mins").single();
  return parseInt(data?.value || "30") || 30;
};

const fetchOverridesInRange = async (from: string, to: string): Promise<Map<string, ScheduleOverride>> => {
  const { data } = await supabase.from("schedule_overrides").select("*").gte("date", from).lte("date", to);
  const map = new Map<string, ScheduleOverride>();
  (data || []).forEach((row: ScheduleOverride) => map.set(row.date, row));
  return map;
};

const upsertOverride = async (override: ScheduleOverride) => {
  return supabase.from("schedule_overrides").upsert(override, { onConflict: "date" });
};

const deleteOverride = async (date: string) => {
  return supabase.from("schedule_overrides").delete().eq("date", date);
};

/** Loads everything needed to compute availability across a date range in one shot. */
const fetchAvailabilityContext = async (from: string, to: string): Promise<AvailabilityContext> => {
  const [weeklySchedule, overrides, slotIntervalMins, bRes, cbRes, winRes] = await Promise.all([
    fetchWeeklySchedule(),
    fetchOverridesInRange(from, to),
    fetchSlotIntervalMins(),
    supabase
      .from("estimate_requests")
      .select("id,booking_date,booking_time,duration_mins")
      .not("booking_date", "is", null)
      .gte("booking_date", from)
      .lte("booking_date", to),
    supabase
      .from("calendar_blocks")
      .select("id,start_at,end_at,all_day,block_type")
      .gte("start_at", from + "T00:00:00")
      .lte("start_at", to + "T23:59:59"),
    supabase.from("admin_settings").select("value").eq("key", "booking_window_days").single(),
  ]);

  return {
    weeklySchedule,
    overrides,
    bookings: (bRes.data || []) as BusyBooking[],
    blocks: (cbRes.data || []) as BusyBlock[],
    bookingWindowDays: parseInt(winRes.data?.value || "30") || 30,
    slotIntervalMins,
  };
};

// ─── Core availability logic ───────────────────────────────────────────

/** What hours (if any) you're bookable on a given date, after applying overrides on top of the weekly pattern. */
const getEffectiveHours = (
  date: string,
  weeklySchedule: WeeklySchedule,
  overrides: Map<string, ScheduleOverride>
): EffectiveDayHours => {
  const override = overrides.get(date);
  if (override) {
    if (override.status === "closed") return { working: false };
    if (override.status === "open" || override.status === "custom") {
      const dow = weeklySchedule[String(dayOfWeek(date))];
      const start = override.start_time || dow?.start || "08:00";
      const end = override.end_time || dow?.end || "18:00";
      return { working: true, start, end, source: "override" };
    }
  }
  const dow = weeklySchedule[String(dayOfWeek(date))];
  if (!dow || !dow.enabled) return { working: false };
  return { working: true, start: dow.start || "08:00", end: dow.end || "18:00", source: "weekly" };
};

const isWithinBookingWindow = (date: string, windowDays: number, from: string = localYmd(new Date())) => {
  return date >= from && date <= addDaysStr(from, windowDays);
};

/** Busy [startMin,endMin) intervals for a date, from real bookings + manual/rain blocks (not the shadow "booking" blocks, to avoid double counting). */
const getBusyIntervals = (
  date: string,
  bookings: BusyBooking[],
  blocks: BusyBlock[]
): { start: number; end: number }[] => {
  const intervals: { start: number; end: number }[] = [];

  bookings
    .filter((b) => b.booking_date === date)
    .forEach((b) => {
      const start = time12ToMins(b.booking_time || "9:00 AM");
      intervals.push({ start, end: start + (b.duration_mins || 120) });
    });

  blocks
    .filter((bl) => bl.block_type !== "booking" && bl.start_at.slice(0, 10) === date)
    .forEach((bl) => {
      if (bl.all_day) {
        intervals.push({ start: 0, end: 24 * 60 });
      } else {
        const s = new Date(bl.start_at);
        const e = new Date(bl.end_at);
        intervals.push({ start: s.getHours() * 60 + s.getMinutes(), end: e.getHours() * 60 + e.getMinutes() });
      }
    });

  return intervals;
};

/** All open start times (24h "HH:MM") on a date that can fit a job of durationMins, respecting working hours + existing busy time. */
const getAvailableSlots = (
  date: string,
  durationMins: number,
  ctx: AvailabilityContext
): string[] => {
  const hours = getEffectiveHours(date, ctx.weeklySchedule, ctx.overrides);
  if (!hours.working) return [];

  const dayStart = hhmmToMins(hours.start);
  const dayEnd = hhmmToMins(hours.end);
  const busy = getBusyIntervals(date, ctx.bookings, ctx.blocks);
  const interval = ctx.slotIntervalMins || 30;

  const slots: string[] = [];
  for (let t = dayStart; t + durationMins <= dayEnd; t += interval) {
    const overlaps = busy.some((b) => t < b.end && t + durationMins > b.start);
    if (!overlaps) slots.push(minsToHHMM(t));
  }
  return slots;
};

/**
 * Walk forward day by day (starting the day after `afterDate`, or today if omitted)
 * and return the first open date+time that fits `durationMins`. Returns null if
 * nothing found within the booking window (+7 day grace buffer).
 */
const findNextAvailableSlot = (
  durationMins: number,
  ctx: AvailabilityContext,
  afterDate?: string
): { date: string; time: string } | null => {
  const start = afterDate ? addDaysStr(afterDate, 1) : localYmd(new Date());
  const searchLimit = addDaysStr(localYmd(new Date()), ctx.bookingWindowDays + 7);

  let cursor = start;
  while (cursor <= searchLimit) {
    if (isWithinBookingWindow(cursor, ctx.bookingWindowDays + 7)) {
      const slots = getAvailableSlots(cursor, durationMins, ctx);
      if (slots.length > 0) return { date: cursor, time: minsTo12(hhmmToMins(slots[0])) };
    }
    cursor = addDaysStr(cursor, 1);
  }
  return null;
};

/** Moves a booking to a new date/time: updates the row, re-syncs its calendar_blocks
 *  shadow entry, and optionally texts the customer via your existing send-sms edge function. */
const rescheduleBookingRecord = async (
  booking: { id: string; name?: string; phone?: string; service?: string; duration_mins: number },
  newDate: string,
  newTime: string, // "9:00 AM"
  opts?: { notifyCustomer?: boolean }
) => {
  const { error: bErr } = await supabase
    .from("estimate_requests")
    .update({ booking_date: newDate, booking_time: newTime })
    .eq("id", booking.id);
  if (bErr) return { error: bErr };

  await supabase.from("calendar_blocks").delete().eq("estimate_request_id", booking.id);

  const startMin = time12ToMins(newTime);
  const h = Math.floor(startMin / 60);
  const m = startMin % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const newStart = new Date(`${newDate}T${pad(h)}:${pad(m)}:00-04:00`).toISOString();
  const newEnd = new Date(new Date(newStart).getTime() + (booking.duration_mins || 120) * 60000).toISOString();

  await supabase.from("calendar_blocks").insert({
    start_at: newStart,
    end_at: newEnd,
    all_day: false,
    note: `Booking: ${booking.name ?? ""} — ${booking.service ?? ""}`.trim(),
    estimate_request_id: booking.id,
    block_type: "booking",
  });

  if (opts?.notifyCustomer && booking.phone) {
    try {
      await supabase.functions.invoke("send-sms", {
        body: {
          to: booking.phone,
          message: `Hi ${booking.name ?? ""}, your Glossworks appointment has been moved to ${newDate} at ${newTime}. Reply with questions!`,
        },
      });
    } catch {
      // non-blocking — an SMS failure shouldn't block the reschedule itself
    }
  }

  return { error: null };
};

/** Which bookings fall inside a proposed block window (used to warn/auto-reschedule before saving a block). */
const getBookingsInWindow = <T extends BusyBooking>(
  bookings: T[],
  startAt: string, // ISO
  endAt: string,   // ISO
  allDay: boolean
): T[] => {
  const startDate = startAt.slice(0, 10);
  const endDate = endAt.slice(0, 10);
  const startMin = allDay ? 0 : new Date(startAt).getHours() * 60 + new Date(startAt).getMinutes();
  const endMin = allDay ? 24 * 60 : new Date(endAt).getHours() * 60 + new Date(endAt).getMinutes();

  return bookings.filter((b) => {
    if (b.booking_date < startDate || b.booking_date > endDate) return false;
    if (allDay) return true;
    if (b.booking_date !== startDate && b.booking_date !== endDate) return true; // multi-day block, middle days always hit
    const bStart = time12ToMins(b.booking_time || "9:00 AM");
    const bEnd = bStart + (b.duration_mins || 120);
    return bStart < endMin && bEnd > startMin;
  });
};

// ─── Weekly Schedule dialog (work days + bookable hours) ──────────────────────

type WeeklyScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

type ConflictRow = {
  id: string;
  name: string;
  phone: string;
  service: string;
  duration_mins: number;
  booking_date: string;
  booking_time: string;
  resolution: { date: string; time: string } | null;
};

const WeeklyScheduleDialog = ({ open, onOpenChange, onSaved }: WeeklyScheduleDialogProps) => {
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_WEEKLY_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictRow[] | null>(null);
  const [notifyOnMove, setNotifyOnMove] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setConflicts(null);
    setLoading(true);
    fetchWeeklySchedule().then((s) => {
      setSchedule(s);
      setLoading(false);
    });
  }, [open]);

  const toggleDay = (dow: string, enabled: boolean) => {
    setSchedule((s) => ({
      ...s,
      [dow]: { ...s[dow], enabled, start: s[dow]?.start || "08:00", end: s[dow]?.end || "18:00" },
    }));
  };

  const setDayTime = (dow: string, field: "start" | "end", value: string) => {
    setSchedule((s) => ({ ...s, [dow]: { ...s[dow], [field]: value } }));
  };

  const copyMondayToAll = () => {
    const mon = schedule["1"];
    if (!mon) return;
    setSchedule((s) => {
      const next = { ...s };
      Object.keys(next).forEach((dow) => {
        if (next[dow].enabled) next[dow] = { ...next[dow], start: mon.start, end: mon.end };
      });
      return next;
    });
    toast({ title: "Monday's hours copied to every enabled day" });
  };

  // Scan upcoming bookings against the *pending* schedule (not yet saved) and
  // find any that would no longer fit — either the day got turned off, or
  // the hours no longer cover their slot.
  const checkConflicts = async () => {
    setChecking(true);
    setConflicts(null);
    const today = todayStr();
    const to = addDaysStr(today, 120); // generous look-ahead regardless of booking window

    const ctx = await fetchAvailabilityContext(today, to);
    ctx.weeklySchedule = schedule; // use the *pending* edits, not what's saved yet

    const { data: bookingRows } = await supabase
      .from("estimate_requests")
      .select("id,name,phone,service,duration_mins,booking_date,booking_time")
      .not("booking_date", "is", null)
      .gte("booking_date", today)
      .lte("booking_date", to);

    const rows: ConflictRow[] = [];

    (bookingRows || []).forEach((b: any) => {
      const hours = getEffectiveHours(b.booking_date, schedule, ctx.overrides);
      let conflicted = false;

      if (!hours.working) {
        conflicted = true;
      } else {
        const dayStart = hhmmToMins(hours.start);
        const dayEnd = hhmmToMins(hours.end);
        const bStartMin = (() => {
          const m = b.booking_time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
          if (!m) return dayStart;
          let h = parseInt(m[1]);
          const mins = parseInt(m[2]);
          const ap = m[3].toUpperCase();
          if (ap === "PM" && h !== 12) h += 12;
          if (ap === "AM" && h === 12) h = 0;
          return h * 60 + mins;
        })();
        const bEndMin = bStartMin + (b.duration_mins || 120);
        if (bStartMin < dayStart || bEndMin > dayEnd) conflicted = true;
      }

      if (conflicted) {
        const resolution = findNextAvailableSlot(b.duration_mins || 120, ctx, b.booking_date);
        rows.push({ ...b, resolution });
      }
    });

    setConflicts(rows);
    setChecking(false);
    if (rows.length === 0) {
      toast({ title: "No conflicts — every upcoming booking still fits ✓" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await saveWeeklySchedule(schedule);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    toast({ title: "Weekly schedule saved ✓" });
    onSaved();

    if (conflicts && conflicts.length > 0) {
      let moved = 0;
      for (const c of conflicts) {
        if (!c.resolution) continue;
        const { error: rErr } = await rescheduleBookingRecord(
          { id: c.id, name: c.name, phone: c.phone, service: c.service, duration_mins: c.duration_mins },
          c.resolution.date,
          c.resolution.time,
          { notifyCustomer: notifyOnMove }
        );
        if (!rErr) moved++;
      }
      toast({ title: `${moved} booking${moved !== 1 ? "s" : ""} auto-rescheduled to fit the new hours` });
      onSaved();
    }

    setSaving(false);
    onOpenChange(false);
  };

  const unresolvedCount = (conflicts || []).filter((c) => !c.resolution).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Weekly Work Schedule
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Days you're off are automatically closed to booking. Set your bookable hours per day (e.g. 2 AM–2 PM).
              </p>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 shrink-0" onClick={copyMondayToAll}>
                <Copy className="h-3 w-3" /> Copy Mon to all
              </Button>
            </div>

            <div className="space-y-2">
              {DAY_NAMES.map((name, i) => {
                const dow = String(i);
                const day = schedule[dow] || { enabled: false };
                return (
                  <div key={dow} className={["rounded-lg border p-2.5", day.enabled ? "bg-card" : "bg-muted/40"].join(" ")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch checked={day.enabled} onCheckedChange={(v) => toggleDay(dow, v)} />
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                      {!day.enabled && <span className="text-xs text-muted-foreground">Off</span>}
                    </div>
                    {day.enabled && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">From</Label>
                          <Input
                            type="time"
                            value={day.start || "08:00"}
                            onChange={(e) => setDayTime(dow, "start", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Until</Label>
                          <Input
                            type="time"
                            value={day.end || "18:00"}
                            onChange={(e) => setDayTime(dow, "end", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Check for conflicts</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={checkConflicts} disabled={checking}>
                  {checking ? "Checking…" : "Scan upcoming bookings"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Looks at bookings in the next 120 days and flags any that no longer fit this schedule.
              </p>

              {conflicts && conflicts.length > 0 && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {conflicts.length} booking{conflicts.length !== 1 ? "s" : ""} need to move
                  </div>
                  {conflicts.map((c) => (
                    <div key={c.id} className="text-xs rounded bg-muted p-2">
                      <span className="font-medium">{c.name}</span> — {c.booking_date} at {c.booking_time}
                      <br />
                      {c.resolution ? (
                        <span className="text-primary">
                          → moving to {c.resolution.date} at {c.resolution.time}
                        </span>
                      ) : (
                        <span className="text-destructive">→ no open slot found, needs manual handling</span>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={notifyOnMove} onCheckedChange={setNotifyOnMove} id="notifyMove" />
                    <Label htmlFor="notifyMove" className="text-xs">
                      Text customers when they're auto-moved
                    </Label>
                  </div>
                  {unresolvedCount > 0 && (
                    <p className="text-xs text-destructive">
                      {unresolvedCount} of these couldn't be auto-placed — you'll need to reschedule manually from the
                      Bookings page after saving.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving
              ? "Saving…"
              : conflicts && conflicts.length > 0
              ? `Save & Reschedule ${conflicts.filter((c) => c.resolution).length}`
              : "Save Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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

  // ── Weekly schedule + per-date overrides ─────────────────────────────────
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [overrides, setOverrides] = useState<Map<string, ScheduleOverride>>(new Map());
  const [weeklyScheduleOpen, setWeeklyScheduleOpen] = useState(false);
  const [overrideSaving, setOverrideSaving] = useState(false);

  // ── Block modal (multi-day) ──────────────────────────────────────────────
  const [blockModal, setBlockModal] = useState(false);
  const [blockSelectedDays, setBlockSelectedDays] = useState<string[]>([]);
  const [blockMultiAnchor, setBlockMultiAnchor] = useState(new Date());
  const [blockAllDay, setBlockAllDay] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState("09:00");
  const [blockEndTime, setBlockEndTime] = useState("17:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockNotify, setBlockNotify] = useState(true);
  const [blockAffectedCount, setBlockAffectedCount] = useState(0);

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
  const [rainNotify, setRainNotify] = useState(true);

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
    const [bRes, cbRes, settRes, weekly, overridesMap] = await Promise.all([
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
      fetchWeeklySchedule(),
      fetchOverridesInRange(from, to),
    ]);
    if (bRes.data) setBookings(bRes.data as Booking[]);
    if (cbRes.data) setBlocks(cbRes.data as CalBlock[]);
    if (settRes.data) setBookingWindowDays(parseInt(settRes.data.value) || 30);
    setWeeklySchedule(weekly);
    setOverrides(overridesMap);
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

  // Is this a normal "day off" per the weekly work schedule (and no override opening it)?
  const dayHours = (d: string) => (weeklySchedule ? getEffectiveHours(d, weeklySchedule, overrides) : { working: true, start: "08:00", end: "18:00", source: "weekly" as const });
  const isWorkDayOff = (d: string) => !dayHours(d).working;
  const hasOverride = (d: string) => overrides.has(d);

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

  // Live preview of how many bookings a pending block would touch
  useEffect(() => {
    if (!blockModal || blockSelectedDays.length === 0) {
      setBlockAffectedCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("estimate_requests")
        .select("id,booking_time,duration_mins,booking_date")
        .not("booking_date", "is", null)
        .in("booking_date", blockSelectedDays);
      if (cancelled || !data) return;
      const winStart = blockAllDay ? 0 : hhmmToMins(blockStartTime);
      const winEnd = blockAllDay ? 24 * 60 : hhmmToMins(blockEndTime);
      const count = data.filter((b: any) => {
        if (blockAllDay) return true;
        const bStart = time12ToMins(b.booking_time || "9:00 AM");
        const bEnd = bStart + (b.duration_mins || 120);
        return bStart < winEnd && bEnd > winStart;
      }).length;
      setBlockAffectedCount(count);
    })();
    return () => { cancelled = true; };
  }, [blockModal, blockSelectedDays, blockAllDay, blockStartTime, blockEndTime]);

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

  // ── Save multi-day block (with auto-reschedule) ───────────────────────────

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

    // Figure out which bookings this block will collide with, BEFORE inserting.
    const { data: candidateRows } = await supabase
      .from("estimate_requests")
      .select("id,name,phone,service,duration_mins,booking_date,booking_time")
      .not("booking_date", "is", null)
      .in("booking_date", blockSelectedDays);

    const winStart = blockAllDay ? 0 : hhmmToMins(blockStartTime);
    const winEnd = blockAllDay ? 24 * 60 : hhmmToMins(blockEndTime);
    const toReschedule = (candidateRows || []).filter((b: any) => {
      if (blockAllDay) return true;
      const bStart = time12ToMins(b.booking_time || "9:00 AM");
      const bEnd = bStart + (b.duration_mins || 120);
      return bStart < winEnd && bEnd > winStart;
    });

    const { error } = await supabase.from("calendar_blocks").insert(inserts);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setBlockSaving(false);
      return;
    }

    let movedCount = 0;
    let unresolvedCount = 0;
    if (toReschedule.length) {
      const today = todayStr();
      const ctx = await fetchAvailabilityContext(today, addDaysStr(today, bookingWindowDays + 37));
      for (const b of toReschedule as any[]) {
        const slot = findNextAvailableSlot(b.duration_mins || 120, ctx, b.booking_date);
        if (slot) {
          await rescheduleBookingRecord(b, slot.date, slot.time, { notifyCustomer: blockNotify });
          movedCount++;
        } else {
          unresolvedCount++;
        }
      }
    }

    toast({
      title: `${blockSelectedDays.length} day${blockSelectedDays.length > 1 ? "s" : ""} blocked ✓`,
      description: movedCount
        ? `${movedCount} booking${movedCount > 1 ? "s" : ""} auto-rescheduled${unresolvedCount ? `, ${unresolvedCount} need manual attention` : ""}.`
        : undefined,
    });
    setBlockModal(false);
    setBlockSelectedDays([]);
    setBlockReason("");
    setBlockAllDay(false);
    setBlockStartTime("09:00");
    setBlockEndTime("17:00");
    fetchData();
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

  // ── Reschedule booking (manual, from the UI) ──────────────────────────────

  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !rescheduleForm.date || !rescheduleForm.time) return;
    setRescheduleSaving(true);
    const { error } = await rescheduleBookingRecord(selectedBooking, rescheduleForm.date, rescheduleForm.time, { notifyCustomer: false });
    if (error) { toast({ title: "Error", description: (error as any).message, variant: "destructive" }); setRescheduleSaving(false); return; }

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

  // ── Rain day (with auto-reschedule) ───────────────────────────────────────

  const handleRainDay = async () => {
    if (!rainForm.fromDate) return;
    setRainSaving(true);

    const affected = bookingsOnDay(rainForm.fromDate);

    await supabase.from("reschedule_requests").insert({ day: rainForm.fromDate, reason: rainForm.reason, status: "pending" });
    await supabase.from("calendar_blocks").insert({
      start_at: new Date(rainForm.fromDate + "T00:00:00-04:00").toISOString(),
      end_at: new Date(rainForm.fromDate + "T23:59:59-04:00").toISOString(),
      all_day: true, note: `🌧 Rain Day — ${rainForm.reason}`, block_type: "rain_day",
    });

    let movedCount = 0;
    if (affected.length) {
      const today = todayStr();
      const ctx = await fetchAvailabilityContext(today, addDaysStr(today, bookingWindowDays + 37));
      for (const b of affected) {
        const slot = findNextAvailableSlot(b.duration_mins || 120, ctx, b.booking_date);
        if (slot) {
          await rescheduleBookingRecord(b, slot.date, slot.time, { notifyCustomer: rainNotify });
          movedCount++;
        }
      }
    }

    toast({
      title: "Rain day set ✓",
      description: `${fmtShortDate(rainForm.fromDate)} is blocked.${movedCount ? ` ${movedCount} booking${movedCount > 1 ? "s" : ""} auto-rescheduled.` : ""}`,
    });
    setRainModal(false);
    setRainForm({ fromDate: todayStr(), reason: "Rain cancellation — we will reach out to reschedule." });
    fetchData();
    setRainSaving(false);
  };

  // ── Per-date schedule overrides (open a normally-off day / custom hours) ──

  const openDayOverride = async (date: string) => {
    setOverrideSaving(true);
    const { error } = await upsertOverride({ date, status: "open", note: "Opened manually from calendar" });
    if (error) toast({ title: "Error", description: (error as any).message, variant: "destructive" });
    else toast({ title: `${fmtShortDate(date)} opened for booking ✓` });
    fetchData();
    setOverrideSaving(false);
  };

  const removeDayOverride = async (date: string) => {
    setOverrideSaving(true);
    const { error } = await deleteOverride(date);
    if (error) toast({ title: "Error", description: (error as any).message, variant: "destructive" });
    else toast({ title: "Override removed — back to your normal weekly schedule" });
    fetchData();
    setOverrideSaving(false);
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
            const off = cur && !isPast && !blocked && isWorkDayOff(date);
            const overridden = hasOverride(date);

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
                  off ? "bg-slate-100 dark:bg-slate-900/40" : "",
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
                  <div className="absolute top-1.5 right-1.5 text-muted-foreground/60"><Lock className="h-2.5 w-2.5" /></div>
                )}

                {/* Off-day indicator (weekly schedule, no override) */}
                {off && !isBeyondWindow && (
                  <div className="mt-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400">Off</div>
                )}
                {overridden && cur && !isPast && (
                  <div className="absolute top-1.5 right-1.5 text-amber-500"><Sparkles className="h-2.5 w-2.5" /></div>
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
              const off = d >= today && !isDayFullyBlocked(d) && isWorkDayOff(d);
              return (
                <div key={d} className={["py-2 text-center border-r last:border-r-0", isToday ? "bg-primary/5" : "", isBeyond ? "bg-muted/20" : "", off ? "bg-slate-100 dark:bg-slate-900/40" : ""].join(" ")}>
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
                  {off && !isBeyond && (
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Off</div>
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
                const hrs = dayHours(d);
                const outsideHours = hrs.working && (h < Math.floor(hhmmToMins(hrs.start) / 60) || h >= Math.ceil(hhmmToMins(hrs.end) / 60));
                const off = !hrs.working;
                const manualBl = blocks.filter(bl =>
                  bl.block_type !== "booking" && bl.start_at.slice(0, 10) === d &&
                  (bl.all_day || (new Date(bl.start_at).getHours() === h))
                );
                return (
                  <div key={d} className={[
                    "border-r last:border-r-0 p-0.5",
                    blocked ? "bg-red-50 dark:bg-red-950/20" : "",
                    (off || outsideHours) && !blocked ? "bg-slate-50 dark:bg-slate-900/30" : "",
                  ].join(" ")}>
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
    const hrs = dayHours(selectedDay);
    const override = overrides.get(selectedDay);

    return (
      <div className="mt-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="font-semibold text-sm">{fmtDate(selectedDay)}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}
              {dayManualBlocks.length > 0 && ` · ${dayManualBlocks.length} block${dayManualBlocks.length > 1 ? "s" : ""}`}
            </p>
            <p className="text-xs mt-1 flex items-center gap-1.5">
              {hrs.working ? (
                <span className="text-foreground font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {fmt12(hrs.start)} – {fmt12(hrs.end)}
                </span>
              ) : (
                <span className="text-slate-500 font-medium flex items-center gap-1"><Lock className="h-3 w-3" /> Not a work day</span>
              )}
              {override && (
                <Badge variant="outline" className="text-[9px] h-4 border-amber-300 text-amber-600">override</Badge>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isPast && (
              <>
                {!hrs.working && !override && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-amber-200 text-amber-700 hover:bg-amber-50" disabled={overrideSaving}
                    onClick={() => openDayOverride(selectedDay)}>
                    <Unlock className="h-3 w-3" /> Open this day
                  </Button>
                )}
                {override && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={overrideSaving}
                    onClick={() => removeDayOverride(selectedDay)}>
                    <X className="h-3 w-3" /> Remove override
                  </Button>
                )}
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
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setWeeklyScheduleOpen(true)}>
            <CalendarClock className="h-3.5 w-3.5" /> Work Hours
          </Button>
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
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-900/40" /> Off (weekly schedule)</span>
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

      {/* ── Weekly Schedule Dialog ───────────────────────────────────────── */}
      <WeeklyScheduleDialog open={weeklyScheduleOpen} onOpenChange={setWeeklyScheduleOpen} onSaved={fetchData} />

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
            <div className="border-t pt-3">
              <Label className="text-sm font-medium">Work hours &amp; days off</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Set which days you work and your bookable hours per day (e.g. only 2 AM–2 PM on Tuesdays).
              </p>
              <Button size="sm" variant="outline" className="w-full text-xs gap-1.5" onClick={() => { setSettingsOpen(false); setWeeklyScheduleOpen(true); }}>
                <CalendarClock className="h-3.5 w-3.5" /> Edit Weekly Schedule
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠ Same as the booking window — your <code className="text-xs bg-muted px-1 rounded">Estimate.tsx</code> time picker should also read this schedule so customers can't request times you're not working.
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
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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

            {/* Affected bookings + auto-reschedule notice */}
            {blockAffectedCount > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-2.5 space-y-2">
                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                  {blockAffectedCount} existing booking{blockAffectedCount > 1 ? "s" : ""} overlap{blockAffectedCount === 1 ? "s" : ""} this block.
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  They'll be auto-moved to the next open slot when you save.
                </p>
                <div className="flex items-center gap-2">
                  <Switch checked={blockNotify} onCheckedChange={setBlockNotify} id="blockNotify" />
                  <Label htmlFor="blockNotify" className="text-xs">Text affected customers</Label>
                </div>
              </div>
            )}

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
            <p className="text-xs text-muted-foreground">Blocks the entire day and auto-reschedules anyone booked that day.</p>
            <div>
              <Label className="text-xs mb-1 block">Day to cancel</Label>
              <Input type="date" value={rainForm.fromDate} onChange={e => setRainForm({ ...rainForm, fromDate: e.target.value })} />
            </div>
            {rainForm.fromDate && bookingsOnDay(rainForm.fromDate).length > 0 && (
              <div className="rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 p-2 text-xs text-orange-700 dark:text-orange-300 space-y-2">
                <p>⚠ {bookingsOnDay(rainForm.fromDate).length} booking{bookingsOnDay(rainForm.fromDate).length > 1 ? "s" : ""} will be auto-moved to the next open slot.</p>
                <div className="flex items-center gap-2">
                  <Switch checked={rainNotify} onCheckedChange={setRainNotify} id="rainNotify" />
                  <Label htmlFor="rainNotify" className="text-xs">Text affected customers</Label>
                </div>
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