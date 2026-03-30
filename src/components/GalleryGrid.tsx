import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import image1 from "@/assets/optimized/image1.webp";
import image2 from "@/assets/optimized/image2.webp";
import image3 from "@/assets/optimized/image3.webp";
import image4 from "@/assets/optimized/image4.webp";
import image5 from "@/assets/optimized/image5.webp";
import image6 from "@/assets/optimized/image6.webp";

const images = [
  { src: image1, alt: "Ceramic coated SUV", label: "Ceramic Coating" },
  { src: image2, alt: "Paint correction result", label: "Paint Correction" },
  { src: image3, alt: "Interior deep clean", label: "Interior Detail" },
  { src: image4, alt: "Engine bay detail", label: "Engine Bay" },
  { src: image5, alt: "Full exterior detail", label: "Exterior Detail" },
  { src: image6, alt: "Headlight restoration", label: "Headlight Restore" },
];

const GalleryGrid = () => {
  return (
    <section id="gallery" className="py-24 md:py-32 bg-gradient-to-b from-slate-900 via-gray-800/30 to-slate-900">
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
