// electron.vite.config.ts
import { resolve } from "path";
import { normalizePath } from "vite";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
var __electron_vite_injected_dirname = "/home/project";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            // теперь кроссплатформенно
            src: normalizePath(resolve(__electron_vite_injected_dirname, "src/renderer/alt.html")),
            dest: ""
          }
        ]
      })
    ]
  }
});
export {
  electron_vite_config_default as default
};
