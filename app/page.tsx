"use client";

import { useCallback, useState } from "react";
import SceneRoot from "@/components/3d/SceneRoot";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import MouseInteraction from "@/components/animation/MouseInteraction";
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

export default function Home() {
  const [sceneReady, setSceneReady] = useState(false);

  const handleReady = useCallback(() => setSceneReady(true), []);

  return (
    <>
      <LoadingScreen ready={sceneReady} />
      <SmoothScrollProvider>
        <SceneRoot onReady={handleReady} />
        <MouseInteraction />
        <Cursor />
        <Navigation />
        <SectionIndicator />

        <main className="relative z-10">
          <Hero />
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
