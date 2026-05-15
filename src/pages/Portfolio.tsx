import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StickyHeader from "@/components/StickyHeader";
import Footer from "@/components/Footer";
import image1 from "@/assets/optimized/image19.webp";
import image2 from "@/assets/optimized/image19.webp";
import image3 from "@/assets/optimized/image3.webp";
import image4 from "@/assets/optimized/image4.webp";
import image5 from "@/assets/optimized/image5.webp";
import image6 from "@/assets/optimized/image6.webp";
import image7 from "@/assets/optimized/image7.webp";
import image8 from "@/assets/optimized/image8.webp";
import image9 from "@/assets/optimized/image9.webp";
import image10 from "@/assets/optimized/image10.webp";
import image11 from "@/assets/optimized/image11.webp";
import image12 from "@/assets/optimized/image12.webp";
import image13 from "@/assets/optimized/image13.webp";
import image14 from "@/assets/optimized/image14.webp";
import image15 from "@/assets/optimized/image15.webp";
import image16 from "@/assets/optimized/image16.webp";
import image17 from "@/assets/optimized/image17.webp";
import image18 from "@/assets/optimized/image18.webp";

const allImages = [
  { src: image1, alt: "Ceramic coated SUV", label: "Ceramic Coating" },
  { src: image2, alt: "Paint correction result", label: "Paint Correction" },
  { src: image3, alt: "Interior deep clean", label: "Interior Detail" },
  { src: image4, alt: "Engine bay detail", label: "Engine Bay" },
  { src: image5, alt: "Full exterior detail", label: "Exterior Detail" },
  { src: image6, alt: "Headlight restoration", label: "Headlight Restore" },
  { src: image7, alt: "Sedan full detail", label: "Sedan Detail" },
  { src: image8, alt: "SUV correction", label: "SUV Correction" },
  { src: image9, alt: "Truck ceramic coat", label: "Truck Ceramic" },
  { src: image10, alt: "Wheel restoration", label: "Wheel Restore" },
  { src: image11, alt: "Paint enhancement", label: "Paint Enhancement" },
  { src: image12, alt: "Interior restoration", label: "Interior Restore" },
  { src: image13, alt: "Full correction", label: "Full Correction" },
  { src: image14, alt: "Deep clean result", label: "Deep Clean" },
  { src: image15, alt: "Showroom prep", label: "Showroom Prep" },
  { src: image16, alt: "Oxidation removal", label: "Oxidation Removal" },
  { src: image17, alt: "Trim restoration", label: "Trim Restore" },
  { src: image18, alt: "Swirl removal", label: "Swirl Removal" },
];

const Portfolio = () => {
  return (
    <div className="min-h-screen">
      <StickyHeader />
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-12">
            <Button variant="ghost" size="sm" className="mb-6" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Portfolio</p>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Work</h1>
              <p className="text-muted-foreground font-body max-w-lg mx-auto">
                Browse our complete collection of detailing transformations.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
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
      <Footer />
    </div>
  );
};

export default Portfolio;
