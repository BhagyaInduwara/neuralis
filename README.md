# NEURALIS — Interactive 3D Landing

A cinematic, scroll-driven landing page for Neuralis, a fictional compute-hardware company. A fixed full-screen WebGL scene renders a procedural processor on an endless circuit board, and the camera flies through it as you scroll.

## Features

- **Procedural chip**: beveled graphite package, gold edge pads, heat-spreader rim and a raised die. The die's circuit texture is generated on a canvas at runtime. The chip floats, pulses on a 3s beat and tilts toward the cursor.
- **Circuit board world**: about 60 traces with 45° corners fan out from the chip socket and fade into fog. They render in a single merged draw call.
- **Data pulses**: 120 glowing pulses with fading tails travel along the traces, and via pads flash as pulses pass through them.
- **Scroll choreography**: each section has its own camera pose, with smooth scrubbing in both directions.
  - Hero: overhead view of the chip.
  - Technology: low glide over the board.
  - Performance: pull-back with twice the data traffic.
  - Architecture: top-down 3D diagram of five subsystems with tracking labels.
  - About: a slow orbit around the system.
  - Connect: high view with a light wave across every trace.
- **Polish**:
  - Bloom, ACES tone mapping, vignette, film grain and edge chromatic aberration.
  - Masked heading reveals and typed-in labels.
  - Scroll progress rail and magnetic CTA button.
  - Preloader that ends with the chip powering on.
- **Responsive and accessible**:
  - Phones and portrait screens stack the copy above the scene, with half the trace and particle counts.
  - `prefers-reduced-motion` keeps the camera still, crossfades sections and slows the pulses.
  - Rendering pauses while the tab is hidden.
  - The page falls back to a static layout without WebGL.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- [Three.js](https://threejs.org) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) and [@react-three/drei](https://github.com/pmndrs/drei)
- [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)
- [GSAP](https://gsap.com) + ScrollTrigger, with [Lenis](https://lenis.darkroom.engineering) smooth scrolling
- Tailwind CSS 4

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script          | Description               |
| --------------- | ------------------------- |
| `npm run dev`   | Start the dev server      |
| `npm run build` | Production build          |
| `npm run start` | Serve the production build |
| `npm run lint`  | Run ESLint                |

## Project structure

```
app/                    Page, layout and global styles
components/
  3d/                   R3F scene: Chip, CircuitBoard, DataPulses, Dust,
                        ArchitectureModules, CameraController, Lighting, PostFX
  sections/             Page sections (Hero, Technology, Performance, ...)
  ui/                   Navigation, section rail, preloader, cursor, text reveals
  animation/            Headless pointer tracking and the light-wave director
  providers/            Lenis + ScrollTrigger setup and section tracking
lib/
  sceneKeyframes.ts     Per-section camera poses (desktop, mobile, reduced motion)
  circuitPaths.ts       Procedural trace routing and sampling
  dieDetails.ts         Procedural die texture and pin grids
  sceneState.ts         Shared mutable state between the DOM and the render loop
```

### How the scroll choreography works

The scroll provider measures where each section is "arrived at" and turns the scroll position into a continuous section index (`scrollState.section`). Each frame, `CameraController` interpolates the keyframes in `lib/sceneKeyframes.ts` at that index with `power2.inOut` easing. Every other scene component reads the result. To retune a section, edit its keyframe: target, orbit angles, distance, screen offset, pulse density, and so on.

## License

See [LICENSE](LICENSE).
