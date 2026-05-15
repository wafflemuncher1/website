import { motion } from "framer-motion";

const FullWidthParagraph = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-base md:text-lg lg:text-xl text-muted-foreground font-body leading-relaxed md:leading-loose max-w-5xl mx-auto text-center"
        >
          At Glossworks, we believe every vehicle deserves to look its absolute best. Our team of
          certified professionals uses only the finest products and techniques to restore, protect,
          and enhance your vehicle's appearance. Whether you're looking for a simple exterior wash or
          a full ceramic coating package, we bring the detailing studio to your doorstep — no
          compromises, no shortcuts. Experience the difference that true craftsmanship makes.
        </motion.p>
      </div>
    </section>
  );
};

export default FullWidthParagraph;
