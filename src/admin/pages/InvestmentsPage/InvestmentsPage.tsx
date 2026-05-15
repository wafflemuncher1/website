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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  ExternalLink,
  Target,
  TrendingUp,
  Package,
  Star,
  ChevronUp,
  ChevronDown,
  Flag,
  Sparkles,
  Zap,
  Trophy,
  DollarSign,
  Calendar,
  RotateCcw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Investment = {
  id: string;
  created_at: string;
  name: string;
  description: string;
  price_cents: number;
  tier: "small" | "medium" | "big";
  category: string;
  url: string;
  priority: number;
  purchased: boolean;
  purchased_at: string | null;
  notes: string;
};

type Goal = {
  id: string;
  created_at: string;
  title: string;
  description: string;
  category: string;
  target_date: string | null;
  target_value_cents: number | null;
  current_value_cents: number;
  completed: boolean;
  completed_at: string | null;
  pinned: boolean;
  sort_order: number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const TIERS = {
  small: {
    label: "Small Upgrade",
    desc: "Under $200",
    icon: Zap,
    color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    badge: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    ring: "ring-green-500/30",
    dot: "bg-green-500",
  },
  medium: {
    label: "Medium Upgrade",
    desc: "$200–$1,000",
    icon: Package,
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    ring: "ring-blue-500/30",
    dot: "bg-blue-500",
  },
  big: {
    label: "Big Upgrade",
    desc: "$1,000+",
    icon: Sparkles,
    color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
    badge: "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    ring: "ring-purple-500/30",
    dot: "bg-purple-500",
  },
} as const;

const GOAL_CATEGORIES = [
  { value: "revenue", label: "Revenue", icon: DollarSign, color: "text-green-600" },
  { value: "equipment", label: "Equipment", icon: Package, color: "text-blue-600" },
  { value: "marketing", label: "Marketing", icon: TrendingUp, color: "text-purple-600" },
  { value: "personal", label: "Personal", icon: Star, color: "text-amber-600" },
  { value: "business", label: "Business", icon: Flag, color: "text-red-600" },
  { value: "other", label: "Other", icon: Target, color: "text-muted-foreground" },
];

const INVESTMENT_CATEGORIES = [
  "Chemicals & Supplies", "Equipment", "Tools", "Vehicle",
  "Marketing", "Software", "Training", "Other",
];

const fmt$ = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtDate = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

const daysUntil = (s: string) => {
  const diff = new Date(s + "T00:00:00").getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const EmptyState = ({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <p className="font-medium text-sm">{title}</p>
    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const InvestmentsPage = () => {
  const { toast } = useToast();

  // ── Investments state ──────────────────────────────────────────────────────
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invFilter, setInvFilter] = useState<"all" | "pending" | "purchased">("pending");
  const [invModal, setInvModal] = useState(false);
  const [editingInv, setEditingInv] = useState<Investment | null>(null);
  const [invForm, setInvForm] = useState({
    name: "", description: "", price: "", tier: "small" as "small" | "medium" | "big",
    category: "Chemicals & Supplies", url: "", notes: "",
  });
  const [invSaving, setInvSaving] = useState(false);
  const [deleteInvId, setDeleteInvId] = useState<string | null>(null);

  // ── Goals state ────────────────────────────────────────────────────────────
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalLoading, setGoalLoading] = useState(true);
  const [goalFilter, setGoalFilter] = useState<"active" | "completed" | "all">("active");
  const [goalModal, setGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [progressModal, setProgressModal] = useState<Goal | null>(null);
  const [progressValue, setProgressValue] = useState("");
  const [goalForm, setGoalForm] = useState({
    title: "", description: "", category: "business",
    target_date: "", target_value: "", notes: "",
  });
  const [goalSaving, setGoalSaving] = useState(false);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchInvestments = useCallback(async () => {
    setInvLoading(true);
    const { data } = await supabase
      .from("investments")
      .select("*")
      .order("purchased", { ascending: true })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });
    if (data) setInvestments(data as Investment[]);
    setInvLoading(false);
  }, []);

  const fetchGoals = useCallback(async () => {
    setGoalLoading(true);
    const { data } = await supabase
      .from("goals")
      .select("*")
      .order("pinned", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (data) setGoals(data as Goal[]);
    setGoalLoading(false);
  }, []);

  useEffect(() => { fetchInvestments(); fetchGoals(); }, [fetchInvestments, fetchGoals]);

  // ── Investment actions ─────────────────────────────────────────────────────

  const openAddInv = () => {
    setEditingInv(null);
    setInvForm({ name: "", description: "", price: "", tier: "small", category: "Chemicals & Supplies", url: "", notes: "" });
    setInvModal(true);
  };

  const openEditInv = (inv: Investment) => {
    setEditingInv(inv);
    setInvForm({
      name: inv.name,
      description: inv.description || "",
      price: inv.price_cents ? (inv.price_cents / 100).toFixed(0) : "",
      tier: inv.tier,
      category: inv.category || "Chemicals & Supplies",
      url: inv.url || "",
      notes: inv.notes || "",
    });
    setInvModal(true);
  };

  const saveInvestment = async () => {
    if (!invForm.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setInvSaving(true);
    const payload = {
      name: invForm.name.trim(),
      description: invForm.description || null,
      price_cents: invForm.price ? Math.round(parseFloat(invForm.price) * 100) : 0,
      tier: invForm.tier,
      category: invForm.category,
      url: invForm.url || null,
      notes: invForm.notes || null,
    };
    if (editingInv) {
      const { error } = await supabase.from("investments").update(payload).eq("id", editingInv.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Updated ✓" }); setInvModal(false); fetchInvestments(); }
    } else {
      const { error } = await supabase.from("investments").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Added to wishlist ✓" }); setInvModal(false); fetchInvestments(); }
    }
    setInvSaving(false);
  };

  const markPurchased = async (inv: Investment) => {
    const { error } = await supabase.from("investments").update({
      purchased: !inv.purchased,
      purchased_at: !inv.purchased ? new Date().toISOString() : null,
    }).eq("id", inv.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: inv.purchased ? "Marked as not purchased" : "Marked as purchased ✓" }); fetchInvestments(); }
  };

  const deleteInvestment = async () => {
    if (!deleteInvId) return;
    await supabase.from("investments").delete().eq("id", deleteInvId);
    toast({ title: "Removed" });
    setDeleteInvId(null);
    fetchInvestments();
  };

  // ── Goal actions ───────────────────────────────────────────────────────────

  const openAddGoal = () => {
    setEditingGoal(null);
    setGoalForm({ title: "", description: "", category: "business", target_date: "", target_value: "", notes: "" });
    setGoalModal(true);
  };

  const openEditGoal = (g: Goal) => {
    setEditingGoal(g);
    setGoalForm({
      title: g.title,
      description: g.description || "",
      category: g.category,
      target_date: g.target_date || "",
      target_value: g.target_value_cents ? (g.target_value_cents / 100).toFixed(0) : "",
      notes: "",
    });
    setGoalModal(true);
  };

  const saveGoal = async () => {
    if (!goalForm.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setGoalSaving(true);
    const payload = {
      title: goalForm.title.trim(),
      description: goalForm.description || null,
      category: goalForm.category,
      target_date: goalForm.target_date || null,
      target_value_cents: goalForm.target_value ? Math.round(parseFloat(goalForm.target_value) * 100) : null,
    };
    if (editingGoal) {
      const { error } = await supabase.from("goals").update(payload).eq("id", editingGoal.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Goal updated ✓" }); setGoalModal(false); fetchGoals(); }
    } else {
      const { error } = await supabase.from("goals").insert({ ...payload, sort_order: goals.length });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Goal added ✓" }); setGoalModal(false); fetchGoals(); }
    }
    setGoalSaving(false);
  };

  const toggleComplete = async (g: Goal) => {
    const { error } = await supabase.from("goals").update({
      completed: !g.completed,
      completed_at: !g.completed ? new Date().toISOString() : null,
    }).eq("id", g.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: g.completed ? "Goal reopened" : "Goal completed! 🎉" }); fetchGoals(); }
  };

  const togglePin = async (g: Goal) => {
    await supabase.from("goals").update({ pinned: !g.pinned }).eq("id", g.id);
    fetchGoals();
  };

  const saveProgress = async () => {
    if (!progressModal) return;
    const cents = Math.round(parseFloat(progressValue || "0") * 100);
    const { error } = await supabase.from("goals").update({ current_value_cents: cents }).eq("id", progressModal.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Progress updated ✓" }); setProgressModal(null); setProgressValue(""); fetchGoals(); }
  };

  const deleteGoal = async () => {
    if (!deleteGoalId) return;
    await supabase.from("goals").delete().eq("id", deleteGoalId);
    toast({ title: "Goal removed" });
    setDeleteGoalId(null);
    fetchGoals();
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const pendingInv = investments.filter(i => !i.purchased);
  const purchasedInv = investments.filter(i => i.purchased);
  const totalWishlist = pendingInv.reduce((s, i) => s + i.price_cents, 0);
  const totalSpent = purchasedInv.reduce((s, i) => s + i.price_cents, 0);

  const filteredInv = investments.filter(i =>
    invFilter === "all" ? true : invFilter === "pending" ? !i.purchased : i.purchased
  );

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  const filteredGoals = goals.filter(g =>
    goalFilter === "active" ? !g.completed :
    goalFilter === "completed" ? g.completed : true
  );

  // Group pending investments by tier
  const byTier = (["small", "medium", "big"] as const).map(tier => ({
    tier,
    items: filteredInv.filter(i => i.tier === tier),
  })).filter(g => g.items.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8">

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  INVESTMENTS SECTION                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Investment Wishlist
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Track gear, equipment, and upgrades you want for the business
            </p>
          </div>
          <Button onClick={openAddInv} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">Wishlist total</p>
            <p className="text-xl font-bold text-primary">{fmt$(totalWishlist)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{pendingInv.length} item{pendingInv.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">Already purchased</p>
            <p className="text-xl font-bold">{fmt$(totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{purchasedInv.length} item{purchasedInv.length !== 1 ? "s" : ""}</p>
          </div>
          {(["small","medium","big"] as const).map(tier => (
            <div key={tier} className={`rounded-xl border p-3 ${TIERS[tier].color}`}>
              <p className="text-xs font-medium opacity-80">{TIERS[tier].label}s</p>
              <p className="text-xl font-bold">
                {investments.filter(i => i.tier === tier && !i.purchased).length}
              </p>
              <p className="text-xs opacity-70 mt-0.5">{TIERS[tier].desc}</p>
            </div>
          )).slice(0, 2)}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex rounded-md border overflow-hidden text-xs">
            {(["pending","all","purchased"] as const).map(f => (
              <button key={f} onClick={() => setInvFilter(f)}
                className={["px-3 py-1.5 font-medium capitalize transition-colors border-r last:border-r-0",
                  invFilter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                ].join(" ")}>
                {f === "pending" ? `Wishlist (${pendingInv.length})` : f === "purchased" ? `Purchased (${purchasedInv.length})` : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Investment list */}
        {invLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredInv.length === 0 ? (
          <EmptyState icon={Package}
            title={invFilter === "purchased" ? "Nothing purchased yet" : "Your wishlist is empty"}
            sub={invFilter === "pending" ? "Add gear, chemicals, equipment — anything you want to buy for the business" : "Items you mark as purchased will show up here"} />
        ) : (
          /* Group by tier when viewing pending/all */
          invFilter === "purchased" ? (
            <div className="space-y-3">
              {filteredInv.map(inv => <InvestmentCard key={inv.id} inv={inv} onMark={markPurchased} onEdit={openEditInv} onDelete={id => setDeleteInvId(id)} />)}
            </div>
          ) : (
            <div className="space-y-6">
              {byTier.map(({ tier, items }) => {
                const T = TIERS[tier];
                const TierIcon = T.icon;
                return (
                  <div key={tier}>
                    <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border ${T.color}`}>
                      <TierIcon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{T.label}s</span>
                      <span className="text-xs opacity-70">— {T.desc}</span>
                      <span className="ml-auto text-xs font-bold">
                        {fmt$(items.filter(i => !i.purchased).reduce((s, i) => s + i.price_cents, 0))} needed
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {items.map(inv => (
                        <InvestmentCard key={inv.id} inv={inv} onMark={markPurchased} onEdit={openEditInv} onDelete={id => setDeleteInvId(id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  DIVIDER                                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground px-2">GOALS</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  GOALS SECTION                                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              Goals
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              What you're working toward — business, revenue, personal
            </p>
          </div>
          <Button onClick={openAddGoal} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Goal
          </Button>
        </div>

        {/* Goal stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-xl font-bold">{activeGoals.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">in progress</p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-xl font-bold text-green-600">{completedGoals.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">achieved 🎉</p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">Completion rate</p>
            <p className="text-xl font-bold">
              {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{goals.length} total</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex rounded-md border overflow-hidden text-xs">
            {(["active","completed","all"] as const).map(f => (
              <button key={f} onClick={() => setGoalFilter(f)}
                className={["px-3 py-1.5 font-medium capitalize transition-colors border-r last:border-r-0",
                  goalFilter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                ].join(" ")}>
                {f === "active" ? `Active (${activeGoals.length})` : f === "completed" ? `Done (${completedGoals.length})` : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Goal cards */}
        {goalLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredGoals.length === 0 ? (
          <EmptyState icon={Trophy}
            title={goalFilter === "completed" ? "No completed goals yet" : "No goals yet"}
            sub="Add revenue targets, business milestones, personal goals — anything you're working toward" />
        ) : (
          <div className="space-y-3">
            {filteredGoals.map(g => (
              <GoalCard
                key={g.id} goal={g}
                onToggle={toggleComplete}
                onPin={togglePin}
                onEdit={openEditGoal}
                onProgress={goal => { setProgressModal(goal); setProgressValue(goal.current_value_cents ? (goal.current_value_cents / 100).toFixed(0) : ""); }}
                onDelete={id => setDeleteGoalId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add/Edit Investment Modal ────────────────────────────────────────── */}
      <Dialog open={invModal} onOpenChange={setInvModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingInv ? "Edit Item" : "Add to Wishlist"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Name *</Label>
              <Input placeholder="e.g. Flex XFE 7-15 Polisher" value={invForm.name}
                onChange={e => setInvForm({ ...invForm, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Description</Label>
              <Textarea placeholder="Why you want it, what it does…" value={invForm.description}
                onChange={e => setInvForm({ ...invForm, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Price ($)</Label>
                <Input type="number" min="0" step="1" placeholder="0" value={invForm.price}
                  onChange={e => setInvForm({ ...invForm, price: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Tier</Label>
                <Select value={invForm.tier} onValueChange={v => setInvForm({ ...invForm, tier: v as "small" | "medium" | "big" })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small" className="text-xs">⚡ Small (&lt;$200)</SelectItem>
                    <SelectItem value="medium" className="text-xs">📦 Medium ($200–$1k)</SelectItem>
                    <SelectItem value="big" className="text-xs">✨ Big ($1k+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Category</Label>
              <Select value={invForm.category} onValueChange={v => setInvForm({ ...invForm, category: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVESTMENT_CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Link (optional)</Label>
              <Input placeholder="https://amazon.com/..." value={invForm.url}
                onChange={e => setInvForm({ ...invForm, url: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Notes</Label>
              <Input placeholder="Where to buy, promo codes, alternatives…" value={invForm.notes}
                onChange={e => setInvForm({ ...invForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvModal(false)}>Cancel</Button>
            <Button onClick={saveInvestment} disabled={invSaving}>
              {invSaving ? "Saving…" : editingInv ? "Save Changes" : "Add to Wishlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit Goal Modal ──────────────────────────────────────────────── */}
      <Dialog open={goalModal} onOpenChange={setGoalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "Add Goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Title *</Label>
              <Input placeholder="e.g. Hit $5k revenue in a month" value={goalForm.title}
                onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Description</Label>
              <Textarea placeholder="What does this mean to you, how will you get there…" value={goalForm.description}
                onChange={e => setGoalForm({ ...goalForm, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Category</Label>
                <Select value={goalForm.category} onValueChange={v => setGoalForm({ ...goalForm, category: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Target Date</Label>
                <Input type="date" value={goalForm.target_date}
                  onChange={e => setGoalForm({ ...goalForm, target_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Revenue / $ Target (optional)</Label>
              <Input type="number" min="0" placeholder="e.g. 5000 for a $5k goal"
                value={goalForm.target_value}
                onChange={e => setGoalForm({ ...goalForm, target_value: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Leave blank if your goal isn't money-based</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalModal(false)}>Cancel</Button>
            <Button onClick={saveGoal} disabled={goalSaving}>
              {goalSaving ? "Saving…" : editingGoal ? "Save Changes" : "Add Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Progress Update Modal ────────────────────────────────────────────── */}
      <Dialog open={!!progressModal} onOpenChange={() => setProgressModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
          </DialogHeader>
          {progressModal && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{progressModal.title}</p>
              {progressModal.target_value_cents && (
                <p className="text-xs text-muted-foreground">
                  Target: {fmt$(progressModal.target_value_cents)}
                </p>
              )}
              <div>
                <Label className="text-xs mb-1 block">Current value ($)</Label>
                <Input type="number" min="0" step="1" placeholder="0"
                  value={progressValue} onChange={e => setProgressValue(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressModal(null)}>Cancel</Button>
            <Button onClick={saveProgress}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirms ──────────────────────────────────────────────────── */}
      <Dialog open={!!deleteInvId} onOpenChange={() => setDeleteInvId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Item?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteInvId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteInvestment}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteGoalId} onOpenChange={() => setDeleteGoalId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Goal?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGoalId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteGoal}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Investment Card ───────────────────────────────────────────────────────────

const InvestmentCard = ({
  inv, onMark, onEdit, onDelete,
}: {
  inv: Investment;
  onMark: (inv: Investment) => void;
  onEdit: (inv: Investment) => void;
  onDelete: (id: string) => void;
}) => {
  const T = TIERS[inv.tier];
  return (
    <div className={[
      "rounded-xl border bg-card p-4 transition-opacity",
      inv.purchased ? "opacity-55" : "",
    ].join(" ")}>
      <div className="flex items-start gap-3">
        {/* Check button */}
        <button onClick={() => onMark(inv)} className="mt-0.5 shrink-0 transition-colors">
          {inv.purchased
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${inv.purchased ? "line-through text-muted-foreground" : ""}`}>
              {inv.name}
            </span>
            <Badge className={`${T.badge} text-[10px] h-4`}>{T.label}</Badge>
            {inv.category && (
              <Badge variant="outline" className="text-[10px] h-4">{inv.category}</Badge>
            )}
            {inv.purchased && inv.purchased_at && (
              <span className="text-[10px] text-muted-foreground">
                Purchased {new Date(inv.purchased_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {inv.description && (
            <p className="text-xs text-muted-foreground mt-1">{inv.description}</p>
          )}
          {inv.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">{inv.notes}</p>
          )}
        </div>

        {/* Price + actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="font-bold text-base text-primary">
            {inv.price_cents > 0 ? `$${(inv.price_cents / 100).toLocaleString()}` : "—"}
          </span>
          <div className="flex items-center gap-1">
            {inv.url && (
              <a href={inv.url} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button onClick={() => onEdit(inv)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(inv.id)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Goal Card ─────────────────────────────────────────────────────────────────

const GoalCard = ({
  goal, onToggle, onPin, onEdit, onProgress, onDelete,
}: {
  goal: Goal;
  onToggle: (g: Goal) => void;
  onPin: (g: Goal) => void;
  onEdit: (g: Goal) => void;
  onProgress: (g: Goal) => void;
  onDelete: (id: string) => void;
}) => {
  const catConfig = GOAL_CATEGORIES.find(c => c.value === goal.category) ?? GOAL_CATEGORIES[5];
  const CatIcon = catConfig.icon;
  const hasProgress = goal.target_value_cents != null && goal.target_value_cents > 0;
  const pct = hasProgress ? Math.min(100, Math.round((goal.current_value_cents / goal.target_value_cents!) * 100)) : 0;
  const days = goal.target_date ? daysUntil(goal.target_date) : null;
  const overdue = days !== null && days < 0 && !goal.completed;

  return (
    <div className={[
      "rounded-xl border bg-card p-4 transition-all",
      goal.pinned ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10" : "",
      goal.completed ? "opacity-55" : "",
    ].join(" ")}>
      <div className="flex items-start gap-3">
        {/* Complete toggle */}
        <button onClick={() => onToggle(goal)} className="mt-0.5 shrink-0">
          {goal.completed
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {goal.pinned && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
            <span className={`font-semibold text-sm ${goal.completed ? "line-through text-muted-foreground" : ""}`}>
              {goal.title}
            </span>
            <Badge variant="outline" className="text-[10px] h-4 gap-1">
              <CatIcon className={`h-2.5 w-2.5 ${catConfig.color}`} />
              {catConfig.label}
            </Badge>
          </div>

          {goal.description && (
            <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
          )}

          {/* Progress bar */}
          {hasProgress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {fmt$(goal.current_value_cents)} / {fmt$(goal.target_value_cents!)}
                  <span className="text-muted-foreground ml-1">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${goal.completed ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            {goal.target_date && (
              <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                <Calendar className="h-3 w-3" />
                {goal.completed
                  ? `Completed ${fmtDate(goal.completed_at!.slice(0, 10))}`
                  : overdue
                  ? `Overdue by ${Math.abs(days!)} day${Math.abs(days!) !== 1 ? "s" : ""}`
                  : days === 0
                  ? "Due today"
                  : `${days} day${days !== 1 ? "s" : ""} left`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {hasProgress && !goal.completed && (
            <button onClick={() => onProgress(goal)}
              className="text-[10px] text-primary border border-primary/30 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors font-medium">
              Update progress
            </button>
          )}
          <div className="flex items-center gap-0.5">
            <button onClick={() => onPin(goal)} title={goal.pinned ? "Unpin" : "Pin"}
              className={`p-1.5 rounded-md hover:bg-muted transition-colors ${goal.pinned ? "text-amber-500" : "text-muted-foreground"}`}>
              <Star className={`h-3.5 w-3.5 ${goal.pinned ? "fill-amber-500" : ""}`} />
            </button>
            {goal.completed && (
              <button onClick={() => onToggle(goal)} title="Reopen"
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={() => onEdit(goal)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(goal.id)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentsPage;
