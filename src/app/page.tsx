import Header from '@/components/Header';
import HeroSection from '@/components/homepage/HeroSection';
import FeaturedProducts from '@/components/homepage/FeaturedProducts';
import Benefits from '@/components/homepage/Benefits';
import Testimonials from '@/components/homepage/Testimonials';
import AIAssistant from '@/components/AIAssistant';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="kyro-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturedProducts />
        <Benefits />
        <Testimonials />
        <AIAssistant />
      </main>
      <Footer />
    </div>
  );
}
