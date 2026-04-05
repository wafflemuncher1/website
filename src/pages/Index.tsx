import StickyHeader from "@/components/StickyHeader";
import HeroSection from "@/components/HeroSection";
import PackagesSection from "@/components/PackagesSection";
import AddOnBoutique from "@/components/AddOnBoutique";
import WashComparison from "@/components/WashComparison";
import ExcellenceSection from "@/components/ExcellenceSection";
import EstimateEngine from "@/components/EstimateEngine";
import GalleryGrid from "@/components/GalleryGrid";
import ReviewsGrid from "@/components/ReviewsGrid";
import AboutSection from "@/components/AboutSection";
import ServiceAgreement from "@/components/ServiceAgreement";
import ServiceArea from "@/components/ServiceArea";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import PaintCorrectionPackages from "@/components/PaintCorrectionPackages";
import CeramicPackages from "@/components/CeramicPackages";
import PremiumAddOns from "@/components/PremiumAddOns";
import FullWidthParagraph from "@/components/FullWidthParagraph";
import CTABanner from "@/components/CTABanner";
import InstagramGallery from "@/components/InstagramGallery";
import TextImageSection from "@/components/TextImageSection";


const Index = () => {
  return (
    <div className="min-h-screen">
      <StickyHeader />
      <HeroSection />
      <ExcellenceSection />
      <PackagesSection />
      <PremiumAddOns /> {/* Text left / Image right — blob shape */}
      <TextImageSection
        heading="The Science of Surface Care"
        text="We don't just wash; we perform a chemical restoration. Using a multi-stage, pH-balanced workflow and German-engineered preservatives, we ensure a swirl-free finish and deep, mirror-like gloss that respects your vehicle’s delicate surfaces."
        imageUrl="https://res.cloudinary.com/drlyt63cm/image/upload/f_webp/q_auto/logo_n2ruxu.png"
        shape="blob"
      />

      {/* Text left / Image right — diamond shape */}
      <TextImageSection
        heading="Mobile Convenience, Studio Quality"
        text="Glossworks brings a high-end detailing studio directly to you. Our self-contained mobile units are equipped with industrial-grade extraction and touchless pre-wash systems, delivering a flawless, showroom-ready finish without you ever leaving your home."
        imageUrl="https://res.cloudinary.com/drlyt63cm/image/upload/f_webp/q_auto/image23_soauqv.webp"
        shape="diamond"
      />

      {/* Image left / Text right — rounded shape */}
      <TextImageSection
        heading="A Lasting First Impression"
        text="A truly clean vehicle is about more than just appearance; it’s about the feeling of stepping into a pristine environment. Our interior and exterior processes are designed to restore that day one sensation, providing a sharp, professional look that stands out in any setting."
        imageUrl="https://res.cloudinary.com/drlyt63cm/image/upload/f_avif/q_auto/image21_isesm4.webp"
        reverse
        shape="rounded"
      />
      <WashComparison />
      <GalleryGrid />
      <AboutSection />
      <ServiceAgreement />
      <ServiceArea />
      <FAQSection />
      <CTABanner />
      <InstagramGallery />
      <FullWidthParagraph />
      <Footer />
    </div>
  );
};

export default Index;
