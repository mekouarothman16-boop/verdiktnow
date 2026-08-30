import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Placeholder remplacé par le compilateur Next.js au build — inutilisable hors d'une vraie
      // requête Next (voir AGENTS.md). Les modules testés l'importent sans jamais appeler lang().
      "next/root-params": path.resolve(import.meta.dirname, "./src/lib/test/next-root-params.stub.ts"),
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
});
