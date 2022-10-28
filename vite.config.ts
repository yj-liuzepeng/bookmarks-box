import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path, { resolve } from "path";
import makeManifest from "./utils/plugins/make-manifest";
import customDynamicImport from './utils/plugins/custom-dynamic-import';
const root = resolve(__dirname, "src");
const assetsDir = resolve(root, "assets");
const pagesDir = resolve(root, "pages");
const publicDir = resolve(__dirname, "public");
const outDir = resolve(__dirname, "dist");
const isDev = process.env.__DEV__ === "true";
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@src": root,
      "@assets": assetsDir,
      "@pages": pagesDir,
    },
  },
  plugins: [
    react(),
    makeManifest(), 
    customDynamicImport(),
  ],
  publicDir,
  build: {
    outDir,
    sourcemap: isDev,
    rollupOptions: {
      input: {
        popup: resolve(pagesDir, "popup", "index.html"),
        background: resolve(pagesDir, "background", "index.ts"),
      },
      output: {
        entryFileNames: "src/pages/[name]/index.js",
        chunkFileNames: isDev
          ? "assets/js/[name].js"
          : "assets/js/[name].[hash].js",
        assetFileNames: (assetInfo: {
          name: string | undefined;
          source: string | Uint8Array;
          type: 'asset';
        }) => {
          const { dir, name: _name } = path.parse(assetInfo.name || '');
          const assetFolder = getLastElement(dir.split("/"));
          const name = assetFolder + firstUpperCase(_name);
          return `assets/[ext]/${name}.chunk.[ext]`;
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true, // 支持内联 JavaScript
      }
    }
  }
})
function getLastElement<T>(array: ArrayLike<T>): T {
  const length = array.length;
  const lastIndex = length - 1;
  return array[lastIndex];
}

function firstUpperCase(str: string) {
  const firstAlphabet = new RegExp(/( |^)[a-z]/, "g");
  return str.toLowerCase().replace(firstAlphabet, (L) => L.toUpperCase());
}
