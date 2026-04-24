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
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const today = ymd(new Date());
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

const ETA_PRESETS = ["15 min", "20 min", "30 min", "45 min", "1 hour", "On my way"];

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

type SentMap = Record<string, { confirmation?: string; omw?: string }>;

// ─── SMS caller ───────────────────────────────────────────────────────────────

async function callSMS(
  action: string,
  payload: object
): Promise<{ ok: boolean; error?: string; [k: string]: unknown }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
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
  const [sentMap, setSentMap] = useState<SentMap>({});
  const [history, setHistory] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmTemplate, setConfirmTemplate] = useState("");
  const [omwTemplate, setOmwTemplate] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Inline OMW state per booking
  const [expandedOmw, setExpandedOmw] = useState<string | null>(null);
  const [omwEtas, setOmwEtas] = useState<Record<string, string>>({});

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [todayRes, histRes, settRes] = await Promise.all([
      supabase
        .from("estimate_requests")
        .select(
          "id,name,phone,service,vehicle_size,total_cents,booking_date,booking_time,address,city,completed"
        )
        .eq("booking_date", today)
        .order("booking_time"),
      supabase
        .from("sms_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("admin_settings")
        .select("key,value")
        .in("key", ["sms_confirmation_template", "sms_omw_template", "twilio_from_number"]),
    ]);

    const today_ = (todayRes.data ?? []) as Booking[];
    setTodayBookings(today_);
    if (histRes.data) setHistory(histRes.data as SmsMessage[]);

    if (settRes.data) {
      const m = Object.fromEntries(
        settRes.data.map((s: { key: string; value: string }) => [s.key, s.value])
      );
      setConfirmTemplate(m.sms_confirmation_template ?? "");
      setOmwTemplate(m.sms_omw_template ?? "");
      setFromNumber(m.twilio_from_number ?? "");
    }

    if (today_.length > 0) {
      const { data: msgs } = await supabase
        .from("sms_messages")
        .select("estimate_request_id,type,status")
        .in(
          "estimate_request_id",
          today_.map((b) => b.id)
        );
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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Settings save ──────────────────────────────────────────────────────────

  const saveSettings = async () => {
    setSettingsSaving(true);
    for (const [key, value] of [
      ["sms_confirmation_template", confirmTemplate],
      ["sms_omw_template", omwTemplate],
      ["twilio_from_number", fromNumber],
    ]) {
      await supabase
        .from("admin_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() });
    }
    toast({ title: "Settings saved ✓" });
    setSettingsSaving(false);
    setSettingsOpen(false);
  };

  // ── OMW preview builder ────────────────────────────────────────────────────

  const buildOmwPreview = (b: Booking, eta: string) =>
    omwTemplate
      .replace("{name}", b.name?.split(" ")[0] ?? "")
      .replace("{address}", `${b.address ?? ""}, ${b.city ?? ""}`)
      .replace("{eta}", eta);

  // ── Send OMW ───────────────────────────────────────────────────────────────

  const sendOmw = async (b: Booking) => {
    const eta = omwEtas[b.id] ?? "30 min";
    setSending(b.id);
    const result = await callSMS("send-omw", { estimate_request_id: b.id, eta });
    if (result.ok) {
      toast({ title: `OMW sent to ${b.name} ✓` });
      setExpandedOmw(null);
    } else {
      toast({
        title: "Failed to send",
        description: result.error as string,
        variant: "destructive",
      });
    }
    setSending(null);
    fetchAll();
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const twilioReady = fromNumber.trim().length > 0;

  const SentBadge = ({ status }: { status?: string }) => {
    if (!status) return null;
    if (status === "sent")
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] h-5 gap-1">
          <CheckCircle2 className="h-2.5 w-2.5" /> Sent
        </Badge>
      );
    if (status === "failed")
      return (
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Messages
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Auto-confirmation on booking · Manual OMW texts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={fetchAll}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-3.5 w-3.5" /> Settings
          </Button>
        </div>
      </div>

      {/* ── Status Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Auto-confirmation */}
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Auto Confirmation</p>
            <p className="text-xs text-muted-foreground">
              Texts customer the moment a booking is submitted
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        </div>

        {/* Twilio status */}
        <div
          className={`rounded-xl border bg-card p-4 flex items-center gap-3 ${
            !twilioReady ? "border-amber-300 dark:border-amber-700" : ""
          }`}
        >
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
              twilioReady ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
            }`}
          >
            <Phone
              className={`h-5 w-5 ${
                twilioReady ? "text-green-600" : "text-amber-600"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Twilio SMS</p>
            <p
              className={`text-xs truncate ${
                twilioReady ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {twilioReady ? `Sending from ${fromNumber}` : "Not configured yet"}
            </p>
          </div>
          {!twilioReady ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
              onClick={() => setSettingsOpen(true)}
            >
              Set up
            </Button>
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          )}
        </div>
      </div>

      {/* ── Today's Schedule ────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" /> Today's Schedule
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              {" · "}
              {todayBookings.length} booking{todayBookings.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-14">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground">
            <Car className="h-9 w-9 mb-3 opacity-20" />
            <p className="text-sm font-medium">No bookings today</p>
            <p className="text-xs opacity-60 mt-0.5">Your schedule is clear</p>
          </div>
        ) : (
          <div className="divide-y">
            {todayBookings.map((b) => {
              const omwSent = sentMap[b.id]?.omw === "sent";
              const confirmedSent = sentMap[b.id]?.confirmation === "sent";
              const isExpanded = expandedOmw === b.id;
              const eta = omwEtas[b.id] ?? "30 min";

              return (
                <div key={b.id} className="px-5 py-4 space-y-3">

                  {/* Booking info row */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="font-semibold text-base">{b.name}</span>
                        {b.completed && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] h-4">
                            Done
                          </Badge>
                        )}
                        {confirmedSent && (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] h-4 gap-1">
                            <MessageSquare className="h-2.5 w-2.5" /> Confirmed
                          </Badge>
                        )}
                        {omwSent && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] h-4 gap-1">
                            <Navigation className="h-2.5 w-2.5" /> OMW sent
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          {b.booking_time || "Time TBD"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          {b.phone}
                        </span>
                        <span className="flex items-center gap-1.5 truncate">
                          <Wrench className="h-3 w-3 shrink-0" />
                          {b.service || "—"} · {b.vehicle_size}
                        </span>
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {b.address}, {b.city}
                        </span>
                      </div>
                    </div>

                    {/* OMW toggle button */}
                    <Button
                      size="sm"
                      className={`shrink-0 gap-1.5 ${
                        isExpanded
                          ? "bg-blue-700 hover:bg-blue-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white`}
                      onClick={() => setExpandedOmw(isExpanded ? null : b.id)}
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      {omwSent ? "Re-send OMW" : "Send OMW"}
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  {/* Inline ETA picker — expands when OMW button clicked */}
                  {isExpanded && (
                    <div className="bg-muted/40 rounded-xl border p-4 space-y-3">
                      {!twilioReady && (
                        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-lg p-2.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Twilio not configured —{" "}
                          <button
                            className="underline font-medium"
                            onClick={() => {
                              setExpandedOmw(null);
                              setSettingsOpen(true);
                            }}
                          >
                            set it up first
                          </button>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-medium mb-2 text-muted-foreground">
                          How long until you arrive?
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {ETA_PRESETS.map((e) => (
                            <button
                              key={e}
                              onClick={() =>
                                setOmwEtas((prev) => ({ ...prev, [b.id]: e }))
                              }
                              className={[
                                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                eta === e
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background hover:border-primary/60",
                              ].join(" ")}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                        <Input
                          className="h-8 text-xs"
                          placeholder="Or type a custom ETA…"
                          value={eta}
                          onChange={(e) =>
                            setOmwEtas((prev) => ({ ...prev, [b.id]: e.target.value }))
                          }
                        />
                      </div>

                      {/* Message preview */}
                      <div className="rounded-lg bg-background border p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap min-h-[48px]">
                        {buildOmwPreview(b, eta) || (
                          <span className="italic">
                            Set up your OMW template in Settings to preview the message
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setExpandedOmw(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={!twilioReady || sending === b.id}
                          onClick={() => sendOmw(b)}
                        >
                          {sending === b.id ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" /> Sending…
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3" /> Send OMW
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Message History ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Message History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Last 50 messages sent</p>
        </div>
        {history.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <History className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No messages sent yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">
                    Time
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    To
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Message
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtTime(m.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono">{m.to_number}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-[10px] h-5 capitalize">
                        {m.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell max-w-xs">
                      <span className="truncate block">{m.body}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <SentBadge status={m.status} />
                      {m.error && (
                        <p
                          className="text-[10px] text-red-500 mt-0.5 max-w-[160px] truncate"
                          title={m.error}
                        >
                          {m.error}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Settings Modal ───────────────────────────────────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> Message Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-1">

            {/* Twilio phone number */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Your Twilio Phone Number</Label>
              <Input
                placeholder="+15025551234"
                value={fromNumber}
                onChange={(e) => setFromNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The number texts are sent FROM. Must be in E.164 format (+1XXXXXXXXXX).
              </p>
            </div>

            <hr className="border-border" />

            {/* Confirmation template */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-0.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <Label className="text-sm font-semibold">Auto Confirmation Message</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Sent automatically the moment a customer submits a booking.
              </p>
              <Textarea
                value={confirmTemplate}
                onChange={(e) => setConfirmTemplate(e.target.value)}
                rows={5}
                className="text-xs font-mono"
                placeholder={"Hey {name}! Your booking for {service} on {date} at {time} is confirmed. See you at {address}! — Glossworks 🚗"}
              />
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES_CONFIRMATION.map((v) => (
                  <button
                    key={v.tag}
                    onClick={() => setConfirmTemplate((t) => t + v.tag)}
                    title={v.desc}
                    className="text-[10px] bg-muted hover:bg-primary/10 border rounded px-1.5 py-0.5 font-mono transition-colors"
                  >
                    {v.tag}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {confirmTemplate.length} chars · Keep under 160 for a single SMS
              </p>
            </div>

            <hr className="border-border" />

            {/* OMW template */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-0.5">
                <Navigation className="h-3.5 w-3.5 text-blue-500" />
                <Label className="text-sm font-semibold">On My Way Message</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                You send this manually from Today's Schedule when heading to a job.
              </p>
              <Textarea
                value={omwTemplate}
                onChange={(e) => setOmwTemplate(e.target.value)}
                rows={4}
                className="text-xs font-mono"
                placeholder={"Hey {name}! It's Glossworks — I'm on my way and will arrive in about {eta}. See you soon! 🚗"}
              />
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES_OMW.map((v) => (
                  <button
                    key={v.tag}
                    onClick={() => setOmwTemplate((t) => t + v.tag)}
                    title={v.desc}
                    className="text-[10px] bg-muted hover:bg-primary/10 border rounded px-1.5 py-0.5 font-mono transition-colors"
                  >
                    {v.tag}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">{omwTemplate.length} chars</p>
            </div>

            <hr className="border-border" />

            {/* Twilio setup guide */}
            <div className="rounded-xl bg-muted/50 border p-4 space-y-3">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> How to connect Twilio
              </p>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>
                  Sign up at{" "}
                  <a
                    href="https://twilio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-foreground"
                  >
                    twilio.com
                  </a>{" "}
                  — free trial includes $15 credit
                </li>
                <li>Get a Twilio phone number (~$1/month after trial)</li>
                <li>
                  Go to{" "}
                  <a
                    href="https://console.twilio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-foreground"
                  >
                    Twilio Console
                  </a>{" "}
                  and copy your Account SID + Auth Token
                </li>
                <li>
                  In Supabase → Project Settings → Edge Functions → Secrets, add:
                  <code className="block mt-1 bg-background border rounded p-2 text-[11px] leading-relaxed">
                    TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxx{"\n"}
                    TWILIO_AUTH_TOKEN = your_auth_token
                  </code>
                </li>
                <li>Enter your Twilio phone number above and hit Save</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
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
