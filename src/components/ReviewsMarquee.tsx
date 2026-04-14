import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  { name: "James T.", text: "Best detail I've ever had. My Tesla looks showroom-new. Glossworks is the real deal." },
  { name: "Sarah M.", text: "The ceramic coating is unreal. Water just beads right off. Worth every penny." },
  { name: "David K.", text: "Professional, on-time, and meticulous. They came to my driveway and worked magic." },
  { name: "Michelle R.", text: "My Tahoe had never looked this good, even when I bought it. Incredible attention to detail." },
  { name: "Chris P.", text: "Koch Chemie products made a noticeable difference. The paint literally glows now." },
  { name: "Amanda L.", text: "Booked the Showroom Prep — they corrected every swirl mark. Can't recommend enough." },
];

const ReviewCard = ({ name, text }: { name: string; text: string }) => (
  <div className="shrink-0 w-80 rounded-xl border border-border/50 bg-card/80 p-6 mx-3">
    <div className="flex gap-0.5 mb-3">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
      ))}
    </div>
    <p className="text-sm text-secondary-foreground font-body mb-4 leading-relaxed">"{text}"</p>
    <p className="text-xs font-semibold text-muted-foreground">— {name}</p>
  </div>
);

const ReviewsMarquee = () => {
  const doubled = [...reviews, ...reviews];

  return (
    <section id="reviews" className="py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Reviews</p>
          <h2 className="text-3xl md:text-5xl font-bold">What Clients Say</h2>
        </motion.div>
      </div>

      <div className="relative">
        <div className="marquee flex">
          {doubled.map((r, i) => (
            <ReviewCard key={i} {...r} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsMarquee;
