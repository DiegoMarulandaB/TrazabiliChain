import { Header } from "@/components/header/Header";
import { AboutSection } from "@/components/about-section/AboutSection";
import { RecordsPanel } from "@/components/records-panel/RecordsPanel";
import { SiteFooter } from "@/components/site-footer/SiteFooter";

export default function Home() {
  return (
    <div className="min-h-screen bg-paper bg-[linear-gradient(135deg,rgba(227,241,235,0.35),transparent_44%)]">
      <Header />
      <main
        id="contenido"
        className="mx-auto w-[min(100%-2.5rem,70rem)] py-11 sm:w-[min(100%-3rem,70rem)] sm:py-16"
      >
        <RecordsPanel />
        <AboutSection />
      </main>
      <SiteFooter />
    </div>
  );
}
