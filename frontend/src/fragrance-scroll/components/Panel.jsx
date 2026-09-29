import { Fragment, useEffect, useRef, useState } from 'react'
import { DIRECTIONAL_ENTER_OFFSET_PX, WORD_FADE_STAGGER_MS } from '../config/timing.js'

// Una línea de texto, partida en palabras como `createLabelElement` de L:scroll-styles.js.
// Con `offsetPx` (todavía sin `shown`) arranca desplazada y con las palabras en opacidad 0: al pasar
// a `shown` viaja a su lugar (--fs-label-transition-ms) mientras las palabras entran escalonadas.
function PanelLine({ line, variant, offsetPx, shown, lineRef }) {
  const words = line.text.split(' ')
  const style = { left: line.x, top: line.y, opacity: 1 }
  if (!shown) style.transform = `translate(-50%, -50%) translate(0px, ${offsetPx}px)`
  return (
    <span ref={lineRef} className={`fs-item fs-label fs-label-${variant}`} style={style}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span
            className="fs-label-word"
            style={{ transitionDelay: `${i * WORD_FADE_STAGGER_MS}ms`, opacity: shown ? 1 : 0 }}
          >
            {word}
          </span>
        </Fragment>
      ))}
    </span>
  )
}

// Título arriba y fila de ingredientes abajo. Recibe los objetos de `sceneFor`.
//
// `enterDirection` ('down' o 'up') sólo importa al montarse: si el panel se monta por una transición
// entra animado, desde arriba con 'down' y desde abajo con 'up', DIRECTIONAL_ENTER_OFFSET_PX
// como `finalOffset` del legacy. Con `null` (montaje inicial o reinicio) aparece ya en su lugar.
export default function Panel({ title, ingredientsLine, enterDirection = null }) {
  const [offsetPx] = useState(() => {
    if (enterDirection === null) return 0
    return enterDirection === 'up' ? DIRECTIONAL_ENTER_OFFSET_PX : -DIRECTIONAL_ENTER_OFFSET_PX
  })
  const [shown, setShown] = useState(enterDirection === null)
  const titleRef = useRef(null)

  useEffect(() => {
    if (shown) return undefined
    // Leer el layout obliga al navegador a calcular el estilo de partida (desplazado y con las
    // palabras en 0) antes de pasar al final, así la transición arranca desde ahí: el equivalente al
    // `flushPendingStyles` del legacy. Va en un frame para que ese estilo ya esté aplicado.
    const frame = requestAnimationFrame(() => {
      titleRef.current.getBoundingClientRect()
      setShown(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [shown])

  return (
    <>
      <PanelLine line={title} variant="title" offsetPx={offsetPx} shown={shown} lineRef={titleRef} />
      <PanelLine line={ingredientsLine} variant="ingredient" offsetPx={offsetPx} shown={shown} />
    </>
  )
}
