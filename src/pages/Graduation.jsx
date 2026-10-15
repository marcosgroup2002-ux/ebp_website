import GraduationSection from "../components/GraduationSection";
import CTASection from "../components/CTASection";
import Seo from "../components/Seo";

export default function Graduation() {
  return (
    <>
      <Seo
        title="Graduation"
        description="Les cérémonies de graduation EBP : photos et vidéos complètes des projets Capstone présentés en anglais devant un jury, après 6 mois de formation à Cotonou et Calavi."
        path="/graduation"
      />
      <GraduationSection pageTop />
      <CTASection />
    </>
  );
}
