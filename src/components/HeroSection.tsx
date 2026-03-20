import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroCar from "@/assets/image1.webp";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroCar}
          alt="Luxury ceramic coated vehicle"
          className="w-full h-full object-cover opacity-40"
          decoding="async"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-primary text-sm font-medium tracking-[0.3em] uppercase mb-6"
          >
            Louisville, KY — Premium Mobile Detailing
          </motion.p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Where Luxury
            <br />
            Meets the{" "}
            <span className="text-gradient">Driveway.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 font-body">
            Elite Mobile Detailing & Polishing based in Louisville, KY. We bring the showroom to you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-base px-8 py-6 group" asChild>
              <a href="#estimate">
                Get Your Estimate
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 py-6 border-border/50 hover:border-primary/50"
              asChild
            >
              {/* TODO: replace with your real phone number */}
              <a href="tel:+15026120430">
                <Play className="mr-2 h-4 w-4" />
                Book Now
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;