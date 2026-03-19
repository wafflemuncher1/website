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

const Index = () => {
  return (
    <div className="min-h-screen">
      <StickyHeader />
      <HeroSection />
      <PackagesSection />
      <AddOnBoutique />
      <WashComparison />
      <ExcellenceSection />
      <EstimateEngine />
      <GalleryGrid />
      <ReviewsGrid />
      <AboutSection />
      <ServiceAgreement />
      <ServiceArea />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
