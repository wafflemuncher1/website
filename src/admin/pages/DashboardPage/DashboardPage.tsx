import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  DollarSign,
  CalendarDays,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Receipt,
  Car,
  ArrowRight,
  Plus,
  MapPin,
  Phone,
  Wrench,
  CloudRain,
  RefreshCw,
  Package,
  Wallet,
  Target,
  BarChart2,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const today = ymd(new Date());

const startOfMonth = (d = new Date()) => ymd(new Date(d.getFullYear(), d.getMonth(), 1));
const startOfWeek = (d = new Date()) => {
  const r = new Date(d);
  r.setDate(d.getDate() - d.getDay());
  return ymd(r);
};
const startOfYear = (d = new Date()) => ymd(new Date(d.getFullYear(), 0, 1));

const fmt$ = (cents: number) => {
  if (cents >= 100000) return `$${(cents / 100000).toFixed(1)}k`;
  return `$${(cents / 100).toFixed(0)}`;
};
const fmt$full = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const fmtDate = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

const fmtDateLong = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

const daysAgo = (n: number) => ymd(new Date(Date.now() - n * 86400000));

const EXPENSE_CATEGORIES = [
  "Supplies", "Chemicals", "Equipment", "Fuel", "Marketing",
  "Insurance", "Phone/Software", "Vehicle Maintenance", "Other",
];

const SERVICE_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id: string;
  created_at: string;
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
  completed: boolean;
  condition: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_cents: number;
  paid: boolean;
  created_at: string;
};

type Expense = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount_cents: number;
};

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  body: string;
  approved: boolean;
  created_at: string;
};

type RescheduleRequest = {
  id: string;
  day: string;
  reason: string;
  status: string;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  color = "default",
  onClick,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: "default" | "green" | "blue" | "amber" | "red" | "purple";
  onClick?: () => void;
  trend?: { value: number; label: string };
}) => {
  const iconColors = {
    default: "bg-muted text-muted-foreground",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div
      onClick={onClick}
      className={[
        "rounded-xl border bg-card p-4 transition-all",
        onClick ? "cursor-pointer hover:shadow-md hover:border-primary/30" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconColors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend !== undefined && (
          <span className={[
            "text-xs font-medium px-1.5 py-0.5 rounded-full",
            trend.value >= 0
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          ].join(" ")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs font-medium text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      {trend !== undefined && (
        <div className="text-xs text-muted-foreground mt-1">{trend.label}</div>
      )}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const DashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [revenueRange, setRevenueRange] = useState<"30d" | "12m">("30d");
  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    date: today,
    description: "",
    category: "Supplies",
    amount: "",
    notes: "",
  });

  // ── Data state ─────────────────────────────────────────────────────────────

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reschedules, setReschedules] = useState<RescheduleRequest[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // ── Fetch all data ─────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const yearStart = startOfYear();

    const [bRes, invRes, expRes, revRes, rescRes, custRes] = await Promise.all([
      // All bookings this year
      supabase
        .from("estimate_requests")
        .select("id,created_at,name,email,phone,service,vehicle_size,total_cents,booking_date,booking_time,duration_mins,address,city,completed,condition")
        .gte("created_at", yearStart + "T00:00:00")
        .order("created_at", { ascending: false }),
      // Invoices
      supabase
        .from("invoices")
        .select("id,invoice_number,customer_name,total_cents,paid,created_at")
        .order("created_at", { ascending: false }),
      // Expenses this year
      supabase
        .from("expenses")
        .select("*")
        .gte("date", yearStart)
        .order("date", { ascending: false }),
      // Reviews
      supabase.from("reviews").select("id,customer_name,rating,body,approved,created_at").order("created_at", { ascending: false }),
      // Pending reschedules
      supabase.from("reschedule_requests").select("*").eq("status", "pending").order("day"),
      // Total unique customers (count of all-time estimate_requests)
      supabase.from("estimate_requests").select("id", { count: "exact", head: true }),
    ]);

    if (bRes.data) setAllBookings(bRes.data as Booking[]);
    if (invRes.data) setInvoices(invRes.data as Invoice[]);
    if (expRes.data) setExpenses(expRes.data as Expense[]);
    if (revRes.data) setReviews(revRes.data as Review[]);
    if (rescRes.data) setReschedules(rescRes.data as RescheduleRequest[]);
    if (custRes.count !== null) setTotalCustomers(custRes.count);

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const todayBookings = allBookings.filter(b => b.booking_date === today);
  const weekBookings = allBookings.filter(b => b.booking_date >= startOfWeek() && b.booking_date <= today);
  const monthBookings = allBookings.filter(b => b.booking_date >= startOfMonth() && b.booking_date <= today);

  const todayRevenue = todayBookings.filter(b => b.completed).reduce((s, b) => s + b.total_cents, 0);
  const weekRevenue = weekBookings.filter(b => b.completed).reduce((s, b) => s + b.total_cents, 0);
  const monthRevenue = monthBookings.filter(b => b.completed).reduce((s, b) => s + b.total_cents, 0);
  const yearRevenue = allBookings.filter(b => b.completed).reduce((s, b) => s + b.total_cents, 0);

  // Last month for trend comparison
  const lastMonthStart = ymd(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  const lastMonthEnd = ymd(new Date(new Date().getFullYear(), new Date().getMonth(), 0));
  const lastMonthRevenue = allBookings
    .filter(b => b.completed && b.booking_date >= lastMonthStart && b.booking_date <= lastMonthEnd)
    .reduce((s, b) => s + b.total_cents, 0);
  const revenueTrend = lastMonthRevenue > 0
    ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0;

  const monthExpenses = expenses
    .filter(e => e.date >= startOfMonth())
    .reduce((s, e) => s + e.amount_cents, 0);
  const yearExpenses = expenses.reduce((s, e) => s + e.amount_cents, 0);

  const monthProfit = monthRevenue - monthExpenses;
  const yearProfit = yearRevenue - yearExpenses;

  const unpaidInvoices = invoices.filter(i => !i.paid);
  const unpaidTotal = unpaidInvoices.reduce((s, i) => s + i.total_cents, 0);

  const completedTotal = allBookings.filter(b => b.completed).length;
  const completionRate = allBookings.length > 0
    ? Math.round((completedTotal / allBookings.length) * 100)
    : 0;

  const avgJobValue = completedTotal > 0
    ? Math.round(yearRevenue / completedTotal)
    : 0;

  const pendingReviews = reviews.filter(r => !r.approved).length;
  const avgRating = reviews.filter(r => r.approved).length > 0
    ? (reviews.filter(r => r.approved).reduce((s, r) => s + r.rating, 0) / reviews.filter(r => r.approved).length).toFixed(1)
    : "—";

  // Upcoming bookings (not completed, future)
  const upcomingBookings = allBookings
    .filter(b => !b.completed && b.booking_date >= today)
    .sort((a, b) => (a.booking_date > b.booking_date ? 1 : -1))
    .slice(0, 8);

  // ── Revenue chart data ─────────────────────────────────────────────────────

  const revenueChartData = (() => {
    if (revenueRange === "30d") {
      return Array.from({ length: 30 }, (_, i) => {
        const d = ymd(new Date(Date.now() - (29 - i) * 86400000));
        const rev = allBookings
          .filter(b => b.completed && b.booking_date === d)
          .reduce((s, b) => s + b.total_cents, 0);
        const exp = expenses
          .filter(e => e.date === d)
          .reduce((s, e) => s + e.amount_cents, 0);
        return { label: fmtDate(d), date: d, revenue: rev / 100, expenses: exp / 100 };
      });
    }
    // 12 months
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const mStart = ymd(new Date(d.getFullYear(), d.getMonth(), 1));
      const mEnd = ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      const rev = allBookings
        .filter(b => b.completed && b.booking_date >= mStart && b.booking_date <= mEnd)
        .reduce((s, b) => s + b.total_cents, 0);
      const exp = expenses
        .filter(e => e.date >= mStart && e.date <= mEnd)
        .reduce((s, e) => s + e.amount_cents, 0);
      return {
        label: d.toLocaleDateString("en-US", { month: "short" }),
        revenue: rev / 100,
        expenses: exp / 100,
      };
    });
  })();

  // ── Service breakdown ──────────────────────────────────────────────────────

  const serviceBreakdown = (() => {
    const counts: Record<string, { count: number; revenue: number }> = {};
    allBookings.forEach(b => {
      const svc = b.service || "Unknown";
      if (!counts[svc]) counts[svc] = { count: 0, revenue: 0 };
      counts[svc].count++;
      if (b.completed) counts[svc].revenue += b.total_cents;
    });
    return Object.entries(counts)
      .map(([name, { count, revenue }]) => ({ name, count, revenue: revenue / 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  })();

  // ── Vehicle breakdown ──────────────────────────────────────────────────────

  const vehicleBreakdown = (() => {
    const counts: Record<string, number> = {};
    allBookings.forEach(b => {
      const v = b.vehicle_size || "Unknown";
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  })();

  // ── Expense category breakdown ─────────────────────────────────────────────

  const expenseCategoryData = (() => {
    const cats: Record<string, number> = {};
    expenses.filter(e => e.date >= startOfMonth()).forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount_cents;
    });
    return Object.entries(cats)
      .map(([name, amount]) => ({ name, amount: amount / 100 }))
      .sort((a, b) => b.amount - a.amount);
  })();

  // ── Save expense ───────────────────────────────────────────────────────────

  const handleSaveExpense = async () => {
    if (!expenseForm.description.trim() || !expenseForm.amount) {
      toast({ title: "Description and amount required", variant: "destructive" });
      return;
    }
    setExpenseSaving(true);
    const { error } = await supabase.from("expenses").insert({
      date: expenseForm.date,
      description: expenseForm.description,
      category: expenseForm.category,
      amount_cents: Math.round(parseFloat(expenseForm.amount) * 100),
      notes: expenseForm.notes || null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Expense logged ✓" });
      setExpenseModal(false);
      setExpenseForm({ date: today, description: "", category: "Supplies", amount: "", notes: "" });
      fetchAll();
    }
    setExpenseSaving(false);
  };

  // ── Mark complete ──────────────────────────────────────────────────────────

  const markComplete = async (id: string) => {
    await supabase.from("estimate_requests").update({ completed: true }).eq("id", id);
    toast({ title: "Job marked complete ✓" });
    fetchAll();
  };

  // ── Greet ──────────────────────────────────────────────────────────────────

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{greeting} 👋</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{dateDisplay}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={fetchAll}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setExpenseModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Log Expense
          </Button>
        </div>
      </div>

      {/* ── Alerts bar ─────────────────────────────────────────────────────── */}
      {(todayBookings.length > 0 || unpaidInvoices.length > 0 || pendingReviews > 0 || reschedules.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {todayBookings.filter(b => !b.completed).length > 0 && (
            <button onClick={() => navigate("/admin/availability")}
              className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
              <Clock className="h-3 w-3" />
              {todayBookings.filter(b => !b.completed).length} job{todayBookings.filter(b => !b.completed).length > 1 ? "s" : ""} today
            </button>
          )}
          {unpaidInvoices.length > 0 && (
            <button onClick={() => navigate("/admin/invoices")}
              className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
              <AlertTriangle className="h-3 w-3" />
              {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length > 1 ? "s" : ""} · {fmt$(unpaidTotal)}
            </button>
          )}
          {pendingReviews > 0 && (
            <button onClick={() => navigate("/admin/reviews")}
              className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
              <Star className="h-3 w-3" />
              {pendingReviews} review{pendingReviews > 1 ? "s" : ""} pending approval
            </button>
          )}
          {reschedules.length > 0 && (
            <button onClick={() => navigate("/admin/calender")}
              className="flex items-center gap-1.5 text-xs bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
              <CloudRain className="h-3 w-3" />
              {reschedules.length} pending reschedule{reschedules.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Today's Revenue" value={fmt$(todayRevenue)} sub={`${todayBookings.filter(b => b.completed).length} job${todayBookings.filter(b => b.completed).length !== 1 ? "s" : ""} done`} icon={DollarSign} color="green" />
        <StatCard label="This Week" value={fmt$(weekRevenue)} sub={`${weekBookings.filter(b => b.completed).length} jobs`} icon={TrendingUp} color="green" trend={{ value: revenueTrend, label: "vs last month" }} />
        <StatCard label="This Month" value={fmt$(monthRevenue)} sub={`${fmt$(monthExpenses)} expenses`} icon={BarChart2} color="blue" />
        <StatCard label="Net Profit (Mo.)" value={fmt$(monthProfit)} sub={monthProfit >= 0 ? "Profitable" : "In the red"} icon={Wallet} color={monthProfit >= 0 ? "green" : "red"} />
        <StatCard label="Unpaid Invoices" value={fmt$(unpaidTotal)} sub={`${unpaidInvoices.length} outstanding`} icon={Receipt} color="amber" onClick={() => navigate("/admin/invoices")} />
        <StatCard label="Total Clients" value={String(totalCustomers)} sub="all time" icon={Users} color="purple" onClick={() => navigate("/admin/bookings")} />
      </div>

      {/* ── Secondary stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${completionRate}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{completedTotal} of {allBookings.length} jobs</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Avg Job Value</span>
          </div>
          <div className="text-2xl font-bold">{fmt$(avgJobValue)}</div>
          <div className="text-xs text-muted-foreground mt-1">Year to date</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Year Revenue</span>
          </div>
          <div className="text-2xl font-bold">{fmt$(yearRevenue)}</div>
          <div className="text-xs text-muted-foreground mt-1">{fmt$(yearExpenses)} in expenses</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Avg Rating</span>
          </div>
          <div className="text-2xl font-bold">{avgRating} <span className="text-base">⭐</span></div>
          <div className="text-xs text-muted-foreground mt-1">{reviews.filter(r => r.approved).length} approved reviews</div>
        </div>
      </div>

      {/* ── Revenue + Expenses Chart ────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-semibold">Revenue & Expenses</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {revenueRange === "30d" ? "Last 30 days" : "Last 12 months"}
            </p>
          </div>
          <div className="flex rounded-md border overflow-hidden text-xs">
            {(["30d", "12m"] as const).map(r => (
              <button key={r} onClick={() => setRevenueRange(r)}
                className={["px-3 py-1.5 font-medium transition-colors border-r last:border-r-0",
                  revenueRange === r ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                ].join(" ")}>
                {r === "30d" ? "30 Days" : "12 Months"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval={revenueRange === "30d" ? 6 : 0} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                tickFormatter={v => v > 0 ? `$${v}` : ""} />
              <Tooltip
                formatter={(v: number, n: string) => [`$${v.toFixed(2)}`, n === "revenue" ? "Revenue" : "Expenses"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} opacity={0.6} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Chart legend */}
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-primary inline-block" /> Revenue</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-destructive/60 inline-block" /> Expenses</span>
        </div>
      </div>

      {/* ── Today's Schedule + Upcoming ─────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Today */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <h2 className="font-semibold text-sm">Today's Schedule</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <button onClick={() => navigate("/admin/availability")}
              className="text-xs text-primary flex items-center gap-1 hover:underline">
              Calendar <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="p-4">
            {todayBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No jobs scheduled today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBookings.map(b => (
                  <div key={b.id} className={["rounded-lg border p-3 transition-opacity", b.completed ? "opacity-50" : ""].join(" ")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{b.name}</span>
                          {b.completed && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] h-4">Done</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> {b.booking_time} · {b.duration_mins} min
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Wrench className="h-3 w-3" /> {b.service} · {b.vehicle_size}
                          </div>
                          {b.address && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" /> {b.address}, {b.city}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" /> {b.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-bold text-sm text-primary">{fmt$(b.total_cents)}</span>
                        {!b.completed && (
                          <button onClick={() => markComplete(b.id)}
                            className="flex items-center gap-1 text-[10px] text-green-600 hover:text-green-700 border border-green-200 rounded px-1.5 py-0.5 hover:bg-green-50 transition-colors">
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-right text-xs font-semibold text-muted-foreground pt-1">
                  Today's total: <span className="text-foreground">{fmt$(todayBookings.reduce((s, b) => s + b.total_cents, 0))}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <h2 className="font-semibold text-sm">Upcoming Jobs</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fmt$(upcomingBookings.filter(b => !b.completed).reduce((s, b) => s + b.total_cents, 0))} pending revenue
              </p>
            </div>
            <button onClick={() => navigate("/admin/bookings")}
              className="text-xs text-primary flex items-center gap-1 hover:underline">
              All bookings <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="p-4">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No upcoming bookings</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 py-1.5 border-b last:border-b-0">
                    <div className="text-center shrink-0 w-10">
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {new Date(b.booking_date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}
                      </div>
                      <div className="text-lg font-bold leading-none">
                        {parseInt(b.booking_date.slice(-2))}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{b.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {b.booking_time} · {b.service}
                      </div>
                    </div>
                    <div className="text-sm font-bold shrink-0">{fmt$(b.total_cents)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Service + Vehicle + Expense breakdowns ──────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Service popularity */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Top Services</h2>
          </div>
          {serviceBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {serviceBreakdown.map((s, i) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{s.name || "—"}</span>
                    <span className="text-xs text-muted-foreground">{s.count} job{s.count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(s.count / (serviceBreakdown[0]?.count || 1)) * 100}%`, backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle breakdown */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Car className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Vehicle Sizes</h2>
          </div>
          {vehicleBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {vehicleBreakdown.map((v, i) => (
                <div key={v.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{v.name}</span>
                    <span className="text-xs text-muted-foreground">{v.count} ({Math.round((v.count / allBookings.length) * 100)}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(v.count / (vehicleBreakdown[0]?.count || 1)) * 100}%`, backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Expenses This Month</h2>
            </div>
            <button onClick={() => setExpenseModal(true)}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
              <Plus className="h-3 w-3" /> Log
            </button>
          </div>
          {expenseCategoryData.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No expenses logged</p>
              <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => setExpenseModal(true)}>
                <Plus className="h-3 w-3 mr-1" /> Log Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {expenseCategoryData.map((e, i) => (
                <div key={e.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{e.name}</span>
                    <span className="text-xs font-medium">${e.amount.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-destructive/60 transition-all"
                      style={{ width: `${(e.amount / (expenseCategoryData[0]?.amount || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-xs font-semibold pt-2 border-t">
                <span>Total expenses</span>
                <span>{fmt$full(monthExpenses)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Bookings ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-sm">Recent Bookings</h2>
          <button onClick={() => navigate("/admin/bookings")}
            className="text-xs text-primary flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Service</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Vehicle</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {allBookings.slice(0, 8).map(b => (
                <tr key={b.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {b.booking_date ? fmtDateLong(b.booking_date) : fmtDate(b.created_at.slice(0, 10))}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.phone}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{b.service || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{b.vehicle_size || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{fmt$(b.total_cents)}</td>
                  <td className="px-4 py-2.5">
                    {b.completed ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px]">Done</Badge>
                    ) : (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-[10px]">Upcoming</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Log Expense Modal ───────────────────────────────────────────────── */}
      <Dialog open={expenseModal} onOpenChange={setExpenseModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Date</Label>
              <Input type="date" value={expenseForm.date}
                onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Description *</Label>
              <Input placeholder="e.g. Detail spray, microfiber cloths" value={expenseForm.description}
                onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Category</Label>
                <Select value={expenseForm.category} onValueChange={v => setExpenseForm({ ...expenseForm, category: v })}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Amount ($) *</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Notes (optional)</Label>
              <Input placeholder="Where did you buy it, etc." value={expenseForm.notes}
                onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseModal(false)}>Cancel</Button>
            <Button onClick={handleSaveExpense} disabled={expenseSaving}>
              {expenseSaving ? "Saving…" : "Log Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;