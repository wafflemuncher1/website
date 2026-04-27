import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_STORAGE_URL =
  "https://vrgqbgksimptcgqphkkp.supabase.co/storage/v1/object/public/portfolio/";

interface GalleryImage {
  id: string;
  storage_path: string;
  label: string;
}

const GalleryGrid = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      const { data, error } = await supabase
        .from("portfolio_images")
        .select("id, storage_path, label")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) setImages(data);
      setLoading(false);
    };
    loadImages();
  }, []);

  return (
    <section
      id="gallery"
      className="py-24 md:py-32 bg-gradient-to-b from-slate-900 via-gray-800/30 to-slate-900"
    >
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Portfolio</p>
          <h2 className="text-3xl md:text-5xl font-bold">Our Work Speaks</h2>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Portfolio images coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative aspect-square rounded-xl overflow-hidden border border-border/50"
              >
                <img
                  src={`${SUPABASE_STORAGE_URL}${img.storage_path}`}
                  alt={img.label || "Portfolio image"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                {img.label && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-sm font-semibold">{img.label}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Button variant="outline" size="lg" className="group" asChild>
            <Link to="/portfolio">
              View Full Portfolio
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default GalleryGrid;
