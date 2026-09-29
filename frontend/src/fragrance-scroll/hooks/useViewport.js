import { useEffect, useLayoutEffect, useState } from 'react'

// Tamaño del viewport. Devuelve `null` en el servidor y en el primer render del cliente,
// así el HTML hidrata igual; después devuelve `{ width, height }`. Ante un `resize` se
// actualiza a lo sumo una vez por frame, como `onResize` de L:scroll-motor.js.
//
// En el cliente la primera medición va en un layout effect: el render con `null` no llega a
// pintarse, así al montar no hay un cuadro sin botella ni título. En el servidor se usa
// `useEffect`, que no corre y no genera el aviso de `useLayoutEffect` en SSR.
export function useViewport() {
  const [viewport, setViewport] = useState(null)
  const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

  useClientLayoutEffect(() => {
    let frame = null

    // Como `viewportSize` de L:scroll-viewport.js: el ancho descuenta la barra de scroll.
    const measure = () => {
      const width = document.documentElement.clientWidth
      const height = window.innerHeight
      // Mismo objeto si no cambió nada, para no re-renderizar.
      setViewport((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }))
    }

    const onResize = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        measure()
      })
    }

    measure()
    window.addEventListener('resize', onResize)
    // Una barra de scroll que aparece o desaparece cambia `clientWidth` sin disparar `resize`: se
    // observa el elemento raíz para volver a medir (por ejemplo, al pasar del colapsado al desplegado).
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize)
    observer?.observe(document.documentElement)
    return () => {
      window.removeEventListener('resize', onResize)
      observer?.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  return viewport
}
