import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Ban, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Booking = {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const startOfWeekSunday = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtMonthTitle = (d: Date) =>
  d.toLocaleString(undefined, { month: "long", year: "numeric" });

const CalenderPage = () => {
  const [cursor, setCursor] = useState(() => new Date());

  // UI modals (we’ll wire these later)
  const [blockOpen, setBlockOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  // “event details” popup
  const [selected, setSelected] = useState<Booking | null>(null);

  // Placeholder bookings (replace with Google Calendar events later)
  const bookings: Booking[] = [
    {
      id: "1",
      title: "Signature Detail",
      start: new Date(cursor.getFullYear(), cursor.getMonth(), 7, 10, 0).toISOString(),
      end: new Date(cursor.getFullYear(), cursor.getMonth(), 7, 12, 0).toISOString(),
      name: "Test Customer",
      email: "test@example.com",
      phone: "(502) 555-1234",
      notes: "This is placeholder data until Google Calendar is connected.",
    },
    {
      id: "2",
      title: "Baseline",
      start: new Date(cursor.getFullYear(), cursor.getMonth(), 14, 9, 0).toISOString(),
      end: new Date(cursor.getFullYear(), cursor.getMonth(), 14, 10, 30).toISOString(),
      name: "Second Customer",
    },
  ];

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);

    const gridStart = startOfWeekSunday(first);
    const grid: Date[] = [];

    // 6-week grid (42 cells) is standard for month view
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      grid.push(d);
    }

    return { first, last, grid };
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = ymd(new Date(b.start));
      map.set(key, [...(map.get(key) ?? []), b]);
    }
    // sort events by start time
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => +new Date(a.start) - +new Date(b.start));
      map.set(k, arr);
    }
    return map;
  }, [bookings]);

  const goPrevMonth = () =>
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () =>
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => setCursor(new Date());

  const isSameMonth = (d: Date) => d.getMonth() === cursor.getMonth();

  const timeRange = (b: Booking) => {
    const s = new Date(b.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const e = new Date(b.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `${s}–${e}`;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calender
          </h1>
          <p className="text-muted-foreground">
            Month view (Google Calendar hookup comes next).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={goToday}>
            Today
          </Button>

          <Button variant="outline" onClick={() => setBlockOpen(true)}>
            <Ban className="mr-2 h-4 w-4" />
            Block time
          </Button>

          <Button variant="outline" onClick={() => setRescheduleOpen(true)}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reschedule day
          </Button>
        </div>
      </div>

      {/* Month header controls */}
      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={goPrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="font-semibold text-foreground">{fmtMonthTitle(cursor)}</div>

        <Button variant="ghost" onClick={goNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Month grid */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border bg-card">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
            <div key={w} className="px-3 py-2 text-xs font-medium text-muted-foreground">
              {w}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.grid.map((d) => {
            const key = ymd(d);
            const dayEvents = eventsByDay.get(key) ?? [];
            const muted = !isSameMonth(d);

            return (
              <div
                key={key}
                className="min-h-[110px] border-t border-border/60 border-r border-border/60 p-2 last:border-r-0"
              >
                <div className={`text-xs ${muted ? "text-muted-foreground" : "text-foreground"} font-medium`}>
                  {d.getDate()}
                </div>

                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelected(b)}
                      className="w-full text-left rounded-md border border-border/60 bg-background/60 px-2 py-1 hover:bg-background transition-colors"
                    >
                      <div className="text-xs font-medium text-foreground truncate">
                        {timeRange(b)} {b.title}
                      </div>
                      {b.name && (
                        <div className="text-[11px] text-muted-foreground truncate">{b.name}</div>
                      )}
                    </button>
                  ))}

                  {dayEvents.length > 3 && (
                    <div className="text-[11px] text-muted-foreground px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simple modal placeholders (we’ll replace with real dialogs next step) */}
      {blockOpen && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Block time (placeholder)</p>
            <Button variant="ghost" onClick={() => setBlockOpen(false)}>
              Close
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Next step: popup calendar + select single/multi-day + time ranges, then create “blocked” events in Google Calendar.
          </p>
        </div>
      )}

      {rescheduleOpen && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Reschedule day (placeholder)</p>
            <Button variant="ghost" onClick={() => setRescheduleOpen(false)}>
              Close
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Next step: select a day, confirm, then server will move that day’s bookings to the next available open slots.
          </p>
        </div>
      )}

      {selected && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Booking details</p>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Service</div>
              <div className="text-foreground font-medium">{selected.title}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Time</div>
              <div className="text-foreground font-medium">
                {new Date(selected.start).toLocaleString()} → {new Date(selected.end).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Name</div>
              <div className="text-foreground font-medium">{selected.name ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Email</div>
              <div className="text-foreground font-medium">{selected.email ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Phone</div>
              <div className="text-foreground font-medium">{selected.phone ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Notes</div>
              <div className="text-foreground font-medium">{selected.notes ?? "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalenderPage;