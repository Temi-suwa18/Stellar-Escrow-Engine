import { Navbar } from '@/components/marketing/navbar';
import { Hero } from '@/components/marketing/hero';
import { FeatureGrid } from '@/components/marketing/feature-grid';
import { CodeShowcase } from '@/components/marketing/code-showcase';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { DevelopersSection } from '@/components/marketing/developers-section';
import { CtaSection } from '@/components/marketing/cta-section';
import { Footer } from '@/components/marketing/footer';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
        <CodeShowcase />
        <HowItWorks />
        <DevelopersSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
