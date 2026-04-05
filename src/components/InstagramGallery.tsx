import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

import ig1 from "@/assets/ig/image1.webp";
import ig2 from "@/assets/ig/image2.webp";
import ig3 from "@/assets/ig/image3.webp";
import ig4 from "@/assets/ig/image4.webp";
import ig5 from "@/assets/ig/image5.webp";
import ig6 from "@/assets/ig/image6.webp";

const posts = [
  {
    image: "@/assets/ig/image4.webp",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
  {
    image: "ig2",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
  {
    image: "ig3",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
  {
    image: "ig4",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
  {
    image: "ig5",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
  {
    image: "ig6",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
];

const InstagramGallery = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Instagram className="h-6 w-6 text-primary" />
            <p className="text-primary text-sm tracking-[0.3em] uppercase">Follow Us</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">@Glossworksky</h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
          {posts.map((post, i) => (
            <motion.a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="group relative aspect-square overflow-hidden rounded-xl"
            >
              <img
                src={post.image}
                alt={`Instagram post ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <Instagram className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramGallery;
