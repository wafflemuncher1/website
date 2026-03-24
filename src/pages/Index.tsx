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
      <PremiumAddOns />

       {/* Text left / Image right — blob shape */}
      <TextImageSection
        heading="Precision Detailing, Perfected"
        text="Every vehicle we touch receives the meticulous care it deserves. From paint correction to ceramic coatings, our trained specialists use cutting-edge techniques to deliver results that speak for themselves."
        imageUrl="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&h=600&fit=crop"
        shape="blob"
      />

      {/* Text left / Image right — diamond shape */}
      <TextImageSection
        heading="Mobile Convenience, Studio Quality"
        text="We bring the full detailing studio to your location. No need to drop off your car — our self-contained mobile units carry everything needed for a flawless finish, right in your driveway."
        imageUrl="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop"
        shape="diamond"
      />

      {/* Image left / Text right — rounded shape */}
      <TextImageSection
        heading="Protection That Lasts"
        text="Our ceramic coating and paint protection packages don't just make your car look incredible — they shield it from UV damage, chemical stains, and everyday wear for years to come."
        imageUrl="https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800&h=600&fit=crop"
        reverse
        shape="rounded"
      />
      <WashComparison />
      <GalleryGrid />
      <ReviewsGrid />
      <AboutSection />
      <ServiceAgreement />
      <ServiceArea />
      <FAQSection />
      <EstimateEngine />
      <CTABanner />
      <InstagramGallery />
      <FullWidthParagraph />
      <Footer />
    </div>
  );
};

export default Index;
