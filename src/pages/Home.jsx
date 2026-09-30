import Seo from "../components/Seo";
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
      <Seo
        title="Parlez anglais avec confiance en 6 mois"
        description="EBP - English for Busy People. Cohortes de 6 mois, 60% de pratique orale, présentiel à Cotonou & Calavi ou en ligne. Passez le test de niveau gratuit."
        path="/"
      />
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
