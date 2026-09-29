import { useEffect, useRef, useState } from 'react'
import { COLLAPSE_TO_CENTER_MS, INGREDIENT_ZOOM_SCALE } from '../config/timing.js'

// Razón ancho/alto natural de la imagen, o null si todavía no cargó.
function naturalRatio(img) {
  return img && img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null
}

// Imagen fija de ingrediente, como `createImageElement` de L:scroll-styles.js: el alto
// es el de la botella y el ancho sale del aspect ratio real. Con `stretch` (Painkiller) el ancho
// se calcula con la razón natural de la imagen; hasta medirla queda en `auto`.
//
// `hidden` es el estado oculto: opacidad 0 y zoom INGREDIENT_ZOOM_SCALE. Pasar de
// uno a otro dura `transitionMs`: COLLAPSE_TO_CENTER_MS en las transiciones (salida en t = 0, entrada
// en t = COLLAPSE_TO_CENTER_MS, como `collapseIngredientsToCenter` y `transitionDisplay` de L:scroll-styles.js) y
// LABEL_TRANSITION_MS al revelarse en la carga inicial (`revealDelayedIngredients` de `setDisplayInstant`).
export default function IngredientImage({
  src,
  x,
  y,
  height,
  stretch,
  hidden = false,
  transitionMs = COLLAPSE_TO_CENTER_MS,
}) {
  const imgRef = useRef(null)
  // Se guarda junto con su `src`, para no arrastrar la razón de otra imagen.
  const [measured, setMeasured] = useState(null)

  const measure = () => {
    const ratio = naturalRatio(imgRef.current)
    if (ratio) setMeasured({ src, ratio })
  }

  // La imagen puede estar ya cargada al hidratar, y entonces `onLoad` no dispara.
  useEffect(() => {
    const ratio = stretch ? naturalRatio(imgRef.current) : null
    if (ratio) setMeasured({ src, ratio })
  }, [src, stretch])

  const style = {
    left: x,
    top: y,
    opacity: hidden ? 0 : 1,
    transform: `translate(-50%, -50%) scale(${hidden ? INGREDIENT_ZOOM_SCALE : 1})`,
    transitionDuration: `${transitionMs}ms`,
    height,
    width: 'auto',
    maxWidth: 'none',
    maxHeight: 'none',
  }
  if (stretch) {
    const { scaleX = 1, scaleY = 1 } = stretch
    style.height = height * scaleY
    if (measured?.src === src) style.width = height * measured.ratio * scaleX
  }

  return (
    <img
      ref={imgRef}
      className="fs-item fs-image"
      src={src}
      alt=""
      style={style}
      onLoad={stretch ? measure : undefined}
    />
  )
}
