import { motion } from "framer-motion";
import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_REVIEW_URL = "https://share.google/QgylFrck1Qp40fWbt";

const reviews = [
  {
    name: "James T.",
    date: "2 weeks ago",
    text: "Best detail I've ever had. My Tesla Model 3 looks showroom-new. The paint correction removed every swirl mark and the ceramic coating has water beading like crazy. Glossworks is the real deal.",
  },
  {
    name: "Sarah M.",
    date: "1 month ago",
    text: "Had the full ceramic coating package done on my BMW X5. The results are absolutely stunning — water just sheets right off and the gloss is insane. Worth every single penny. Will be back!",
  },
  {
    name: "David K.",
    date: "3 weeks ago",
    text: "Professional, on-time, and incredibly meticulous. They came right to my driveway and worked magic on my truck. The interior looks brand new and the paint is glowing. Highly recommend!",
  },
  {
    name: "Michelle R.",
    date: "1 week ago",
    text: "My Tahoe had never looked this good — even when I first bought it. The attention to detail is unmatched. Every crevice was cleaned, every surface protected. 10/10 experience.",
  },
  {
    name: "Chris P.",
    date: "2 months ago",
    text: "Koch Chemie products really do make a noticeable difference. The paint literally glows now. These guys know their stuff and take real pride in the work. Already booked my next appointment.",
  },
  {
    name: "Amanda L.",
    date: "3 weeks ago",
    text: "Booked the Showroom Prep package and they corrected every swirl mark on my black Audi. The finish is absolutely flawless. Can't recommend Glossworks enough — true professionals.",
  },
];

const ReviewCard = ({ name, date, text, index }: { name: string; date: string; text: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.08 }}
    className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 flex flex-col"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
        {name.charAt(0)}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <img
        src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_24dp.png"
        alt="Google"
        className="w-5 h-5 ml-auto"
      />
    </div>
    <div className="flex gap-0.5 mb-3">
      {[...Array(5)].map((_, j) => (
        <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-sm text-secondary-foreground/90 leading-relaxed flex-1">"{text}"</p>
  </motion.div>
);

const ReviewsGrid = () => {
  return (
    <section id="reviews" className="py-24 md:py-32 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800/80">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Reviews</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">What Louisville Says</h2>
        </motion.div>

        {/* Rating summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-3 mb-14"
        >
          <div className="flex items-center gap-2">
            <span className="text-5xl font-bold text-foreground">5.0</span>
            <div className="flex flex-col items-start">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">Based on Google Reviews</span>
            </div>
          </div>
          <span className="text-sm font-medium text-primary tracking-wide">
            ★ #1 Rated Mobile Detailer in Louisville
          </span>
        </motion.div>

        {/* Review cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto mb-12">
          {reviews.map((r, i) => (
            <ReviewCard key={i} index={i} {...r} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            asChild
            size="lg"
            className="gap-2 text-base"
          >
            <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
              Leave Us a Review on Google
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewsGrid;
