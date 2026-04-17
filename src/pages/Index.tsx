import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturedPros from "@/components/landing/FeaturedPros";
import JoinAsPro from "@/components/landing/JoinAsPro";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <HowItWorks />
        <FeaturedPros />
        <JoinAsPro />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
