import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, TrendingUp, TrendingDown, Receipt,
  Plus, Download, RefreshCw, CheckCircle2,
  AlertTriangle, Link2, LinkOff, Trash2,
  ArrowUpRight, ArrowDownRight, Calculator,
  Wallet, Package, FileText,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const fmt$ = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = (c: number) => c >= 100000 ? `$${(c / 100000).toFixed(1)}k` : `$${(c / 100).toFixed(0)}`;

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const today = ymd(new Date());
const thisYear = new Date().getFullYear();
const thisMonth = new Date().getMonth();

const startOfMonth = (y = thisYear, m = thisMonth) => ymd(new Date(y, m, 1));
const endOfMonth = (y = thisYear, m = thisMonth) => ymd(new Date(y, m + 1, 0));

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const QUARTERS = ["Q1 (Jan–Mar)","Q2 (Apr–Jun)","Q3 (Jul–Sep)","Q4 (Oct–Dec)"];
const QUARTER_MONTHS = [[0,1,2],[3,4,5],[6,7,8],[9,10,11]];

const EXPENSE_CATEGORIES = [
  "Supplies","Chemicals","Equipment","Fuel","Marketing",
  "Insurance","Phone/Software","Vehicle Maintenance","Other",
];

// Self-employment tax rate estimate (~15.3% SE + ~10% income = ~25%)
const TAX_RATE = 0.25;

type Booking = { id: string; total_cents: number; booking_date: string; completed: boolean; service: string; };
type Expense = { id: string; date: string; description: string; category: string; amount_cents: number; notes?: string; };
type Invoice = { id: string; invoice_number: string; customer_name: string; total_cents: number; paid: boolean; created_at: string; };

type QBStatus = { connected: boolean; companyName: string; lastSync: string; };

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  label, value, sub, icon: Icon, color = "default", delta,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color?: string; delta?: number;
}) => {
  const colors: Record<string, string> = {
    green:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    red:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    blue:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    amber:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    default:"bg-muted text-muted-foreground",
  };
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors[color] ?? colors.default}`}>
          <Icon className="h-4 w-4" />
        </div>
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
            {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs font-medium text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const AccountingPage = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [qbStatus, setQbStatus] = useState<QBStatus>({ connected: false, companyName: "", lastSync: "" });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(thisYear);
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "quarterly">("monthly");

  // Expense modal
  const [expModal, setExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ date: today, description: "", category: "Supplies", amount: "", notes: "" });
  const [expSaving, setExpSaving] = useState(false);
  const [deleteExpId, setDeleteExpId] = useState<string | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const yearStart = `${selectedYear}-01-01`;
    const yearEnd = `${selectedYear}-12-31`;

    const [bRes, expRes, invRes] = await Promise.all([
      supabase.from("estimate_requests")
        .select("id,total_cents,booking_date,completed,service")
        .gte("booking_date", yearStart)
        .lte("booking_date", yearEnd),
      supabase.from("expenses")
        .select("*")
        .gte("date", yearStart)
        .lte("date", yearEnd)
        .order("date", { ascending: false }),
      supabase.from("invoices")
        .select("id,invoice_number,customer_name,total_cents,paid,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (bRes.data) setBookings(bRes.data as Booking[]);
    if (expRes.data) setExpenses(expRes.data as Expense[]);
    if (invRes.data) setInvoices(invRes.data as Invoice[]);

    // QB status from admin_settings
    const { data: settings } = await supabase.from("admin_settings")
      .select("key,value")
      .in("key", ["qb_connected","qb_company_name","qb_last_sync"]);

    if (settings) {
      const m = Object.fromEntries(settings.map(s => [s.key, s.value]));
      setQbStatus({
        connected: m.qb_connected === "true",
        companyName: m.qb_company_name ?? "",
        lastSync: m.qb_last_sync ?? "",
      });
    }

    setLoading(false);
  }, [selectedYear]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Handle QB OAuth callback
  useEffect(() => {
    if (searchParams.get("qb_connected") === "true") {
      toast({ title: "QuickBooks connected! ✓", description: "Your account is now linked." });
      fetchAll();
    }
    if (searchParams.get("qb_error")) {
      toast({ title: "QuickBooks connection failed", description: searchParams.get("qb_error") ?? "", variant: "destructive" });
    }
  }, [searchParams]); // eslint-disable-line

  // ── QB Actions ──────────────────────────────────────────────────────────────

  const connectQuickBooks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/quickbooks-auth?action=init`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const json = await res.json();
      if (json.ok && json.url) window.location.href = json.url;
      else toast({ title: "Error", description: json.error || "Could not start QB auth", variant: "destructive" });
    } catch (e: unknown) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    }
  };

  const disconnectQB = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${SUPABASE_URL}/functions/v1/quickbooks-auth?action=disconnect`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setQbStatus({ connected: false, companyName: "", lastSync: "" });
    toast({ title: "QuickBooks disconnected" });
  };

  const syncToQB = async (action: "sync-customers" | "sync-invoices" | "sync-expenses") => {
    setSyncing(action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/quickbooks-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.ok) {
        toast({ title: `Synced ${json.synced} record${json.synced !== 1 ? "s" : ""} to QuickBooks ✓` });
        fetchAll();
      } else {
        toast({ title: "Sync failed", description: json.error, variant: "destructive" });
      }
    } catch (e: unknown) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    }
    setSyncing(null);
  };

  // ── Expense CRUD ────────────────────────────────────────────────────────────

  const saveExpense = async () => {
    if (!expForm.description.trim() || !expForm.amount) {
      toast({ title: "Description and amount required", variant: "destructive" });
      return;
    }
    setExpSaving(true);
    const { error } = await supabase.from("expenses").insert({
      date: expForm.date,
      description: expForm.description,
      category: expForm.category,
      amount_cents: Math.round(parseFloat(expForm.amount) * 100),
      notes: expForm.notes || null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Expense logged ✓" });
      setExpModal(false);
      setExpForm({ date: today, description: "", category: "Supplies", amount: "", notes: "" });
      fetchAll();
    }
    setExpSaving(false);
  };

  const deleteExpense = async () => {
    if (!deleteExpId) return;
    await supabase.from("expenses").delete().eq("id", deleteExpId);
    toast({ title: "Expense deleted" });
    setDeleteExpId(null);
    fetchAll();
  };

  // ── CSV Export ──────────────────────────────────────────────────────────────

  const exportCSV = (type: "revenue" | "expenses") => {
    if (type === "revenue") {
      const rows = [
        ["Date","Customer","Service","Amount","Status"],
        ...bookings.map(b => [
          b.booking_date ?? "",
          "",
          b.service ?? "",
          `$${(b.total_cents / 100).toFixed(2)}`,
          b.completed ? "Completed" : "Pending",
        ]),
      ];
      downloadCSV(rows, `revenue-${selectedYear}.csv`);
    } else {
      const rows = [
        ["Date","Description","Category","Amount","Notes"],
        ...expenses.map(e => [
          e.date,
          e.description,
          e.category,
          `$${(e.amount_cents / 100).toFixed(2)}`,
          e.notes ?? "",
        ]),
      ];
      downloadCSV(rows, `expenses-${selectedYear}.csv`);
    }
  };

  const downloadCSV = (rows: string[][], filename: string) => {
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Derived stats ───────────────────────────────────────────────────────────

  const totalRevenue = bookings.filter(b => b.completed).reduce((s, b) => s + b.total_cents, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const grossProfit = totalRevenue - totalExpenses;
  const estimatedTax = Math.max(0, Math.round(grossProfit * TAX_RATE));
  const netAfterTax = grossProfit - estimatedTax;

  const unpaidInvoices = invoices.filter(i => !i.paid);
  const unpaidTotal = unpaidInvoices.reduce((s, i) => s + i.total_cents, 0);

  // Month-by-month data for chart
  const monthlyData = MONTHS.map((label, m) => {
    const mStart = startOfMonth(selectedYear, m);
    const mEnd = endOfMonth(selectedYear, m);
    const rev = bookings
      .filter(b => b.completed && b.booking_date >= mStart && b.booking_date <= mEnd)
      .reduce((s, b) => s + b.total_cents, 0);
    const exp = expenses
      .filter(e => e.date >= mStart && e.date <= mEnd)
      .reduce((s, e) => s + e.amount_cents, 0);
    return { label, revenue: rev / 100, expenses: exp / 100, profit: (rev - exp) / 100 };
  });

  // Quarterly data
  const quarterlyData = QUARTERS.map((label, qi) => {
    const qMonths = QUARTER_MONTHS[qi];
    const rev = bookings
      .filter(b => {
        if (!b.completed || !b.booking_date) return false;
        const m = new Date(b.booking_date + "T00:00:00").getMonth();
        return qMonths.includes(m);
      })
      .reduce((s, b) => s + b.total_cents, 0);
    const exp = expenses
      .filter(e => {
        const m = new Date(e.date + "T00:00:00").getMonth();
        return qMonths.includes(m);
      })
      .reduce((s, e) => s + e.amount_cents, 0);
    const profit = rev - exp;
    return { label, revenue: rev / 100, expenses: exp / 100, profit: profit / 100, tax: Math.max(0, profit * TAX_RATE) / 100 };
  });

  const chartData = selectedPeriod === "monthly" ? monthlyData : quarterlyData;

  // Expense breakdown by category
  const expByCategory = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount_cents, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // Profit margin
  const margin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

  const years = [thisYear, thisYear - 1, thisYear - 2];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Accounting</h1>
          <p className="text-muted-foreground text-sm mt-0.5">P&L, expenses, taxes & QuickBooks sync</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector */}
          <div className="flex rounded-md border overflow-hidden">
            {years.map(y => (
              <button key={y} onClick={() => setSelectedYear(y)}
                className={["px-3 py-1.5 text-xs font-medium transition-colors border-r last:border-r-0",
                  selectedYear === y ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                ].join(" ")}>
                {y}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => exportCSV("revenue")}>
            <Download className="h-3.5 w-3.5" /> Revenue CSV
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => exportCSV("expenses")}>
            <Download className="h-3.5 w-3.5" /> Expenses CSV
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setExpModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Log Expense
          </Button>
        </div>
      </div>

      {/* ── QuickBooks Connection Card ────────────────────────────────────── */}
      <div className={[
        "rounded-xl border p-4",
        qbStatus.connected ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800" : "bg-card",
      ].join(" ")}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <div className={[
              "p-2 rounded-lg shrink-0",
              qbStatus.connected ? "bg-green-100 dark:bg-green-900/30" : "bg-muted",
            ].join(" ")}>
              {qbStatus.connected
                ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                : <Link2 className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <h2 className="font-semibold text-sm">
                {qbStatus.connected ? "QuickBooks Online Connected" : "Connect QuickBooks Online"}
              </h2>
              {qbStatus.connected ? (
                <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                  {qbStatus.companyName && <p>Company: <span className="font-medium text-foreground">{qbStatus.companyName}</span></p>}
                  {qbStatus.lastSync
                    ? <p>Last sync: {new Date(qbStatus.lastSync).toLocaleString()}</p>
                    : <p>Never synced — use the buttons below to push your data</p>}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-1 max-w-md">
                  Link your QuickBooks account to automatically sync customers, invoices, and expenses.
                  Requires a <span className="font-medium">QuickBooks Online</span> subscription and a developer app set up at{" "}
                  <a href="https://developer.intuit.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">developer.intuit.com</a>.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {qbStatus.connected ? (
              <>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                  disabled={syncing === "sync-customers"} onClick={() => syncToQB("sync-customers")}>
                  {syncing === "sync-customers" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Sync Customers
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                  disabled={syncing === "sync-invoices"} onClick={() => syncToQB("sync-invoices")}>
                  {syncing === "sync-invoices" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Sync Invoices
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                  disabled={syncing === "sync-expenses"} onClick={() => syncToQB("sync-expenses")}>
                  {syncing === "sync-expenses" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Sync Expenses
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={disconnectQB}>
                  <LinkOff className="h-3.5 w-3.5" /> Disconnect
                </Button>
              </>
            ) : (
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#2CA01C] hover:bg-[#249018] text-white"
                onClick={connectQuickBooks}>
                <Link2 className="h-3.5 w-3.5" /> Connect QuickBooks
              </Button>
            )}
          </div>
        </div>

        {/* Setup instructions when not connected */}
        {!qbStatus.connected && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Setup steps:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://developer.intuit.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">developer.intuit.com</a> → create an app → choose QuickBooks Online</li>
              <li>Set Redirect URI to: <code className="bg-muted px-1 rounded text-[10px]">{SUPABASE_URL}/functions/v1/quickbooks-auth</code></li>
              <li>Copy your Client ID & Client Secret</li>
              <li>Add them as Supabase env vars: <code className="bg-muted px-1 rounded text-[10px]">QB_CLIENT_ID</code> and <code className="bg-muted px-1 rounded text-[10px]">QB_CLIENT_SECRET</code></li>
              <li>Also add <code className="bg-muted px-1 rounded text-[10px]">APP_URL=https://www.glossworksky.com</code></li>
              <li>Click Connect above ↑</li>
            </ol>
          </div>
        )}
      </div>

      {/* ── P&L KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Gross Revenue" value={fmtK(totalRevenue)} sub={`${selectedYear}`} icon={DollarSign} color="green" />
        <StatCard label="Total Expenses" value={fmtK(totalExpenses)} sub={`${expByCategory[0]?.cat ?? "—"} is top cost`} icon={TrendingDown} color="red" />
        <StatCard label="Gross Profit" value={fmtK(grossProfit)} sub={`${margin}% margin`} icon={TrendingUp} color={grossProfit >= 0 ? "green" : "red"} />
        <StatCard label="Est. Tax (25%)" value={fmt$(estimatedTax)} sub="Self-employment est." icon={Calculator} color="amber" />
        <StatCard label="Net After Tax" value={fmtK(netAfterTax)} sub="Keep in pocket" icon={Wallet} color={netAfterTax >= 0 ? "green" : "red"} />
        <StatCard label="Unpaid Invoices" value={fmtK(unpaidTotal)} sub={`${unpaidInvoices.length} outstanding`} icon={Receipt} color="purple" />
      </div>

      {/* ── P&L Chart ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-semibold">Profit & Loss — {selectedYear}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue, expenses and net profit</p>
          </div>
          <div className="flex rounded-md border overflow-hidden text-xs">
            {(["monthly","quarterly"] as const).map(p => (
              <button key={p} onClick={() => setSelectedPeriod(p)}
                className={["px-3 py-1.5 font-medium capitalize transition-colors border-r last:border-r-0",
                  selectedPeriod === p ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                ].join(" ")}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                tickFormatter={v => v > 0 ? `$${v}` : ""} />
              <Tooltip
                formatter={(v: number, n: string) => [`$${v.toFixed(2)}`, n === "revenue" ? "Revenue" : n === "expenses" ? "Expenses" : n === "profit" ? "Profit" : "Est. Tax"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3,3,0,0]} maxBarSize={28} />
              <Bar dataKey="expenses" fill="#ef4444" opacity={0.7} radius={[3,3,0,0]} maxBarSize={28} />
              <Bar dataKey="profit" radius={[3,3,0,0]} maxBarSize={28}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.profit >= 0 ? "#10b981" : "#f97316"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-primary inline-block" /> Revenue</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-red-500/70 inline-block" /> Expenses</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> Net Profit</span>
        </div>
      </div>

      {/* ── Quarterly Tax Estimates ────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Quarterly Tax Estimates — {selectedYear}</h2>
          <Badge variant="outline" className="text-xs ml-1">~25% rate</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Estimated self-employment tax (15.3% SE + ~10% federal income). Talk to a CPA for exact figures.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quarterlyData.map((q, i) => {
            const qDue = [`Apr 15`, `Jun 15`, `Sep 15`, `Jan 15`][i];
            const isPast = q.revenue > 0 || q.expenses > 0;
            return (
              <div key={q.label} className={[
                "rounded-lg border p-3",
                i === Math.floor(thisMonth / 3) && selectedYear === thisYear
                  ? "border-primary bg-primary/5" : "",
              ].join(" ")}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{QUARTERS[i].split(" ")[0]}</span>
                  {i === Math.floor(thisMonth / 3) && selectedYear === thisYear && (
                    <Badge className="text-[10px] h-4 bg-primary/10 text-primary hover:bg-primary/10">Current</Badge>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">{QUARTERS[i].slice(3)}</div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Revenue</span>
                    <span>${q.revenue.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Expenses</span>
                    <span className="text-red-500">-${q.expenses.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t pt-1 mt-1">
                    <span className="text-muted-foreground">Est. tax</span>
                    <span className="font-bold text-amber-600">${q.tax.toFixed(0)}</span>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">Due: {qDue}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Set aside <strong>${(netAfterTax > 0 ? (netAfterTax / 100 * 0.25).toFixed(0) : "0")}</strong> for taxes on your {selectedYear} net income.
            Estimated quarterly payment: <strong>${(estimatedTax / 400).toFixed(0)}/quarter</strong>.
          </p>
        </div>
      </div>

      {/* ── Expenses + Category Breakdown ─────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Category breakdown */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Expense Breakdown</h2>
          </div>
          {expByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No expenses logged for {selectedYear}</p>
          ) : (
            <div className="space-y-2.5">
              {expByCategory.map((c) => (
                <div key={c.cat}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium">{c.cat}</span>
                    <span className="text-xs font-medium">{fmt$(c.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-red-400 transition-all"
                      style={{ width: `${(c.total / (expByCategory[0]?.total || 1)) * 100}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {Math.round((c.total / (totalExpenses || 1)) * 100)}% of total
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold pt-2 border-t">
                <span>Total</span>
                <span>{fmt$(totalExpenses)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent expenses */}
        <div className="md:col-span-2 rounded-xl border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Expenses — {selectedYear}</h2>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => setExpModal(true)}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No expenses logged for {selectedYear}</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-72">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b">
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{e.date}</td>
                      <td className="px-4 py-2 text-xs">
                        <div>{e.description}</div>
                        {e.notes && <div className="text-muted-foreground text-[10px]">{e.notes}</div>}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground hidden sm:table-cell">{e.category}</td>
                      <td className="px-4 py-2 text-xs font-medium text-right">{fmt$(e.amount_cents)}</td>
                      <td className="px-2 py-2">
                        <button onClick={() => setDeleteExpId(e.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Invoices ────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h2 className="font-semibold text-sm">Invoices</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{unpaidInvoices.length} unpaid · {fmt$(unpaidTotal)} outstanding</p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => exportCSV("revenue")}>
            <FileText className="h-3 w-3" /> Export
          </Button>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Invoice #</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 10).map(inv => (
                  <tr key={inv.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-2 text-xs font-medium">{inv.customer_name}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground hidden md:table-cell">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-xs font-bold text-right">{fmt$(inv.total_cents)}</td>
                    <td className="px-4 py-2">
                      {inv.paid
                        ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px]">Paid</Badge>
                        : <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-[10px]">Unpaid</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Log Expense Modal ──────────────────────────────────────────────── */}
      <Dialog open={expModal} onOpenChange={setExpModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs mb-1 block">Date</Label>
              <Input type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} /></div>
            <div><Label className="text-xs mb-1 block">Description *</Label>
              <Input placeholder="e.g. Detail spray, microfiber cloths" value={expForm.description}
                onChange={e => setExpForm({ ...expForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Category</Label>
                <Select value={expForm.category} onValueChange={v => setExpForm({ ...expForm, category: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label className="text-xs mb-1 block">Amount ($) *</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={expForm.amount}
                  onChange={e => setExpForm({ ...expForm, amount: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Notes</Label>
              <Input placeholder="Where purchased, etc." value={expForm.notes}
                onChange={e => setExpForm({ ...expForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpModal(false)}>Cancel</Button>
            <Button onClick={saveExpense} disabled={expSaving}>{expSaving ? "Saving…" : "Log Expense"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Expense Confirm ─────────────────────────────────────────── */}
      <Dialog open={!!deleteExpId} onOpenChange={() => setDeleteExpId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Expense?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteExpId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteExpense}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingPage;
