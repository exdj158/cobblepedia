import vikeRoutegen from "@blankeos/vike-routegen"
import tailwindcss from "@tailwindcss/vite"
import vike from "vike/plugin"
import vikeSolid from "vike-solid/vite"
import { defineConfig } from "vite"
import tsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tailwindcss(), tsConfigPaths(), vike(), vikeSolid(), vikeRoutegen()],
  server: { port: 3000 },
  preview: { port: 3000 },
  envPrefix: ["PUBLIC_"],
})
