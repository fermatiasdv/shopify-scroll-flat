import { INGREDIENT_LINE_COUNT, panelLineY } from './layout.js'

// Separador entre nombres de ingrediente en la fila única (L:scroll-panel.js).
const INGREDIENT_SEPARATOR = ' – '

// Geometría de la pantalla de una fragancia para un layout dado. No muta nada: ante un resize
// se vuelve a llamar con el layout nuevo. Reemplaza a `buildContent`/`relayoutContent` del legacy.
export function sceneFor(fragranceIndex, layout, fragrances) {
  const fragrance = fragrances[fragranceIndex]
  const { cx, cy } = layout

  return Object.freeze({
    // Como `applyProductLayout` de L:scroll-content.js.
    product: Object.freeze({ x: cx, y: cy, size: layout.product.size }),
    // Como `applyAlmondTestLayout` de L:scroll-content.js: `height` es el alto real de la botella.
    ingredient: Object.freeze({
      x: cx,
      y: cy,
      height: Math.round(layout.product.halfH * 2),
      stretch: fragrance.ingredientStretch ? Object.freeze({ ...fragrance.ingredientStretch }) : null,
    }),
    // Como `buildTitlePanelItems` de L:scroll-panel.js.
    title: Object.freeze({ text: fragrance.name, x: cx, y: panelLineY(0, layout) }),
    ingredientsLine: Object.freeze({
      text: fragrance.ingredients.slice(0, INGREDIENT_LINE_COUNT).join(INGREDIENT_SEPARATOR),
      x: cx,
      y: panelLineY(INGREDIENT_LINE_COUNT, layout),
    }),
  })
}
