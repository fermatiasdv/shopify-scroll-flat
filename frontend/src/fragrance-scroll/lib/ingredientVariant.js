// Elige al azar una de las 3 variantes de imagen de ingrediente de una fragancia.
// `random` es inyectable (por defecto `Math.random`) para poder testear el rango sin depender de él.
export function pickIngredientVariant(variants, random = Math.random) {
  return variants[Math.floor(random() * variants.length)]
}
