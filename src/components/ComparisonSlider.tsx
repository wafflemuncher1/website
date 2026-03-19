import { useState, useRef } from "react";
import { motion } from "framer-motion";
import beforeAfter from "@/assets/before-after.jpg";

const ComparisonSlider = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <section id="gallery" className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Portfolio</p>
          <h2 className="text-3xl md:text-5xl font-bold">See the Difference</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          ref={containerRef}
          className="relative max-w-4xl mx-auto aspect-video rounded-lg overflow-hidden cursor-col-resize select-none border border-border/50"
          onMouseMove={(e) => handleMove(e.clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        >
          {/* After (full) */}
          <img src={beforeAfter} alt="After detailing" className="absolute inset-0 w-full h-full object-cover" />

          {/* Before (clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={beforeAfter}
              alt="Before detailing"
              className="absolute inset-0 w-full h-full object-cover brightness-50 contrast-75 saturate-50"
              style={{ width: `${(100 / sliderPos) * 100}%`, maxWidth: "none" }}
            />
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur px-3 py-1 rounded text-xs font-medium tracking-wider uppercase">
              Before
            </div>
          </div>

          {/* Slider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground text-xs font-bold">↔</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur px-3 py-1 rounded text-xs font-medium tracking-wider uppercase">
            After
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSlider;
