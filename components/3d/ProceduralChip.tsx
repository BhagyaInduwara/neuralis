"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { generateDiePattern, generatePinGrid } from "@/lib/dieDetails";

const DIE_COLOR_ACTIVE = new THREE.Color("#ff8a3d").multiplyScalar(1.7);
const DIE_COLOR_IDLE = new THREE.Color("#2c2d33");
const PIN_COLOR = new THREE.Color("#8b8d94");
const EMBLEM_CLEARANCE = 0.24;

function DieBars() {
  const bars = useMemo(
    () =>
      generateDiePattern(1337, 26, 0.0527, 0.13).filter(
        (bar) => Math.hypot(bar.x, bar.z) > EMBLEM_CLEARANCE
      ),
    []
  );
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();

    bars.forEach((bar, i) => {
      dummy.position.set(bar.x, 0, bar.z);
      dummy.rotation.y = bar.horizontal ? 0 : Math.PI / 2;
      dummy.scale.set(bar.length, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, bar.active ? DIE_COLOR_ACTIVE : DIE_COLOR_IDLE);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [bars]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, bars.length]}
      position={[0, 0.286, 0]}
    >
      <boxGeometry args={[1, 0.01, 0.013]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function PinGrid() {
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
      position={[0, -0.185, 0]}
    >
      <cylinderGeometry args={[0.028, 0.028, 0.05, 6]} />
      <meshStandardMaterial
        color={PIN_COLOR}
        metalness={0.9}
        roughness={0.3}
      />
    </instancedMesh>
  );
}

function CenterEmblem() {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const pulse = 0.7 + Math.sin(clock.elapsedTime * 1.4) * 0.3;
    if (ringRef.current) {
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.color.set("#ff8a3d").multiplyScalar(1.1 + pulse * 0.35);
    }
    if (coreRef.current) {
      const material = coreRef.current.material as THREE.MeshBasicMaterial;
      material.color.set("#ffb066").multiplyScalar(0.9 + pulse * 0.25);
    }
  });

  return (
    <group position={[0, 0.283, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.128, 0.15, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
      <mesh ref={coreRef}>
        <circleGeometry args={[0.05, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
    </group>
  );
}

function EdgeFrame() {
  const size = 1.62;
  const thickness = 0.012;
  const y = 0.178;
  const color = "#ff8a3d";

  return (
    <group>
      <mesh position={[0, y, size / 2]}>
        <boxGeometry args={[size, 0.006, thickness]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, y, -size / 2]}>
        <boxGeometry args={[size, 0.006, thickness]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[size / 2, y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[size, 0.006, thickness]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[-size / 2, y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[size, 0.006, thickness]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function ProceduralChip() {
  return (
    <group>
      {/* Main body */}
      <RoundedBox args={[2.15, 0.34, 2.15]} radius={0.05} smoothness={4}>
        <meshPhysicalMaterial
          color="#141419"
          metalness={0.82}
          roughness={0.38}
          clearcoat={0.5}
          clearcoatRoughness={0.28}
          reflectivity={0.55}
        />
      </RoundedBox>

      {/* Processor die */}
      <RoundedBox
        args={[1.5, 0.11, 1.5]}
        radius={0.02}
        smoothness={3}
        position={[0, 0.225, 0]}
      >
        <meshPhysicalMaterial
          color="#0a0a0c"
          metalness={0.55}
          roughness={0.48}
          clearcoat={0.3}
        />
      </RoundedBox>

      <DieBars />
      <EdgeFrame />
      <CenterEmblem />
      <PinGrid />
    </group>
  );
}
