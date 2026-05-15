import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const areas = [
  "Southern Louisville", "Shepherdsville", "Bardstown", "Jeffersontown",
   "Bullitt County", "Mount Washington", "Hillview", 
];

const ServiceArea = () => {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-3">Coverage</p>
          <h2 className="text-3xl md:text-5xl font-bold">Areas We Serve</h2>
          <p className="text-muted-foreground mt-3 font-body max-w-md mx-auto">
            Mobile detailing throughout Louisville and surrounding communities.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {areas.map((area, i) => (
            <motion.div
              key={area}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3"
            >
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-sm font-medium text-secondary-foreground">{area}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;
