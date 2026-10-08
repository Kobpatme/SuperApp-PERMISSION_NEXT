import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  globalIgnores([".next/**", ".data/**", "out/**", "build/**", "_discovery_sources/**", "**/.obsidian/**", "next-env.d.ts"]),
]);
