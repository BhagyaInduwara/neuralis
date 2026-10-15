"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  collectVias,
  sampleTrace,
  type CircuitTrace,
  type Vec3,
} from "@/lib/circuitPaths";
import { introState, motionPrefs, scrollState, waveState } from "@/lib/sceneState";
import { liveScene } from "@/lib/sceneFrame";
import { mulberry32 } from "@/lib/utils";

const TAIL = 6;
const TAIL_SPACING = 0.075;
const PULSE_COLOR = new THREE.Color("#ffc27a");
const VIA_BASE = new THREE.Color("#3b2410");
const VIA_FLASH = new THREE.Color("#ffb35c");

interface Pulse {
  trace: number;
  distance: number;
  speed: number;
  alive: boolean;
}

interface DataPulsesProps {
  traces: CircuitTrace[];
  count: number;
  boost?: number;
}

export default function DataPulses({ traces, count, boost = 1 }: DataPulsesProps) {
  const pulseMesh = useRef<THREE.InstancedMesh>(null);
  const viaMesh = useRef<THREE.InstancedMesh>(null);
  const vias = useMemo(() => collectVias(traces), [traces]);

  /** Vias grouped per trace, ordered by distance along it. */
  const viasByTrace = useMemo(() => {
    const groups: number[][] = traces.map(() => []);
    vias.forEach((via, i) => groups[via.traceIndex].push(i));
    return groups;
  }, [traces, vias]);

  const sim = useMemo(() => {
    const rand = mulberry32(4242);
    const pulses: Pulse[] = Array.from({ length: count }, () => ({
      trace: Math.floor(rand() * traces.length),
      distance: 0,
      speed: 0.9 + rand() * 1.6,
      alive: false,
    }));
    // Stagger the initial population along the network so it never starts empty.
    pulses.forEach((p) => {
      p.distance = rand() * traces[p.trace].total;
      p.alive = true;
    });
    return {
      rand,
      pulses,
      flash: new Float32Array(vias.length),
      dummy: new THREE.Object3D(),
      color: new THREE.Color(),
      point: [0, 0, 0] as Vec3,
    };
  }, [count, traces, vias.length]);

  useLayoutEffect(() => {
    const mesh = viaMesh.current;
    if (!mesh) return;
    const { dummy, color } = sim;
    vias.forEach((via, i) => {
      dummy.position.set(via.position[0], via.position[1] + 0.002, via.position[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.copy(VIA_BASE));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [sim, vias]);

  useFrame((_, delta) => {
    const heads = pulseMesh.current;
    const viaInstances = viaMesh.current;
    if (!heads || !viaInstances) return;
    const { pulses, flash, dummy, color, point, rand } = sim;
    const dt = Math.min(delta, 0.05);
    const reduced = motionPrefs.reduced;
    const power = introState.power;

    const activeCount = Math.round(count * liveScene.pulseDensity);
    const speedScale =
      liveScene.pulseSpeed *
      (reduced ? 0.35 : 1) *
      (1 + Math.min(Math.abs(scrollState.velocity), 1) * 0.5);

    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      const trace = traces[p.trace];

      if (p.alive) {
        const previous = p.distance;
        p.distance += p.speed * speedScale * dt;

        const group = viasByTrace[p.trace];
        for (let g = 0; g < group.length; g++) {
          const viaDistance = vias[group[g]].distance;
          if (viaDistance > previous && viaDistance <= p.distance) flash[group[g]] = 1;
        }

        if (p.distance - TAIL * TAIL_SPACING > trace.total) {
          p.alive = false;
        }
      }

      // Respawn at the chip while this slot is part of the active pool.
      if (!p.alive && i < activeCount && power > 0.05) {
        p.trace = Math.floor(rand() * traces.length);
        p.distance = 0;
        p.speed = 0.9 + rand() * 1.6;
        p.alive = true;
      }

      const current = traces[p.trace];
      for (let k = 0; k < TAIL; k++) {
        const index = i * TAIL + k;
        const d = p.distance - k * TAIL_SPACING;
        if (!p.alive || d < 0 || d > current.total || power < 0.01) {
          dummy.scale.setScalar(0);
          dummy.position.set(0, -50, 0);
          dummy.updateMatrix();
          heads.setMatrixAt(index, dummy.matrix);
          continue;
        }
        sampleTrace(current, d, point);
        const fadeIn = Math.min(d / 0.4, 1);
        const fadeOut = Math.min((current.total - d) / 0.8, 1);
        const tailFade = Math.pow(1 - k / TAIL, 1.6);
        const intensity = fadeIn * fadeOut * tailFade * power;

        dummy.position.set(point[0], point[1] + 0.012, point[2]);
        dummy.scale.setScalar((1 - k * 0.12) * Math.sqrt(boost));
        dummy.updateMatrix();
        heads.setMatrixAt(index, dummy.matrix);
        heads.setColorAt(index, color.copy(PULSE_COLOR).multiplyScalar(intensity * 3.2 * boost));
      }
    }
    heads.instanceMatrix.needsUpdate = true;
    if (heads.instanceColor) heads.instanceColor.needsUpdate = true;

    const decay = Math.exp(-dt * 3.5);
    const { radius, strength, afterglow } = waveState;
    for (let v = 0; v < vias.length; v++) {
      flash[v] *= decay;
      const via = vias[v];
      const d = traces[via.traceIndex].startRadius + via.distance;
      const front = (d - radius) / 1.1;
      const wave = strength * Math.exp(-front * front) + (d < radius ? afterglow * 0.6 : 0);
      const glow = Math.min(flash[v] * power + wave, 1.6);
      color.copy(VIA_BASE).lerp(VIA_FLASH, Math.min(glow, 1)).multiplyScalar(1 + glow * 2.2);
      viaInstances.setColorAt(v, color);
    }
    if (viaInstances.instanceColor) viaInstances.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={pulseMesh}
        args={[undefined, undefined, count * TAIL]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={viaMesh} args={[undefined, undefined, vias.length]}>
        <cylinderGeometry args={[0.05, 0.05, 0.01, 10]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
