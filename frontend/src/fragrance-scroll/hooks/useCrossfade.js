import { useState } from 'react'

// Dos capas que se turnan los roles de entrante y saliente, como `transitionBackground` de
// L:scroll-styles.js. Cuando cambia `src`, la capa inactiva (que ya está en opacidad 0) toma el src
// nuevo y pasa a ser la activa. Devuelve las dos capas con su src y si está activa; quien lo usa
// anima sólo `opacity`. En el montaje la capa activa ya arranca visible, sin fundido.
export function useCrossfade(src) {
  const [state, setState] = useState({ srcs: [src, null], active: 0 })

  let current = state
  if (src !== state.srcs[state.active]) {
    const next = 1 - state.active
    const srcs = [...state.srcs]
    srcs[next] = src
    current = { srcs, active: next }
    setState(current)
  }

  return current.srcs.map((source, i) => ({ src: source, active: i === current.active }))
}
