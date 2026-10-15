"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { generatePinGrid, paintDieCanvases } from "@/lib/dieDetails";
import { introState, interactionState } from "@/lib/sceneState";
import { heartbeat } from "@/lib/utils";

const AMBER = new THREE.Color("#ff8a1f");
const PACKAGE_HALF = 1.075;
const PACKAGE_TOP = 0.11;
const DIE_SIZE = 1.48;
const DIE_TOP = 0.2;

function GoldPads() {
  const perSide = 18;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const inset = 0.98;
    let i = 0;
    for (let side = 0; side < 4; side++) {
      for (let k = 0; k < perSide; k++) {
        const along = ((k + 0.5) / perSide - 0.5) * (PACKAGE_HALF * 2 - 0.36);
        const angle = (side * Math.PI) / 2;
        const x = Math.cos(angle) * inset - Math.sin(angle) * along;
        const z = Math.sin(angle) * inset + Math.cos(angle) * along;
        dummy.position.set(x, PACKAGE_TOP + 0.005, z);
        dummy.rotation.set(0, -angle, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, perSide * 4]}>
      <boxGeometry args={[0.11, 0.012, 0.045]} />
      <meshPhysicalMaterial color="#d2a04a" metalness={1} roughness={0.28} />
    </instancedMesh>
  );
}

function SolderBalls() {
  const pins = useMemo(() => generatePinGrid(11, 0.16, 2), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    pins.forEach((pin, i) => {
      dummy.position.set(pin.x, 0, pin.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [pins]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, pins.length]}
      position={[0, -0.17, 0]}
    >
      <sphereGeometry args={[0.032, 10, 8]} />
      <meshStandardMaterial color="#a4a6ad" metalness={0.95} roughness={0.3} />
    </instancedMesh>
  );
}

/** Square frame with a hole, extruded upward with a small bevel. */
function HeatSpreaderRim() {
  const geometry = useMemo(() => {
    const outer = 0.86;
    const inner = 0.775;
    const shape = new THREE.Shape();
    shape.moveTo(-outer, -outer);
    shape.lineTo(outer, -outer);
    shape.lineTo(outer, outer);
    shape.lineTo(-outer, outer);
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-inner, -inner);
    hole.lineTo(-inner, inner);
    hole.lineTo(inner, inner);
    hole.lineTo(inner, -inner);
    hole.closePath();
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} position={[0, PACKAGE_TOP + 0.008, 0]}>
      <meshPhysicalMaterial color="#5d6068" metalness={1} roughness={0.22} />
    </mesh>
  );
}

function RimGlow({ material }: { material: THREE.MeshBasicMaterial }) {
  const half = 0.818;
  const y = PACKAGE_TOP + 0.075;
  const len = half * 2;
  return (
    <group>
      <mesh position={[0, y, half]} material={material}>
        <boxGeometry args={[len, 0.004, 0.01]} />
      </mesh>
      <mesh position={[0, y, -half]} material={material}>
        <boxGeometry args={[len, 0.004, 0.01]} />
      </mesh>
      <mesh position={[half, y, 0]} rotation={[0, Math.PI / 2, 0]} material={material}>
        <boxGeometry args={[len, 0.004, 0.01]} />
      </mesh>
      <mesh position={[-half, y, 0]} rotation={[0, Math.PI / 2, 0]} material={material}>
        <boxGeometry args={[len, 0.004, 0.01]} />
      </mesh>
    </group>
  );
}

export default function ProceduralChip() {
  const textures = useMemo(() => {
    const { color, emissive } = paintDieCanvases(1337, 1024);
    const map = new THREE.CanvasTexture(color);
    const emissiveMap = new THREE.CanvasTexture(emissive);
    for (const tex of [map, emissiveMap]) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
    }
    return { map, emissiveMap };
  }, []);

  const materials = useMemo(
    () => ({
      dieFace: new THREE.MeshPhysicalMaterial({
        map: textures.map,
        emissiveMap: textures.emissiveMap,
        emissive: AMBER,
        emissiveIntensity: 0,
        metalness: 0.55,
        roughness: 0.42,
        clearcoat: 0.8,
        clearcoatRoughness: 0.18,
      }),
      rimGlow: new THREE.MeshBasicMaterial({ color: AMBER, toneMapped: false }),
      ring: new THREE.MeshBasicMaterial({ toneMapped: false }),
      core: new THREE.MeshBasicMaterial({ toneMapped: false }),
    }),
    [textures]
  );

  useEffect(
    () => () => {
      textures.map.dispose();
      textures.emissiveMap.dispose();
      Object.values(materials).forEach((m) => m.dispose());
    },
    [textures, materials]
  );

  useFrame(({ clock }) => {
    const power = introState.power;
    const beat = heartbeat(clock.elapsedTime);
    const hover = interactionState.pulse;

    materials.dieFace.emissiveIntensity = power * (0.9 + beat * 1.5 + hover * 0.5);
    materials.rimGlow.color.copy(AMBER).multiplyScalar(power * (0.5 + beat * 1.4));
    materials.ring.color.set("#ff8a3d").multiplyScalar(0.15 + power * (1.2 + beat * 1.6));
    materials.core.color.set("#ffb066").multiplyScalar(0.1 + power * (1 + beat * 1.2));
  });

  return (
    <group>
      {/* Package body */}
      <RoundedBox args={[PACKAGE_HALF * 2, 0.22, PACKAGE_HALF * 2]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial
          color="#1b1c21"
          metalness={0.9}
          roughness={0.35}
          clearcoat={0.35}
          clearcoatRoughness={0.3}
        />
      </RoundedBox>

      {/* Substrate under the package */}
      <RoundedBox
        args={[PACKAGE_HALF * 2 + 0.04, 0.05, PACKAGE_HALF * 2 + 0.04]}
        radius={0.015}
        smoothness={2}
        position={[0, -0.135, 0]}
      >
        <meshStandardMaterial color="#0e1112" metalness={0.4} roughness={0.6} />
      </RoundedBox>

      <GoldPads />
      <HeatSpreaderRim />
      <RimGlow material={materials.rimGlow} />

      {/* Raised die */}
      <RoundedBox
        args={[DIE_SIZE, 0.09, DIE_SIZE]}
        radius={0.012}
        smoothness={2}
        position={[0, DIE_TOP - 0.045, 0]}
      >
        <meshPhysicalMaterial color="#0a0a0c" metalness={0.9} roughness={0.35} />
      </RoundedBox>
      <mesh
        position={[0, DIE_TOP + 0.0015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.dieFace}
      >
        <planeGeometry args={[DIE_SIZE - 0.04, DIE_SIZE - 0.04]} />
      </mesh>

      {/* Centre emblem */}
      <group position={[0, DIE_TOP + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh material={materials.ring}>
          <ringGeometry args={[0.128, 0.15, 6]} />
        </mesh>
        <mesh material={materials.core}>
          <circleGeometry args={[0.05, 6]} />
        </mesh>
      </group>

      <SolderBalls />
    </group>
  );
}
