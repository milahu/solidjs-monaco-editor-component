import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

// TODO produce an empty ".nojekyll" file in docs/
// to make github deploy faster

// TODO move docs/ to branch gh-pages to keep repo small
// monaco-editor has 4 MByte!

// TODO move monaco-editor to a separate chunk to avoid rebuilds
// see also https://stackoverflow.com/questions/73483816/minimal-monaco-editor-without-language-support

// https://github.com/vdesjs/vite-plugin-monaco-editor
//import monacoEditorPlugin from 'vite-plugin-monaco-editor';

const assetsDir = '';
//const assetsDir = 'assets/';

const outputDefaults = {
  // remove hashes from filenames
  entryFileNames: `${assetsDir}[name].js`,
  chunkFileNames: `${assetsDir}[name].js`,
  assetFileNames: `${assetsDir}[name].[ext]`,
}

export default defineConfig({
  plugins: [
    solidPlugin(),
    //monacoEditorPlugin({
    //  languageWorkers: [],
    //}),
  ],
  base: "./", // generate relative paths in html
  //root: "..", // folder of index.html
  build: {
    outDir: '../docs', // github pages
    emptyOutDir: true,
    target: 'esnext',
    //sourcemap: true,
    //minify: false, // smaller git diffs
    rollupOptions: {
      output: {
        ...outputDefaults,
      }
    },
  },
  esbuild: {
    keepNames: true,
  },
  worker: {
    rollupOptions: {
      output: {
        ...outputDefaults,
      }
    },
  },
  clearScreen: false,
});
