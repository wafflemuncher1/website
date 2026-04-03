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
      <WashComparison />
      <GalleryGrid />
      "ReviewsGrid"
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
