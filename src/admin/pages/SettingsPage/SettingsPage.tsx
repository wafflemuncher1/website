import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Star, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  author_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  is_visible: boolean;
  created_at: string;
}

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

// ─── Reviews section ─────────────────────────────────────────────────────────

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

  const loadReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load reviews");
    } else {
      setReviews(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, []);

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
      is_visible: true,
    });

    if (error) {
      toast.error("Failed to save review");
    } else {
      toast.success("Review added");
      resetForm();
      loadReviews();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("site_reviews").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete review");
    } else {
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      {/* Add review button */}
      {!showForm && (
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Review
        </Button>
      )}

      {/* Add review form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New Review</p>
            <button onClick={resetForm}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Customer Name
              </label>
              <Input
                placeholder="e.g. James T."
                value={form.author_name}
                onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Date Label
              </label>
              <Input
                placeholder='e.g. "2 weeks ago" or "April 2026"'
                value={form.review_date}
                onChange={(e) => setForm((f) => ({ ...f, review_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Rating
            </label>
            <StarPicker
              value={form.rating}
              onChange={(n) => setForm((f) => ({ ...f, rating: n }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Review Text
            </label>
            <Textarea
              placeholder="Paste the customer's review here..."
              rows={4}
              value={form.review_text}
              onChange={(e) => setForm((f) => ({ ...f, review_text: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={saving} size="sm">
              {saving ? "Saving..." : "Save Review"}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Existing reviews list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No reviews yet. Add your first one above.
        </p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4"
            >
              {/* Stars + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold truncate">{r.author_name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{r.review_date}</span>
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${
                        n <= r.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-muted text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {r.review_text}
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(r.id)}
                disabled={deleting === r.id}
                className="shrink-0 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Accordion block ──────────────────────────────────────────────────────────

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
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
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

const SettingsPage = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage site content and configuration.
        </p>
      </div>

      <AccordionSection title="Reviews" defaultOpen>
        <ReviewsSection />
      </AccordionSection>
    </div>
  );
};

export default SettingsPage;
