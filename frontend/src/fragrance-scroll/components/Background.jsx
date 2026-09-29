import { useCrossfade } from '../hooks/useCrossfade.js'

// Capa de fondo: fundido cruzado entre dos nodos (ver useCrossfade). Se anima sólo `opacity`, nunca
// `transform`. La duración sale de --fs-background-transition-ms (ver .fs-bg).
export default function Background({ src }) {
  const layers = useCrossfade(src)

  return (
    <div className="fs-bg-layer" aria-hidden="true">
      {layers.map((layer, i) => (
        <div
          key={i}
          className="fs-bg"
          style={{
            backgroundImage: layer.src ? `url("${layer.src}")` : undefined,
            opacity: layer.active ? 1 : 0,
          }}
        />
      ))}
    </div>
  )
}
