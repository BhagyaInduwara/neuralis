import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // These React Compiler-oriented rules assume every mutation flows
    // through React state. This project doesn't enable the compiler, and
    // two patterns here are deliberate: react-three-fiber's useFrame
    // mutates camera/mesh objects directly every frame (the documented,
    // performant way to animate in R3F), and lib/sceneState.ts is a
    // plain mutable store the WebGL layer reads without React re-renders
    // by design. set-state-in-effect also false-positives on the
    // standard client-only-detection pattern (render null, then flip
    // state in an effect) used to avoid SSR/hydration mismatches.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
