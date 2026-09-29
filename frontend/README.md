# Fragrance scroll (React 18)

Código fuente del componente de la sección `sections/fragrance-scroll.liquid`. Es una copia de
`labs/flat-react`, con estas diferencias:

- `src/shopify/`: el adaptador de Shopify (el equivalente de `src/sandbox/`). Es un custom element
  `<fragrance-scroll>` que lee la config que arma la sección Liquid y monta el colapsado. El
  desplegado se abre como overlay en un portal sobre `body`, con una entrada en el historial:
  "atrás" lo cierra y al volver desde la página de producto se reabre.
- `Bottle.jsx`: si la fragancia trae `url` (la página de producto), la botella enlaza ahí en la misma
  pestaña. Sin `url` se mantiene el link de prueba.
- `config/assets.js` (sólo sandbox y tests) toma las imágenes de `../assets`, las mismas del tema.

## Comandos

```sh
npm install
npm run dev     # sandbox (?i=0..9 abre el desplegado en esa fragancia)
npm test
npm run build   # escribe ../assets/fragrance-scroll.js y ../assets/fragrance-scroll.css
```

Después de cualquier cambio en `src/` hay que correr `npm run build` para que el tema lo tome.
Esta carpeta no se sube al tema (ver `../.shopifyignore`).
