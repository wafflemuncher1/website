import { motion } from "framer-motion";
import { Star, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const GOOGLE_REVIEW_URL = "https://share.google/QgylFrck1Qp40fWbt";

const reviews = [
  {
    name: "James T.",
    initial: "J",
    color: "bg-purple-500",
    date: "2 weeks ago",
    text: "Best detail I've ever had. My Tesla Model 3 looks showroom-new. The paint correction removed every swirl mark and the ceramic coating has water beading like crazy. Glossworks is the real deal.",
  },
  {
    name: "Sarah M.",
    initial: "S",
    color: "bg-teal-500",
    date: "1 month ago",
    text: "Had the full ceramic coating package done on my BMW X5. The results are absolutely stunning — water just sheets right off and the gloss is insane. Worth every single penny. Will be back!",
  },
  {
    name: "David K.",
    initial: "D",
    color: "bg-blue-500",
    date: "3 weeks ago",
    text: "Professional, on-time, and incredibly meticulous. They came right to my driveway and worked magic on my truck. The interior looks brand new and the paint is glowing. Highly recommend!",
  },
  {
    name: "Michelle R.",
    initial: "M",
    color: "bg-rose-500",
    date: "1 week ago",
    text: "My Tahoe had never looked this good — even when I first bought it. The attention to detail is unmatched. Every crevice was cleaned, every surface protected. 10/10 experience.",
  },
  {
    name: "Chris P.",
    initial: "C",
    color: "bg-green-500",
    date: "2 months ago",
    text: "Koch Chemie products really do make a noticeable difference. The paint literally glows now. These guys know their stuff and take real pride in the work. Already booked my next appointment.",
  },
  {
    name: "Amanda L.",
    initial: "A",
    color: "bg-amber-500",
    date: "3 weeks ago",
    text: "Booked the Showroom Prep package and they corrected every swirl mark on my black Audi. The finish is absolutely flawless. Can't recommend Glossworks enough — true professionals.",
  },
];

const VISIBLE = 4;

const ReviewCard = ({ name, initial, color, date, text }: typeof reviews[0]) => {
  const truncated = text.length > 120 ? text.slice(0, 120) + "..." : text;
  const needsReadMore = text.length > 120;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col min-h-[220px]">
      <div className="flex items-center gap-3 mb-1">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm relative`}>
          {initial}
          <img
            src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_24dp.png"
            alt="Google"
            className="w-4 h-4 absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-[1px]"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <span className="text-red-500 text-xs">✓</span>
          </div>
          <p className="text-xs text-gray-400">{date}</p>
        </div>
      </div>
      <div className="flex gap-0.5 my-2">
        {[...Array(5)].map((_, j) => (
          <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed flex-1">
        {truncated}
      </p>
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

const ReviewsGrid = () => {
  const [startIndex, setStartIndex] = useState(0);
  const maxStart = reviews.length - VISIBLE;

  const prev = () => setStartIndex((i) => Math.max(0, i - 1));
  const next = () => setStartIndex((i) => Math.min(maxStart, i + 1));

  const visible = reviews.slice(startIndex, startIndex + VISIBLE);

  return (
    <section id="reviews" className="py-24 md:py-32 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
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
            See what our customers have to say about their experience with Glossworks. From everyday drivers to luxury vehicles, our clients rave about the quality, convenience, and lasting shine we deliver.
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
                <span className="text-2xl font-bold text-gray-900">5.0</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
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

        {/* Review cards carousel */}
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visible.map((r, i) => (
              <motion.div
                key={startIndex + i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ReviewCard {...r} />
              </motion.div>
            ))}
          </div>

          {/* Nav arrows */}
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
        </div>
      </div>
    </section>
  );
};

export default ReviewsGrid;
