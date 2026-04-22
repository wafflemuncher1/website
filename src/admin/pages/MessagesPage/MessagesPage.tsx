import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Settings,
  RefreshCw,
  Phone,
  MapPin,
  Wrench,
  AlertTriangle,
  Navigation,
  History,
  Info,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const today = ymd(new Date());

const fmt$ = (c: number) => `$${(c / 100).toFixed(0)}`;

const fmtTime = (s: string) =>
  new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const VARIABLES_CONFIRMATION = [
  { tag: "{name}", desc: "Customer's first name" },
  { tag: "{date}", desc: "Booking date (e.g. Mon, Apr 22)" },
  { tag: "{time}", desc: "Booking time (e.g. 10:00 AM)" },
  { tag: "{address}", desc: "Service address" },
  { tag: "{service}", desc: "Package name" },
  { tag: "{total}", desc: "Estimated total (e.g. $165)" },
];

const VARIABLES_OMW = [
  { tag: "{name}", desc: "Customer's first name" },
  { tag: "{address}", desc: "Service address" },
  { tag: "{eta}", desc: "ETA you enter before sending" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id: string;
  name: string;
  phone: string;
  service: string;
  vehicle_size: string;
  total_cents: number;
  booking_date: string;
  booking_time: string;
  address: string;
  city: string;
  completed: boolean;
};

type SmsMessage = {
  id: string;
  created_at: string;
  estimate_request_id: string;
  to_number: string;
  body: string;
  type: string;
  status: string;
  twilio_sid: string | null;
  error: string | null;
};

type SentMap = Record<string, { confirmation?: string; omw?: string }>; // id → status

// ─── Edge function caller ─────────────────────────────────────────────────────

async function callSMS(action: string, payload: object): Promise<{ ok: boolean; error?: string; [k: string]: unknown }> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MessagesPage = () => {
  const { toast } = useToast();

  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [sentMap, setSentMap] = useState<SentMap>({});
  const [history, setHistory] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null); // bookingId being sent

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmTemplate, setConfirmTemplate] = useState("");
  const [omwTemplate, setOmwTemplate] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  // OMW modal
  const [omwTarget, setOmwTarget] = useState<Booking | null>(null);
  const [omwEta, setOmwEta] = useState("30 minutes");
  const [omwPreview, setOmwPreview] = useState("");

  // Confirmation preview modal
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);
  const [previewBody, setPreviewBody] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [todayRes, recentRes, histRes, settRes] = await Promise.all([
      // Today's bookings
      supabase.from("estimate_requests")
        .select("id,name,phone,service,vehicle_size,total_cents,booking_date,booking_time,address,city,completed")
        .eq("booking_date", today)
        .order("booking_time"),
      // Recent bookings (last 30 days) for confirmation tab
      supabase.from("estimate_requests")
        .select("id,name,phone,service,vehicle_size,total_cents,booking_date,booking_time,address,city,completed")
        .not("phone", "is", null)
        .order("created_at", { ascending: false })
        .limit(30),
      // SMS history
      supabase.from("sms_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      // Settings
      supabase.from("admin_settings")
        .select("key,value")
        .in("key", ["sms_confirmation_template","sms_omw_template","twilio_from_number","sms_enabled"]),
    ]);

    const today_ = (todayRes.data ?? []) as Booking[];
    const recent_ = (recentRes.data ?? []) as Booking[];
    setTodayBookings(today_);
    setRecentBookings(recent_);
    if (histRes.data) setHistory(histRes.data as SmsMessage[]);

    if (settRes.data) {
      const m = Object.fromEntries(settRes.data.map((s: { key: string; value: string }) => [s.key, s.value]));
      setConfirmTemplate(m.sms_confirmation_template ?? "");
      setOmwTemplate(m.sms_omw_template ?? "");
      setFromNumber(m.twilio_from_number ?? "");
    }

    // Build sent map from history
    const allIds = [...new Set([...today_.map(b => b.id), ...recent_.map(b => b.id)])];
    if (allIds.length > 0) {
      const { data: msgs } = await supabase.from("sms_messages")
        .select("estimate_request_id,type,status")
        .in("estimate_request_id", allIds);
      const map: SentMap = {};
      for (const m of msgs ?? []) {
        if (!map[m.estimate_request_id]) map[m.estimate_request_id] = {};
        if (m.type === "confirmation") map[m.estimate_request_id].confirmation = m.status;
        if (m.type === "omw") map[m.estimate_request_id].omw = m.status;
      }
      setSentMap(map);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Settings save ──────────────────────────────────────────────────────────

  const saveSettings = async () => {
    setSettingsSaving(true);
    const updates = [
      { key: "sms_confirmation_template", value: confirmTemplate },
      { key: "sms_omw_template", value: omwTemplate },
      { key: "twilio_from_number", value: fromNumber },
    ];
    for (const u of updates) {
      await supabase.from("admin_settings").upsert({ ...u, updated_at: new Date().toISOString() });
    }
    toast({ title: "Settings saved ✓" });
    setSettingsSaving(false);
    setSettingsOpen(false);
  };

  // ── Build preview body ─────────────────────────────────────────────────────

  const buildConfirmPreview = (b: Booking, template: string) => {
    const dateStr = b.booking_date
      ? new Date(b.booking_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      : "";
    return template
      .replace("{name}", b.name?.split(" ")[0] ?? "")
      .replace("{date}", dateStr)
      .replace("{time}", b.booking_time ?? "")
      .replace("{address}", `${b.address ?? ""}, ${b.city ?? ""}`)
      .replace("{service}", b.service ?? "")
      .replace("{total}", fmt$(b.total_cents));
  };

  const buildOmwPreview = (b: Booking, template: string, eta: string) =>
    template
      .replace("{name}", b.name?.split(" ")[0] ?? "")
      .replace("{address}", `${b.address ?? ""}, ${b.city ?? ""}`)
      .replace("{eta}", eta);

  // ── Send confirmation ──────────────────────────────────────────────────────

  const sendConfirmation = async (b: Booking) => {
    setSending(b.id);
    const result = await callSMS("send-confirmation", { estimate_request_id: b.id });
    if (result.ok) {
      toast({ title: `Confirmation sent to ${b.name} ✓` });
    } else {
      toast({ title: "Failed to send", description: result.error as string, variant: "destructive" });
    }
    setSending(null);
    setPreviewBooking(null);
    fetchAll();
  };

  // ── Send OMW ───────────────────────────────────────────────────────────────

  const sendOmw = async () => {
    if (!omwTarget) return;
    setSending(omwTarget.id);
    const result = await callSMS("send-omw", {
      estimate_request_id: omwTarget.id,
      eta: omwEta,
    });
    if (result.ok) {
      toast({ title: `OMW sent to ${omwTarget.name} ✓` });
    } else {
      toast({ title: "Failed to send", description: result.error as string, variant: "destructive" });
    }
    setSending(null);
    setOmwTarget(null);
    fetchAll();
  };

  // ── Open OMW modal ─────────────────────────────────────────────────────────

  const openOmw = (b: Booking) => {
    setOmwTarget(b);
    setOmwEta("30 minutes");
    setOmwPreview(buildOmwPreview(b, omwTemplate, "30 minutes"));
  };

  // ── Open confirm preview ───────────────────────────────────────────────────

  const openConfirmPreview = (b: Booking) => {
    setPreviewBooking(b);
    setPreviewBody(buildConfirmPreview(b, confirmTemplate));
  };

  // ── Sent badge ─────────────────────────────────────────────────────────────

  const SentBadge = ({ status }: { status?: string }) => {
    if (!status) return null;
    if (status === "sent") return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] h-5 gap-1">
        <CheckCircle2 className="h-2.5 w-2.5" /> Sent
      </Badge>
    );
    if (status === "failed") return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-[10px] h-5 gap-1">
        <XCircle className="h-2.5 w-2.5" /> Failed
      </Badge>
    );
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-[10px] h-5 gap-1">
        <Clock className="h-2.5 w-2.5" /> Pending
      </Badge>
    );
  };

  const twilioReady = fromNumber.trim().length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Messages
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Send booking confirmations and OMW texts via Twilio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={fetchAll}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5" /> Settings
          </Button>
        </div>
      </div>

      {/* Twilio setup notice */}
      {!twilioReady && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Twilio not configured yet</p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
              To enable texting, you need to:
            </p>
            <ol className="text-xs text-amber-700 dark:text-amber-500 mt-1.5 space-y-1 list-decimal list-inside">
              <li>Sign up at <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">twilio.com</a> — free trial gives you $15 credit</li>
              <li>Get a Twilio phone number (~$1/mo after trial)</li>
              <li>Go to your Supabase dashboard → Project Settings → Edge Functions → Secrets</li>
              <li>Add <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">TWILIO_ACCOUNT_SID</code>, <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">TWILIO_AUTH_TOKEN</code></li>
              <li>Click Settings above and enter your Twilio phone number</li>
            </ol>
          </div>
          <Button size="sm" className="shrink-0 h-8 text-xs" onClick={() => setSettingsOpen(true)}>
            Open Settings
          </Button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  SECTION 1 — TODAY'S SCHEDULE + OMW                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" /> Today's Schedule
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {" · "}{todayBookings.length} booking{todayBookings.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Car className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No bookings today</p>
          </div>
        ) : (
          <div className="divide-y">
            {todayBookings.map(b => {
              const omwSent = sentMap[b.id]?.omw === "sent";
              return (
                <div key={b.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold">{b.name}</span>
                        {b.completed && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] h-4">Done</Badge>
                        )}
                        {omwSent && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] h-4 gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> OMW sent
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {b.booking_time || "Time TBD"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" />
                          {b.phone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Wrench className="h-3 w-3" />
                          {b.service || "—"} · {b.vehicle_size}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          {b.address}, {b.city}
                        </span>
                      </div>
                    </div>

                    {/* OMW button */}
                    <Button
                      size="sm"
                      className="shrink-0 h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!twilioReady || sending === b.id}
                      onClick={() => openOmw(b)}
                    >
                      {sending === b.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Navigation className="h-3.5 w-3.5" />
                      )}
                      {omwSent ? "Send Again" : "Send OMW"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  SECTION 2 — BOOKING CONFIRMATIONS                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Booking Confirmations
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send a confirmation text to customers after they book. Auto-sends once — safe to click on any booking.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No bookings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Service</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Confirmation</th>
                  <th className="px-4 py-2.5 w-36"></th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => {
                  const confirmStatus = sentMap[b.id]?.confirmation;
                  const alreadySent = confirmStatus === "sent";
                  return (
                    <tr key={b.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium">{b.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {b.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {b.service || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {b.booking_date
                          ? new Date(b.booking_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <SentBadge status={confirmStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {/* Preview button */}
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"
                            onClick={() => openConfirmPreview(b)}>
                            <Info className="h-3 w-3" /> Preview
                          </Button>
                          <Button
                            size="sm"
                            variant={alreadySent ? "outline" : "default"}
                            className="h-7 text-xs gap-1"
                            disabled={!twilioReady || sending === b.id}
                            onClick={() => {
                              if (alreadySent) {
                                // Allow re-send with confirmation
                                openConfirmPreview(b);
                              } else {
                                sendConfirmation(b);
                              }
                            }}
                          >
                            {sending === b.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            {alreadySent ? "Re-send" : "Send"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  SECTION 3 — MESSAGE HISTORY                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Message History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Last 50 texts sent</p>
        </div>
        {history.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
            <History className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No messages sent yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">Time</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">To</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Message</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(m => (
                  <tr key={m.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-5 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtTime(m.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono">{m.to_number}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-[10px] h-5 capitalize">{m.type}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell max-w-xs">
                      <span className="truncate block">{m.body}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <SentBadge status={m.status} />
                      {m.error && (
                        <p className="text-[10px] text-red-500 mt-0.5 max-w-[160px] truncate" title={m.error}>{m.error}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── OMW Modal ────────────────────────────────────────────────────────── */}
      <Dialog open={!!omwTarget} onOpenChange={() => setOmwTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-500" />
              Send OMW to {omwTarget?.name}
            </DialogTitle>
          </DialogHeader>
          {omwTarget && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 space-y-1">
                <div className="flex gap-2"><span className="w-14 shrink-0">To:</span><span className="font-medium">{omwTarget.phone}</span></div>
                <div className="flex gap-2"><span className="w-14 shrink-0">Address:</span><span>{omwTarget.address}, {omwTarget.city}</span></div>
                <div className="flex gap-2"><span className="w-14 shrink-0">Time:</span><span>{omwTarget.booking_time || "—"}</span></div>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Your ETA</Label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {["15 minutes","20 minutes","30 minutes","45 minutes","1 hour","On my way"].map(eta => (
                    <button key={eta} onClick={() => {
                      setOmwEta(eta);
                      setOmwPreview(buildOmwPreview(omwTarget, omwTemplate, eta));
                    }}
                      className={["rounded-lg border px-2 py-2 text-xs font-medium transition-colors text-center",
                        omwEta === eta ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40",
                      ].join(" ")}>
                      {eta}
                    </button>
                  ))}
                </div>
                <Input placeholder="Or type a custom ETA…" value={omwEta}
                  onChange={e => {
                    setOmwEta(e.target.value);
                    setOmwPreview(buildOmwPreview(omwTarget, omwTemplate, e.target.value));
                  }} />
              </div>

              <div>
                <Label className="text-xs mb-1 block">Message Preview</Label>
                <div className="rounded-lg bg-muted/50 border p-3 text-xs leading-relaxed whitespace-pre-wrap">
                  {omwPreview || buildOmwPreview(omwTarget, omwTemplate, omwEta)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Edit the template in Settings to change this message
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOmwTarget(null)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              disabled={sending === omwTarget?.id} onClick={sendOmw}>
              {sending === omwTarget?.id
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                : <><Send className="h-3.5 w-3.5" /> Send OMW</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation Preview Modal ────────────────────────────────────────── */}
      <Dialog open={!!previewBooking} onOpenChange={() => setPreviewBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmation Preview — {previewBooking?.name}</DialogTitle>
          </DialogHeader>
          {previewBooking && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 flex gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Sending to: <span className="font-medium text-foreground">{previewBooking.phone}</span></span>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Message</Label>
                <div className="rounded-lg bg-muted/50 border p-3 text-xs leading-relaxed whitespace-pre-wrap">
                  {previewBody}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {sentMap[previewBooking.id]?.confirmation === "sent"
                  ? "⚠ A confirmation was already sent to this customer."
                  : "This customer has not received a confirmation yet."}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewBooking(null)}>Cancel</Button>
            <Button className="gap-1.5" disabled={!twilioReady || sending === previewBooking?.id}
              onClick={() => previewBooking && sendConfirmation(previewBooking)}>
              {sending === previewBooking?.id
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                : <><Send className="h-3.5 w-3.5" /> Send Now</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Settings Modal ────────────────────────────────────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> SMS Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">

            {/* Twilio number */}
            <div>
              <Label className="text-sm font-semibold mb-1 block">Your Twilio Phone Number</Label>
              <Input placeholder="+15025551234" value={fromNumber}
                onChange={e => setFromNumber(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">
                The number texts will be sent FROM. Must be in E.164 format (+1XXXXXXXXXX).
              </p>
            </div>

            {/* Confirmation template */}
            <div>
              <Label className="text-sm font-semibold mb-1 block">Booking Confirmation Template</Label>
              <Textarea value={confirmTemplate}
                onChange={e => setConfirmTemplate(e.target.value)}
                rows={5} className="text-xs font-mono" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {VARIABLES_CONFIRMATION.map(v => (
                  <button key={v.tag}
                    onClick={() => setConfirmTemplate(t => t + v.tag)}
                    title={v.desc}
                    className="text-[10px] bg-muted hover:bg-muted/80 border rounded px-1.5 py-0.5 font-mono transition-colors">
                    {v.tag}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Click a tag to insert it. Keep under 160 chars for a single SMS.</p>
              <div className="text-xs text-muted-foreground mt-1">{confirmTemplate.length} chars</div>
            </div>

            {/* OMW template */}
            <div>
              <Label className="text-sm font-semibold mb-1 block">OMW Message Template</Label>
              <Textarea value={omwTemplate}
                onChange={e => setOmwTemplate(e.target.value)}
                rows={4} className="text-xs font-mono" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {VARIABLES_OMW.map(v => (
                  <button key={v.tag}
                    onClick={() => setOmwTemplate(t => t + v.tag)}
                    title={v.desc}
                    className="text-[10px] bg-muted hover:bg-muted/80 border rounded px-1.5 py-0.5 font-mono transition-colors">
                    {v.tag}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{omwTemplate.length} chars</p>
            </div>

            {/* Twilio secrets reminder */}
            <div className="rounded-lg bg-muted/40 border p-3 text-xs space-y-1">
              <p className="font-semibold">Supabase Secrets needed:</p>
              <p className="text-muted-foreground">Go to Supabase → Project Settings → Edge Functions → Secrets and add:</p>
              <code className="block bg-background rounded p-2 mt-1 text-[11px]">
                TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxx{"\n"}
                TWILIO_AUTH_TOKEN = your_auth_token
              </code>
              <p className="text-muted-foreground mt-1">Find these in your <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="underline text-foreground">Twilio Console</a>.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={saveSettings} disabled={settingsSaving}>
              {settingsSaving ? "Saving…" : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesPage;