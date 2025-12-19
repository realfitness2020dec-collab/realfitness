import HeroSection from "@/components/HeroSection";
import PackagesSection from "@/components/PackagesSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <PackagesSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;
