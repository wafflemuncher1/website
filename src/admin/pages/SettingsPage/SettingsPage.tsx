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
    // reset input so same file can be re-picked
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
        // Convert to WebP
        const webpBlob = await convertToWebP(item.file);
        const filename = `${randomId()}.webp`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("portfolio")
          .upload(filename, webpBlob, { contentType: "image/webp", upsert: false });

        if (uploadError) throw uploadError;

        // Insert metadata row
        const { error: insertError } = await supabase.from("portfolio_images").insert({
          storage_path: filename,
          label: item.label.trim() || "",
          sort_order: nextOrder + i,
        });

        if (insertError) {
          // Rollback storage upload if metadata insert fails
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

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} image${successCount > 1 ? "s" : ""}`);
    }

    setPending([]);
    load();
    setUploading(false);
  };

  const handleDelete = async (img: PortfolioImage) => {
    setDeleting(img.id);
    // Remove from storage
    await supabase.storage.from("portfolio").remove([img.storage_path]);
    // Remove metadata row
    const { error } = await supabase.from("portfolio_images").delete().eq("id", img.id);
    if (error) toast.error("Failed to delete image");
    else {
      toast.success("Image deleted");
      setImages((p) => p.filter((x) => x.id !== img.id));
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Upload photos here and they'll appear automatically in the Portfolio section on your homepage.
        Images are auto-converted to WebP for fast loading.
      </p>

      {/* File picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilePick}
      />
      <Button size="sm" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4" />
        Choose Images
      </Button>

      {/* Pending uploads */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Ready to upload ({pending.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pending.map((item) => (
              <div key={item.uid} className="relative rounded-xl border border-border overflow-hidden bg-card">
                <div className="aspect-square">
                  <img
                    src={item.previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2">
                  <Input
                    placeholder='Label (e.g. "Ceramic Coating")'
                    value={item.label}
                    onChange={(e) => updateLabel(item.uid, e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <button
                  onClick={() => removePending(item.uid)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                >
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
            <Button
              size="sm"
              variant="ghost"
              disabled={uploading}
              onClick={() => {
                pending.forEach((x) => URL.revokeObjectURL(x.previewUrl));
                setPending([]);
              }}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Existing images */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Portfolio Images ({images.length})
        </p>
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted/40 animate-pulse" />
            ))}
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
                <img
                  src={`${SUPABASE_STORAGE_URL}${img.storage_path}`}
                  alt={img.label || "Portfolio image"}
                  className="w-full h-full object-cover"
                />
                {img.label && (
                  <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-2 py-1">
                    <p className="text-xs font-medium truncate">{img.label}</p>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(img)}
                  disabled={deleting === img.id}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all disabled:opacity-40"
                >
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
    <AccordionSection title="Portfolio Images" defaultOpen>
      <ImagesSection />
    </AccordionSection>
    <AccordionSection title="Reviews">
      <ReviewsSection />
    </AccordionSection>
  </div>
);

export default SettingsPage;
