import HeroSection from "@/components/HeroSection";
import PackagesSection from "@/components/PackagesSection";
import FeaturesSection from "@/components/FeaturesSection";
import FeedbackSection from "@/components/FeedbackSection";
import BlogSection from "@/components/BlogSection";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <PackagesSection />
      <FeaturesSection />
      <FeedbackSection />
      <BlogSection />
      <Footer />
      <InstallPrompt />
    </div>
  );
};

export default Index;
