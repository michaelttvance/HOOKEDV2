import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    TanStackRouterVite({
      autoCodeSplitting: true,
      plugin: {
        hmr: {
          style: "webpack",
        },
      },
    }),
    tanstackStart({ server: { entry: "server" } }),
    (nitro as any)({ config: { preset: "vercel" } }),
    react(),
  ],
});
