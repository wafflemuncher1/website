import { motion } from "framer-motion";

interface TextImageSectionProps {
  heading: string;
  text: string;
  imageUrl: string;
  reverse?: boolean;
  shape?: "rounded" | "blob" | "diamond";
}

const shapeClasses: Record<string, string> = {
  rounded: "rounded-3xl",
  blob: "rounded-[40%_60%_55%_45%/60%_40%_60%_40%]",
  diamond: "rounded-[20px] rotate-2",
};

const TextImageSection = ({
  heading,
  text,
  imageUrl,
  reverse = false,
  shape = "rounded",
}: TextImageSectionProps) => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-8">
        <div
          className={`flex flex-col ${
            reverse ? "md:flex-row-reverse" : "md:flex-row"
          } items-center gap-10 md:gap-16`}
        >
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-center md:text-left"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{heading}</h2>
            <p className="text-muted-foreground font-body leading-relaxed text-base md:text-lg max-w-lg mx-auto md:mx-0">
              {text}
            </p>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex-1 w-full max-w-md md:max-w-none"
          >
            <div className={`overflow-hidden ${shapeClasses[shape]} shadow-2xl`}>
              <img
                src={imageUrl}
                alt={heading}
                className={`w-full h-64 sm:h-80 md:h-[420px] object-cover ${shape === "diamond" ? "-rotate-2" : ""}`}
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TextImageSection;
