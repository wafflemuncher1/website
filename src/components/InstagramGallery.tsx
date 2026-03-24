import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

const posts = [
  {
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=400&fit=crop",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
  {
    image: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&h=400&fit=crop",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
  {
    image: "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=400&h=400&fit=crop",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
  {
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=400&fit=crop",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
  {
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=400&fit=crop",
    url: "https://www.instagram.com/glossworksky?igsh=MXMxeWFsZ2Rnc3R6bA%3D%3D&utm_source=qr",
  },
  {
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop",
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
