// Convierte el nombre visible de una fragancia en su slug (misma expresión que `slugify`
// de L:scroll-content.js).
export function slugify(name) {
  return name.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

// Índice de la fragancia con ese slug, o 0 si no existe o el slug es inválido.
// Comparación exacta, igual que `getIndexForSlug` de L:scroll-motor.js.
export function indexFromSlug(fragrances, slug) {
  const index = fragrances.findIndex((fragrance) => fragrance.slug === slug)
  return index === -1 ? 0 : index
}
