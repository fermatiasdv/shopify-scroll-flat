// Precarga: arranca al terminar de cargar la página. Con el colapsado montado, después del `load` y
// en un momento libre, se descarga por adelantado lo que va a necesitar el desplegado:
//   1. las 10 botellas,
//   2. los fondos y las imágenes de ingrediente, en prioridad baja.
// Si `navigator.connection?.saveData` es true, no se precarga nada. Los errores se ignoran y nada de
// esto bloquea ni retrasa el render del colapsado. Nada toca `window`/`document`/`navigator` a nivel
// de módulo: todo queda dentro de las funciones.

// Llama a `cb` después del evento `load` (o enseguida si ya pasó) y, adentro de eso, en un momento
// libre del hilo principal.
function onLoadThenIdle(cb) {
  const idle = () => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(cb)
    else setTimeout(cb, 0)
  }
  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}

// Precarga una imagen sin agregarla al DOM. Falla en silencio.
function preloadImage(url, priority) {
  try {
    const img = new Image()
    img.fetchPriority = priority
    img.decoding = 'async'
    img.src = url
  } catch {
    // Sin Image (entorno raro) o URL inválida: no pasa nada, la carga normal reintenta.
  }
}

/**
 * Programa la precarga de todo lo que necesita el modo desplegado. Se llama una vez al montar el
 * colapsado.
 * @param {object} assets - `DEFAULT_ASSETS` (o el que reciba `FragranceScroll` por props).
 */
export function schedulePreload(assets) {
  onLoadThenIdle(() => {
    try {
      if (navigator.connection?.saveData) return
    } catch {
      // Sin `navigator.connection`: se sigue como si no hubiera ahorro de datos activado.
    }

    Object.values(assets.bottles).forEach((url) => preloadImage(url, 'auto'))
    assets.backgrounds.forEach((url) => preloadImage(url, 'low'))
    // 3 variantes por fragancia.
    Object.values(assets.ingredients)
      .flat()
      .forEach((url) => preloadImage(url, 'low'))
  })
}
