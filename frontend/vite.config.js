import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
//  - `npm run dev`: sandbox (index.html + src/sandbox), con las imágenes de assets/ del tema.
//  - `npm run build`: bundle del tema, una IIFE con React incluido, escrita en ../assets como
//    fragrance-scroll.js y fragrance-scroll.css (nombres fijos, los carga la sección Liquid).
// Escapa a \uXXXX todo carácter no ASCII del bundle (–, →, ✕…), así se ve bien aunque el script
// se sirva sin charset. Sólo aparecen dentro de strings, donde el escape es equivalente. Va en
// `generateBundle` porque el minificador corre después de `renderChunk` y vuelve a decodificarlos.
const asciiOnly = {
  name: 'ascii-only',
  generateBundle(_options, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue
      chunk.code = chunk.code.replace(
        /[\u0080-￿]/g,
        (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`,
      )
    }
  },
}

export default defineConfig(({ command }) => ({
  plugins: [react(), command === 'build' && asciiOnly],
  // El sandbox sirve las imágenes de ../assets, fuera de frontend/.
  server: { fs: { allow: ['..'] } },
  ...(command === 'build' && {
    publicDir: false,
    // El modo librería no reemplaza `process.env.NODE_ENV`: sin esto React queda en modo desarrollo.
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      outDir: '../assets',
      emptyOutDir: false,
      lib: {
        entry: 'src/shopify/main.jsx',
        formats: ['iife'],
        name: 'FragranceScrollShopify',
        fileName: () => 'fragrance-scroll.js',
        cssFileName: 'fragrance-scroll',
      },
    },
  }),
}))
