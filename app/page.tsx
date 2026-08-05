import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Catalog from "@/components/Catalog";
import Artists from "@/components/Artists";
import Playlists from "@/components/Playlists";
import Streamers from "@/components/Streamers";
import About from "@/components/About";
import Blog from "@/components/Blog";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Catalog />
        <Artists />
        <Playlists />
        <Streamers />
        <About />
        <Blog />
        <Contact />
      </main>
      <Footer />
    </>
  );
}