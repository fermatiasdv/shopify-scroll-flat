// AJUSTE-07: contenido fijo en el código, sin CMS.

// Las 10 fragancias, en el orden del `idx` del legacy (L:scroll-constants.js).
// `ingredients` son las 3 primeras entradas no comentadas de `ingredientes` en el legacy.
// `ingredientStretch` sólo lo lleva Painkiller (L:scroll-content.js, FIXED_INGREDIENT_IMAGE_OVERRIDES).
export const FRAGRANCES = [
  {
    slug: 'rebellious',
    name: 'Rebellious',
    ingredients: ['Saffron', 'Bergamot', 'Caramel'],
    ingredientStretch: null,
  },
  {
    slug: 'forbidden_flower',
    name: 'Forbidden Flower',
    ingredients: ['Lychee', 'Bergamot', 'Freesia'],
    ingredientStretch: null,
  },
  {
    slug: 'wonder_of_the_world',
    name: 'Wonder of the World',
    ingredients: ['Almond', 'Freesia', 'Caramel'],
    ingredientStretch: null,
  },
  {
    slug: 'painkiller',
    name: 'Painkiller',
    ingredients: ['Lilac', 'Bergamot', 'Musk'],
    ingredientStretch: { scaleX: 2, scaleY: 1.2 },
  },
  {
    slug: 'jagged_edge',
    name: 'Jagged Edge',
    ingredients: ['Bergamot', 'Tonka Bean', 'Rose'],
    ingredientStretch: null,
  },
  {
    slug: 'crimson_desert',
    name: 'Crimson Desert',
    ingredients: ['Raspberry', 'Mandarin', 'Jasmine'],
    ingredientStretch: null,
  },
  {
    slug: 'glitterati',
    name: 'Glitterati',
    ingredients: ['Jasmine', 'Vanilla', 'Musk'],
    ingredientStretch: null,
  },
  {
    slug: 'ecstasy',
    name: 'Ecstasy',
    ingredients: ['Black Currant', 'Ginger', 'Rose'],
    ingredientStretch: null,
  },
  {
    slug: 'epicurean',
    name: 'Epicurean',
    ingredients: ['Jasmine', 'Rose', 'Black Currant'],
    ingredientStretch: null,
  },
  {
    slug: 'london_legend',
    name: 'London Legend',
    ingredients: ['Saffron', 'Bulgarian Rose', 'Vanilla'],
    ingredientStretch: null,
  },
]
