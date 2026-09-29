// Última fragancia vista. El acceso al almacenamiento queda detrás de una interfaz
// `{ get(key), set(key, value) }` síncrona; el componente la recibe por props.
// Nada toca `window` ni `localStorage` al importarse.

export const LAST_SLUG_KEY = 'fragrance-scroll:last-slug'

// AJUSTE-11: la última vista se guarda en localStorage; en Tapcart usará su storage.
// Implementación del sandbox. Todo acceso va dentro de `try/catch`: `localStorage` puede no
// existir (servidor) o lanzar (modo privado, datos bloqueados, cuota).
export const localStorageStorage = {
  get(key) {
    try {
      return globalThis.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      globalThis.localStorage.setItem(key, value)
    } catch {
      // Sin almacenamiento la última vista simplemente no se recuerda.
    }
  },
}

/** Slug guardado como última vista, o `null` si no hay (o no hay `storage`, o falla). */
export function readLastSlug(storage) {
  try {
    const value = storage?.get(LAST_SLUG_KEY)
    return typeof value === 'string' && value ? value : null
  } catch {
    return null
  }
}

/** Guarda el slug como última vista. No hace nada sin `storage` y no lanza si falla. */
export function writeLastSlug(storage, slug) {
  try {
    storage?.set(LAST_SLUG_KEY, slug)
  } catch {
    // Igual que en `localStorageStorage`: si no se puede guardar, no pasa nada.
  }
}
