import { useEffect, useSyncExternalStore } from 'react'
import { useViewport } from '../hooks/useViewport.js'
import { layoutFor } from '../lib/layout.js'
import { schedulePreload } from '../lib/preload.js'
import { sceneFor } from '../lib/scene.js'
import { indexFromSlug } from '../lib/slug.js'
import { readLastSlug } from '../lib/storage.js'
import ShowButton from './ShowButton.jsx'

// Modo colapsado, el bloque en la home: una pantalla con el fondo (y su overlay), la botella, el
// título y el botón. No muestra ingrediente ni fila de ingredientes, y todo aparece ya en su estado
// final, sin animaciones (`renderCollapsedEntry` de L:scroll-styles.js). La botella es la misma
// imagen flat, en el mismo lugar y tamaño, que la del desplegado.
//
// La fragancia mostrada es la última vista. Se lee de `storage` sólo en el cliente
// (`useSyncExternalStore`: el servidor y la hidratación usan el snapshot `null`), así el primer render
// coincide con el del servidor y el storage no se toca en el servidor: hasta entonces es la
// primera. Sin viewport (servidor y primer render) sólo se dibuja lo que no depende del layout.
// El storage no avisa de cambios: la última vista se vuelve a leer al montar (y en cada render).
const subscribeNever = () => () => {}

export default function CollapsedView({ assets, fragrances, storage, showLabel, onOpenExpanded }) {
  const viewport = useViewport()
  const lastSlug = useSyncExternalStore(subscribeNever, () => readLastSlug(storage), () => null)
  // Un slug ausente o inválido cae en la primera.
  const index = indexFromSlug(fragrances, lastSlug)

  // Precarga: se dispara una sola vez al montar el colapsado.
  useEffect(() => {
    schedulePreload(assets)
  }, [assets])

  const fragrance = fragrances[index]
  const style = {}
  let items = null
  if (viewport) {
    const layout = layoutFor(viewport.width, viewport.height)
    const scene = sceneFor(index, layout, fragrances)
    style['--fs-page-height'] = `${viewport.height}px`
    style['--fs-title-font-size'] = `${layout.titleFontSizePx}px`

    // Los `fs-item` arrancan en opacidad 0 para las entradas animadas; acá van directo al estado final.
    items = (
      <>
        <div
          className="fs-item"
          style={{
            left: scene.product.x,
            top: scene.product.y,
            width: scene.product.size,
            height: scene.product.size,
            opacity: 1,
          }}
        >
          <img className="fs-bottle-layer" src={assets.bottles[fragrance.slug]} alt="" draggable={false} />
        </div>
        <span
          className="fs-item fs-label fs-label-title"
          style={{ left: scene.title.x, top: scene.title.y, opacity: 1 }}
        >
          {scene.title.text}
        </span>
      </>
    )
  }

  return (
    <section
      className="fs-root"
      style={style}
      onClick={() => onOpenExpanded?.(fragrance.slug)}
    >
      <div
        className="fs-container"
        style={{ backgroundImage: `url("${assets.backgrounds[index % assets.backgrounds.length]}")` }}
      />
      <div className="fs-overlay" aria-hidden="true" />
      <div className="fs-content" aria-hidden="true">
        {items}
      </div>
      <div className="fs-show-overlay">
        <ShowButton label={showLabel} />
      </div>
    </section>
  )
}
