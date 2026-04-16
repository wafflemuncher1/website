import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Ban, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlockTimeDialog, { BlockRequest } from "./components/BlockTimeDialog";
import RescheduleDayDialog from "./components/RescheduleDayDialog";

type Booking = {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  kind?: "booking" | "blocked";
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

  const [blockOpen, setBlockOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const [selected, setSelected] = useState<Booking | null>(null);

  // local “blocked” items (UI-only for now; later we’ll write these to Google Calendar)
  const [blocked, setBlocked] = useState<Booking[]>([]);

  // Placeholder bookings (replace with Google Calendar events later)
  const bookings: Booking[] = [
    {
      id: "1",
      title: "Signature Detail",
      kind: "booking",
      start: new Date(cursor.getFullYear(), cursor.getMonth(), 7, 10, 0).toISOString(),
      end: new Date(cursor.getFullYear(), cursor.getMonth(), 7, 12, 0).toISOString(),
      name: "Test Customer",
      email: "test@example.com",
      phone: "(502) 555-1234",
      notes: "Placeholder until Google Calendar is connected.",
    },
    {
      id: "2",
      title: "Baseline",
      kind: "booking",
      start: new Date(cursor.getFullYear(), cursor.getMonth(), 14, 9, 0).toISOString(),
      end: new Date(cursor.getFullYear(), cursor.getMonth(), 14, 10, 30).toISOString(),
      name: "Second Customer",
    },
  ];

  const allEvents = useMemo(() => [...bookings, ...blocked], [bookings, blocked]);

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const gridStart = startOfWeekSunday(first);
    const grid: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      grid.push(d);
    }
    return { grid };
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of allEvents) {
      const key = ymd(new Date(b.start));
      map.set(key, [...(map.get(key) ?? []), b]);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => +new Date(a.start) - +new Date(b.start));
      map.set(k, arr);
    }
    return map;
  }, [allEvents]);

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

  const onAddBlock = (req: BlockRequest) => {
    // UI-only: convert request into “blocked” events.
    // For multi-day: we create one blocked item per day.
    const makeIso = (day: string, time: string) => new Date(`${day}T${time}:00`).toISOString();

    const daysToAdd: string[] = [];
    const start = new Date(req.startDate + "T00:00:00");
    const end = new Date(req.endDate + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      daysToAdd.push(ymd(d));
    }

    const newBlocks: Booking[] = daysToAdd.map((day) => {
      const id = `block-${day}-${Math.random().toString(16).slice(2)}`;

      if (req.allDay) {
        // all-day block -> represent as 00:00 to 23:59 for UI
        return {
          id,
          kind: "blocked",
          title: req.note ? `Blocked: ${req.note}` : "Blocked (All Day)",
          start: makeIso(day, "00:00"),
          end: makeIso(day, "23:59"),
          notes: req.note,
        };
      }

      return {
        id,
        kind: "blocked",
        title: req.note ? `Blocked: ${req.note}` : "Blocked",
        start: makeIso(day, req.startTime || "09:00"),
        end: makeIso(day, req.endTime || "17:00"),
        notes: req.note,
      };
    });

    setBlocked((prev) => [...newBlocks, ...prev]);
  };

  const onRescheduleDay = (day: string) => {
    // UI-only placeholder
    alert(`Reschedule requested for ${day}. Next step: server moves bookings to next open slots.`);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calender
          </h1>
          <p className="text-muted-foreground">Month view (UI-first).</p>
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

      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={goPrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="font-semibold text-foreground">{fmtMonthTitle(cursor)}</div>

        <Button variant="ghost" onClick={goNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-card">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
            <div key={w} className="px-3 py-2 text-xs font-medium text-muted-foreground">
              {w}
            </div>
          ))}
        </div>

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
                      className={`w-full text-left rounded-md border px-2 py-1 transition-colors ${
                        b.kind === "blocked"
                          ? "border-destructive/40 bg-destructive/10 hover:bg-destructive/15"
                          : "border-border/60 bg-background/60 hover:bg-background"
                      }`}
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

      {/* Dialogs */}
      <BlockTimeDialog open={blockOpen} onOpenChange={setBlockOpen} onSubmit={onAddBlock} />
      <RescheduleDayDialog open={rescheduleOpen} onOpenChange={setRescheduleOpen} onSubmit={onRescheduleDay} />

      {/* Simple details (we can convert this to a Dialog next) */}
      {selected && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">
              {selected.kind === "blocked" ? "Blocked time" : "Booking details"}
            </p>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Title</div>
              <div className="text-foreground font-medium">{selected.title}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Time</div>
              <div className="text-foreground font-medium">
                {new Date(selected.start).toLocaleString()} → {new Date(selected.end).toLocaleString()}
              </div>
            </div>

            {selected.kind !== "blocked" && (
              <>
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
              </>
            )}

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