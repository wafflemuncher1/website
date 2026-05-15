import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Upload,
  ImageIcon,
  Pencil,
  Save,
  Package,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const convertToWebP = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            blob ? resolve(blob) : reject(new Error("WebP conversion failed"));
          },
          "image/webp",
          0.88
        );
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });

const randomId = () => crypto.randomUUID();

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  author_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  created_at: string;
}

interface PortfolioImage {
  id: string;
  storage_path: string;
  label: string;
  sort_order: number;
  created_at: string;
}

interface PendingFile {
  uid: string;
  file: File;
  previewUrl: string;
  label: string;
}

interface ServicePackage {
  id: string;
  label: string;
  price_cents: number;
  duration_mins: number;
  features: string[];
  active: boolean;
  sort_order: number;
  created_at: string;
}

type PackageDraft = {
  label: string;
  price_cents: number;
  duration_mins: number;
  features: string[];
  active: boolean;
};

const blankDraft = (): PackageDraft => ({
  label: "",
  price_cents: 0,
  duration_mins: 120,
  features: [""],
  active: true,
});

// ─── Star picker ─────────────────────────────────────────────────────────────

const StarPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              n <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// ─── Packages section ─────────────────────────────────────────────────────────

const PackageForm = ({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: PackageDraft;
  onSave: (d: PackageDraft) => void;
  onCancel: () => void;
  saving: boolean;
}) => {
  const [draft, setDraft] = useState<PackageDraft>(initial);

  const set = <K extends keyof PackageDraft>(k: K, v: PackageDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const setFeature = (i: number, val: string) =>
    setDraft((d) => {
      const f = [...d.features];
      f[i] = val;
      return { ...d, features: f };
    });

  const addFeature = () => setDraft((d) => ({ ...d, features: [...d.features, ""] }));

  const removeFeature = (i: number) =>
    setDraft((d) => ({ ...d, features: d.features.filter((_, idx) => idx !== i) }));

  const valid = draft.label.trim() !== "" && draft.price_cents > 0 && draft.duration_mins > 0;

  return (
    <div className="space-y-4">
      {/* Name & toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Package Name *</label>
          <Input
            placeholder='e.g. "The Signature Detail"'
            value={draft.label}
            onChange={(e) => set("label", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
          <button
            type="button"
            onClick={() => set("active", !draft.active)}
            className={[
              "w-full flex items-center gap-2 rounded-md border px-3 h-10 text-sm font-medium transition-colors",
              draft.active
                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                : "border-border text-muted-foreground hover:border-primary/40",
            ].join(" ")}
          >
            {draft.active
              ? <><ToggleRight className="h-4 w-4" /> Active — visible to customers</>
              : <><ToggleLeft className="h-4 w-4" /> Inactive — hidden from booking form</>}
          </button>
        </div>
      </div>

      {/* Price & Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Price ($) *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              placeholder="165"
              className="pl-8"
              value={draft.price_cents === 0 ? "" : draft.price_cents / 100}
              onChange={(e) => set("price_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            = {draft.price_cents > 0 ? `$${(draft.price_cents / 100).toFixed(2)}` : "$0.00"} stored
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Duration (minutes) *
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              min={30}
              step={30}
              placeholder="180"
              className="pl-8"
              value={draft.duration_mins || ""}
              onChange={(e) => set("duration_mins", parseInt(e.target.value || "0"))}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            = {draft.duration_mins > 0 ? `~${(draft.duration_mins / 60).toFixed(1)} hrs` : "—"} — controls time-slot blocking
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          What's Included
        </label>
        <div className="space-y-2">
          {draft.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-primary text-sm shrink-0">✓</span>
              <Input
                placeholder={`Feature ${i + 1}`}
                value={f}
                onChange={(e) => setFeature(i, e.target.value)}
                className="text-sm"
              />
              {draft.features.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="shrink-0 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addFeature} className="gap-1.5 text-xs h-7">
          <Plus className="h-3 w-3" /> Add Feature
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button size="sm" disabled={saving || !valid} onClick={() => onSave(draft)} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save Package"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

const PackagesSection = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error("Failed to load packages");
    else setPackages(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (draft: PackageDraft) => {
    setSaving(true);
    const { error } = await supabase.from("packages").insert({
      label: draft.label.trim(),
      price_cents: draft.price_cents,
      duration_mins: draft.duration_mins,
      features: draft.features.filter((f) => f.trim() !== ""),
      active: draft.active,
      sort_order: packages.length,
    });
    if (error) toast.error("Failed to create package: " + error.message);
    else { toast.success("Package created ✓"); setShowNew(false); load(); }
    setSaving(false);
  };

  const handleUpdate = async (id: string, draft: PackageDraft) => {
    setSaving(true);
    const { error } = await supabase.from("packages").update({
      label: draft.label.trim(),
      price_cents: draft.price_cents,
      duration_mins: draft.duration_mins,
      features: draft.features.filter((f) => f.trim() !== ""),
      active: draft.active,
    }).eq("id", id);
    if (error) toast.error("Failed to update package: " + error.message);
    else { toast.success("Package updated ✓"); setEditingId(null); load(); }
    setSaving(false);
  };

  const handleToggleActive = async (pkg: ServicePackage) => {
    setToggling(pkg.id);
    const { error } = await supabase
      .from("packages")
      .update({ active: !pkg.active })
      .eq("id", pkg.id);
    if (error) toast.error("Failed to update status");
    else {
      toast.success(pkg.active ? "Package hidden" : "Package activated");
      load();
    }
    setToggling(null);
  };

  const handleDelete = async (pkg: ServicePackage) => {
    if (!confirm(`Delete "${pkg.label}"? This cannot be undone.`)) return;
    setDeleting(pkg.id);
    const { error } = await supabase.from("packages").delete().eq("id", pkg.id);
    if (error) toast.error("Failed to delete package");
    else { toast.success("Package deleted"); setPackages((p) => p.filter((x) => x.id !== pkg.id)); }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Packages listed here power the booking form. The <span className="font-medium text-foreground">duration</span> you set
        controls which time slots get blocked when someone books — so keep it accurate.
      </p>

      {/* New package form */}
      {showNew ? (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-5">
          <p className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Package className="h-4 w-4" /> New Package
          </p>
          <PackageForm
            initial={blankDraft()}
            onSave={handleCreate}
            onCancel={() => setShowNew(false)}
            saving={saving}
          />
        </div>
      ) : (
        <Button size="sm" onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Package
        </Button>
      )}

      {/* Package list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 && !showNew ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-border text-muted-foreground gap-2">
          <Package className="h-8 w-8 opacity-40" />
          <p className="text-sm">No packages yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={[
                "rounded-xl border bg-card overflow-hidden transition-colors",
                pkg.active ? "border-border" : "border-dashed border-muted-foreground/30 opacity-70",
              ].join(" ")}
            >
              {editingId === pkg.id ? (
                <div className="p-5">
                  <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5" /> Editing — {pkg.label}
                  </p>
                  <PackageForm
                    initial={{
                      label: pkg.label,
                      price_cents: pkg.price_cents,
                      duration_mins: pkg.duration_mins,
                      features: pkg.features.length > 0 ? pkg.features : [""],
                      active: pkg.active,
                    }}
                    onSave={(d) => handleUpdate(pkg.id, d)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">{pkg.label}</span>
                        <span className={[
                          "text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                          pkg.active
                            ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400"
                            : "border-muted-foreground/40 text-muted-foreground",
                        ].join(" ")}>
                          {pkg.active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Price & duration */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2.5">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <DollarSign className="h-3 w-3" />
                          ${(pkg.price_cents / 100).toFixed(0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pkg.duration_mins} min (~{(pkg.duration_mins / 60).toFixed(1)} hrs)
                        </span>
                      </div>

                      {/* Features */}
                      {pkg.features.length > 0 && (
                        <ul className="space-y-0.5">
                          {pkg.features.map((f, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary shrink-0 mt-0.5">✓</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleActive(pkg)}
                        disabled={toggling === pkg.id}
                        title={pkg.active ? "Deactivate" : "Activate"}
                        className={[
                          "p-1.5 rounded-lg transition-colors disabled:opacity-40",
                          pkg.active
                            ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                            : "text-muted-foreground hover:bg-muted",
                        ].join(" ")}
                      >
                        {pkg.active
                          ? <ToggleRight className="h-4 w-4" />
                          : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setEditingId(pkg.id)}
                        title="Edit"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg)}
                        disabled={deleting === pkg.id}
                        title="Delete"
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Reviews section ──────────────────────────────────────────────────────────

const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    author_name: "",
    rating: 5,
    review_text: "",
    review_date: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load reviews");
    else setReviews(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ author_name: "", rating: 5, review_text: "", review_date: "" });
    setShowForm(false);
  };

  const handleAdd = async () => {
    if (!form.author_name.trim()) return toast.error("Name is required");
    if (!form.review_text.trim()) return toast.error("Review text is required");
    setSaving(true);
    const { error } = await supabase.from("site_reviews").insert({
      author_name: form.author_name.trim(),
      rating: form.rating,
      review_text: form.review_text.trim(),
      review_date: form.review_date.trim() || "Recently",
    });
    if (error) toast.error("Failed to save review");
    else { toast.success("Review added"); resetForm(); load(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("site_reviews").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Review deleted"); setReviews((p) => p.filter((r) => r.id !== id)); }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Review
        </Button>
      )}

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New Review</p>
            <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer Name</label>
              <Input placeholder="e.g. James T." value={form.author_name} onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date Label</label>
              <Input placeholder='e.g. "2 weeks ago"' value={form.review_date} onChange={(e) => setForm((f) => ({ ...f, review_date: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rating</label>
            <StarPicker value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Review Text</label>
            <Textarea placeholder="Paste the customer's review here..." rows={4} value={form.review_text} onChange={(e) => setForm((f) => ({ ...f, review_text: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={saving} size="sm">{saving ? "Saving..." : "Save Review"}</Button>
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet. Add your first one above.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold truncate">{r.author_name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{r.review_date}</span>
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground"}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{r.review_text}</p>
              </div>
              <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="shrink-0 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Images section ───────────────────────────────────────────────────────────

const ImagesSection = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const SUPABASE_STORAGE_URL = `https://vrgqbgksimptcgqphkkp.supabase.co/storage/v1/object/public/portfolio/`;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio_images")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load images");
    else setImages(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newPending: PendingFile[] = files.map((file) => ({
      uid: randomId(),
      file,
      previewUrl: URL.createObjectURL(file),
      label: "",
    }));
    setPending((p) => [...p, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePending = (uid: string) => {
    setPending((p) => {
      const item = p.find((x) => x.uid === uid);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return p.filter((x) => x.uid !== uid);
    });
  };

  const updateLabel = (uid: string, label: string) => {
    setPending((p) => p.map((x) => (x.uid === uid ? { ...x, label } : x)));
  };

  const handleUpload = async () => {
    if (!pending.length) return;
    setUploading(true);
    let successCount = 0;
    const nextOrder = images.length;
    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      try {
        const webpBlob = await convertToWebP(item.file);
        const filename = `${randomId()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("portfolio")
          .upload(filename, webpBlob, { contentType: "image/webp", upsert: false });
        if (uploadError) throw uploadError;
        const { error: insertError } = await supabase.from("portfolio_images").insert({
          storage_path: filename,
          label: item.label.trim() || "",
          sort_order: nextOrder + i,
        });
        if (insertError) {
          await supabase.storage.from("portfolio").remove([filename]);
          throw insertError;
        }
        URL.revokeObjectURL(item.previewUrl);
        successCount++;
      } catch (err) {
        console.error("Upload failed for", item.file.name, err);
        toast.error(`Failed to upload ${item.file.name}`);
      }
    }
    if (successCount > 0) toast.success(`Uploaded ${successCount} image${successCount > 1 ? "s" : ""}`);
    setPending([]);
    load();
    setUploading(false);
  };

  const handleDelete = async (img: PortfolioImage) => {
    setDeleting(img.id);
    await supabase.storage.from("portfolio").remove([img.storage_path]);
    const { error } = await supabase.from("portfolio_images").delete().eq("id", img.id);
    if (error) toast.error("Failed to delete image");
    else { toast.success("Image deleted"); setImages((p) => p.filter((x) => x.id !== img.id)); }
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Upload photos here and they'll appear automatically in the Portfolio section on your homepage.
        Images are auto-converted to WebP for fast loading.
      </p>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilePick} />
      <Button size="sm" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4" /> Choose Images
      </Button>

      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ready to upload ({pending.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pending.map((item) => (
              <div key={item.uid} className="relative rounded-xl border border-border overflow-hidden bg-card">
                <div className="aspect-square">
                  <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <Input placeholder='Label (e.g. "Ceramic Coating")' value={item.label}
                    onChange={(e) => updateLabel(item.uid, e.target.value)} className="h-8 text-xs" />
                </div>
                <button onClick={() => removePending(item.uid)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-white transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUpload} disabled={uploading} className="gap-2">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : `Upload ${pending.length} Image${pending.length > 1 ? "s" : ""}`}
            </Button>
            <Button size="sm" variant="ghost" disabled={uploading} onClick={() => { pending.forEach((x) => URL.revokeObjectURL(x.previewUrl)); setPending([]); }}>
              Clear All
            </Button>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Portfolio Images ({images.length})</p>
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-square rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-border text-muted-foreground gap-2">
            <ImageIcon className="h-8 w-8 opacity-40" />
            <p className="text-sm">No portfolio images yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                <img src={`${SUPABASE_STORAGE_URL}${img.storage_path}`} alt={img.label || "Portfolio image"} className="w-full h-full object-cover" />
                {img.label && (
                  <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-2 py-1">
                    <p className="text-xs font-medium truncate">{img.label}</p>
                  </div>
                )}
                <button onClick={() => handleDelete(img)} disabled={deleting === img.id}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all disabled:opacity-40">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Accordion wrapper ────────────────────────────────────────────────────────

const AccordionSection = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm font-semibold tracking-wide">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border/50 pt-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const SettingsPage = () => (
  <div className="p-6 max-w-3xl mx-auto space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground mt-1">Manage site content and configuration.</p>
    </div>
    <AccordionSection title="Packages & Pricing" defaultOpen>
      <PackagesSection />
    </AccordionSection>
    <AccordionSection title="Portfolio Images">
      <ImagesSection />
    </AccordionSection>
    <AccordionSection title="Reviews">
      <ReviewsSection />
    </AccordionSection>
  </div>
);

export default SettingsPage;