import HeroSection from "../components/HeroSection";
import FormatsBanner from "../components/FormatsBanner";
import FeaturesGrid from "../components/FeaturesGrid";
import ProgramSection from "../components/ProgramSection";
import MethodSection from "../components/MethodSection";
import CoverageSection from "../components/CoverageSection";
import TeamSection from "../components/TeamSection";
import PricingSection from "../components/PricingSection";
import TestimonialsSection from "../components/TestimonialsSection";
import CTASection from "../components/CTASection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FormatsBanner />
      <FeaturesGrid />
      <ProgramSection />
      <MethodSection />
      <CoverageSection />
      <TeamSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
