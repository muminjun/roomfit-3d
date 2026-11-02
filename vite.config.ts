import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const requested =
  process.env.VITE_BASE_PATH ??
  (repo && !repo.endsWith(".github.io") ? repo : "");
const normalized = requested.replace(/^\/+|\/+$/g, "");
const base = `/${normalized}${normalized ? "/" : ""}`;

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|react-reconciler|scheduler)[\\/]/,
              includeDependenciesRecursively: false,
            },
            {
              name: "konva-vendor",
              test: /node_modules[\\/](konva|react-konva)[\\/]/,
              includeDependenciesRecursively: false,
            },
            {
              name: "three-core",
              test: /node_modules[\\/]three[\\/]build[\\/]three\.core\.js$/,
              includeDependenciesRecursively: false,
            },
            {
              name: "three-module",
              test: /node_modules[\\/]three[\\/]build[\\/]three\.module\.js$/,
              includeDependenciesRecursively: false,
            },
          ],
        },
      },
    },
  },
  test: { exclude: ["tests/e2e/**", "**/node_modules/**"] },
});
