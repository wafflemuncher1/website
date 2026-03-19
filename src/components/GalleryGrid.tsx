import { motion } from "framer-motion";
import beforeAfter from "@/assets/before-after.jpg";
import heroCar from "@/assets/hero-car.jpg";

const images = [
  { src: heroCar, alt: "Ceramic coated SUV", label: "Ceramic Coating" },
  { src: beforeAfter, alt: "Paint correction result", label: "Paint Correction" },
  { src: heroCar, alt: "Interior deep clean", label: "Interior Detail" },
  { src: beforeAfter, alt: "Engine bay detail", label: "Engine Bay" },
  { src: heroCar, alt: "Full exterior detail", label: "Exterior Detail" },
  { src: beforeAfter, alt: "Headlight restoration", label: "Headlight Restore" },
];

const GalleryGrid = () => {
  return (
    <section id="gallery" className="py-24 md:py-32">
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative aspect-square rounded-xl overflow-hidden border border-border/50"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-sm font-semibold">{img.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GalleryGrid;
