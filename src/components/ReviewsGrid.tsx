import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  { name: "James T.", text: "Insert text here when ready" },
  { name: "Sarah M.", text: "Insert text here when ready" },
  { name: "David K.", text: "Insert text here when ready" },
  { name: "Michelle R.", text: "Insert text here when ready" },
  { name: "Chris P.", text: "Insert text here when ready" },
  { name: "Amanda L.", text: "Insert text here when ready" },
];

const ReviewsGrid = () => {
  return (
    <section id="reviews" className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Reviews</p>
          <h2 className="text-3xl md:text-5xl font-bold">What Clients Say</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border/50 bg-card/80 p-6"
            >
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-secondary-foreground font-body mb-4 leading-relaxed">"{r.text}"</p>
              <p className="text-xs font-semibold text-muted-foreground">— {r.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsGrid;
