import { motion } from "framer-motion";

const CTABanner = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-4 items-stretch min-h-[320px] md:min-h-[400px]">
          {/* Left long image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden md:block rounded-2xl overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400&h=800&fit=crop"
              alt="Detail work"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>

          {/* Center GIF background with CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden flex items-center justify-center min-h-[280px]"
          >
            {/* Background — placeholder gif-like gradient animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-primary/20 animate-pulse" />
            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 text-center px-6 py-12">
              <h3 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
                Follow Presidential Automotive
                <br />
                Detailing on Social Media
              </h3>
              <a
                href="#estimate"
                className="inline-block mt-4 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg text-lg tracking-wider hover:opacity-90 transition-opacity"
              >
                GET A QUOTE
              </a>
            </div>
          </motion.div>

          {/* Right long image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden md:block rounded-2xl overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=800&fit=crop"
              alt="Car detail"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
