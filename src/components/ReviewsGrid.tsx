import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_REVIEW_URL = "https://share.google/QgylFrck1Qp40fWbt";
const VISIBLE = 4;

const AVATAR_COLORS = [
  "bg-purple-500",
  "bg-teal-500",
  "bg-blue-500",
  "bg-rose-500",
  "bg-green-500",
  "bg-amber-500",
];

interface SiteReview {
  id: string;
  author_name: string;
  rating: number;
  review_text: string;
  review_date: string;
}

const ReviewCard = ({ review }: { review: SiteReview }) => {
  const { author_name, rating, review_text, review_date } = review;
  const truncated = review_text.length > 140 ? review_text.slice(0, 140) + "..." : review_text;
  const needsReadMore = review_text.length > 140;
  const color = AVATAR_COLORS[author_name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col min-h-[220px]">
      <div className="flex items-center gap-3 mb-1">
        <div className="relative flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm`}
          >
            {author_name.charAt(0).toUpperCase()}
          </div>
          <img
            src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_24dp.png"
            alt="Google"
            className="w-4 h-4 absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-[1px]"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{author_name}</p>
          <p className="text-xs text-gray-400">{review_date}</p>
        </div>
      </div>

      <div className="flex gap-0.5 my-2">
        {[...Array(5)].map((_, j) => (
          <Star
            key={j}
            className={`h-4 w-4 ${
              j < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>

      <p className="text-sm text-gray-700 leading-relaxed flex-1">{truncated}</p>

      {needsReadMore && (
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm font-medium mt-2 hover:underline"
        >
          Read more
        </a>
      )}
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col min-h-[220px] animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="space-y-1.5">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-2.5 w-16 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="flex gap-0.5 mb-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-4 w-4 bg-gray-200 rounded" />
      ))}
    </div>
    <div className="space-y-2 flex-1">
      <div className="h-2.5 bg-gray-200 rounded w-full" />
      <div className="h-2.5 bg-gray-200 rounded w-5/6" />
      <div className="h-2.5 bg-gray-200 rounded w-4/6" />
      <div className="h-2.5 bg-gray-200 rounded w-3/4" />
    </div>
  </div>
);

const ReviewsGrid = () => {
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("site_reviews")
        .select("id, author_name, rating, review_text, review_date")
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (!error && data) setReviews(data);
      setLoading(false);
    };
    fetchReviews();
  }, []);

  const maxStart = Math.max(0, reviews.length - VISIBLE);
  const prev = () => setStartIndex((i) => Math.max(0, i - 1));
  const next = () => setStartIndex((i) => Math.min(maxStart, i + 1));
  const visible = reviews.slice(startIndex, startIndex + VISIBLE);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <section
      id="reviews"
      className="py-24 md:py-32 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-wide mb-4">
            Trusted by Car Owners Across Louisville
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-base md:text-lg">
            See what our customers have to say about their experience with Glossworks. From everyday
            drivers to luxury vehicles, our clients rave about the quality, convenience, and lasting
            shine we deliver.
          </p>
        </motion.div>

        {/* Google Reviews summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl p-5 flex items-center justify-between max-w-5xl mx-auto my-10"
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <img
                  src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
                  alt="Google"
                  className="h-6"
                />
                <span className="text-gray-800 font-semibold text-lg">Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{avgRating}</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                {reviews.length > 0 && (
                  <span className="text-sm text-gray-500">({reviews.length})</span>
                )}
              </div>
            </div>
          </div>
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
          >
            <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
              Review us on Google
            </a>
          </Button>
        </motion.div>

        {/* Review cards */}
        <div className="relative max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-4">Be the first to leave us a review.</p>
              <Button
                asChild
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
                  Review us on Google
                </a>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {visible.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <ReviewCard review={r} />
                  </motion.div>
                ))}
              </div>

              {maxStart > 0 && (
                <>
                  <button
                    onClick={prev}
                    disabled={startIndex === 0}
                    className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    onClick={next}
                    disabled={startIndex >= maxStart}
                    className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewsGrid;
