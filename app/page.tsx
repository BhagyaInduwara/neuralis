"use client";

import { useCallback, useState } from "react";
import gsap from "gsap";
import SceneRoot from "@/components/3d/SceneRoot";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import MouseInteraction from "@/components/animation/MouseInteraction";
import WaveDirector from "@/components/animation/WaveDirector";
import Navigation from "@/components/ui/Navigation";
import SectionIndicator from "@/components/ui/SectionIndicator";
import Cursor from "@/components/ui/Cursor";
import LoadingScreen from "@/components/ui/LoadingScreen";
import Hero from "@/components/sections/Hero";
import Technology from "@/components/sections/Technology";
import Performance from "@/components/sections/Performance";
import Architecture from "@/components/sections/Architecture";
import About from "@/components/sections/About";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/sections/Footer";
import { powerOn } from "@/lib/wave";
import { prefersReducedMotion } from "@/lib/utils";

/** Seconds into the chip power-on before the hero copy starts revealing. */
const HERO_DELAY = 0.7;

export default function Home() {
  const [sceneReady, setSceneReady] = useState(false);
  const [heroPlay, setHeroPlay] = useState(false);

  const handleReady = useCallback(() => setSceneReady(true), []);

  const handleLoaderExited = useCallback(() => {
    const reduced = prefersReducedMotion();
    powerOn(reduced);
    gsap.delayedCall(reduced ? 0 : HERO_DELAY, () => setHeroPlay(true));
  }, []);

  return (
    <>
      <LoadingScreen ready={sceneReady} onExited={handleLoaderExited} />
      <SmoothScrollProvider>
        <SceneRoot onReady={handleReady} />
        {/* Host for drei <Html> labels: above the page copy, below the header. */}
        <div id="scene-overlay" className="pointer-events-none fixed inset-0 z-20" />
        <MouseInteraction />
        <WaveDirector />
        <Cursor />
        <Navigation />
        <SectionIndicator />

        <main className="relative z-10">
          <Hero play={heroPlay} />
          <Technology />
          <Performance />
          <Architecture />
          <About />
          <CTA />
        </main>

        <div className="relative z-10">
          <Footer />
        </div>
      </SmoothScrollProvider>
    </>
  );
}
