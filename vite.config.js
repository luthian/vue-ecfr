import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import { VuetifyResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      // resolvers for custom components
      resolvers: [
        // Vuetify
        VuetifyResolver(),
      ],
      // Vue version of project.
      version: 2.7,
    }),
  ],
  // Resolver
  resolve: {
    // https://vitejs.dev/config/shared-options.html#resolve-alias
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
});
