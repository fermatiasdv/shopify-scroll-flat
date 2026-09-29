import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GESTURE_GAP_MS,
  NEXT_KEYS,
  PREV_KEYS,
  SWIPE_DIRECTION_RATIO,
  SWIPE_MIN_DISTANCE_PX,
} from '../config/input.js'
import { COLLAPSE_TO_CENTER_MS, LOCK_MS } from '../config/timing.js'
import { initialNavigationState, navigationReducer } from '../lib/navigation.js'

// Navegación del modo desplegado: conecta el reducer puro de
// `lib/navigation.js` con los listeners de swipe, rueda y teclado y con los timers de la
// transición. Las reglas son las de `onWheel`/`onKeyDown`/`onTouch*` de L:scroll-motor.js.

// De `isForeignInteraction` de L:scroll-motor.js (sin el `scroll-lock` del tema de Shopify).
const FOREIGN_SELECTOR = 'dialog, input, textarea, select, [contenteditable=""], [contenteditable="true"]'

// ---------------------------------------------------------------------------
// Lógica pura (testeada en tests/unit/useNavigation.test.js)
// ---------------------------------------------------------------------------

/** El evento viene de un campo editable o de un diálogo: no es para este motor. */
export function isForeignTarget(target) {
  return Boolean(target && typeof target.closest === 'function' && target.closest(FOREIGN_SELECTOR))
}

// AJUSTE-01: navegación con rueda, sólo para desarrollo.
/** Dirección de una ruedada: 1 avanza, -1 retrocede (igual que el legacy, `deltaY` 0 cuenta -1). */
export function wheelDirection(deltaY) {
  return deltaY > 0 ? 1 : -1
}

// AJUSTE-01: navegación con teclado, sólo para desarrollo.
/** Dirección de una tecla: 1 avanza, -1 retrocede, 0 si no es de navegación. */
export function keyDirection(key) {
  if (NEXT_KEYS.includes(key)) return 1
  if (PREV_KEYS.includes(key)) return -1
  return 0
}

/**
 * Dirección de un swipe vertical: 1 avanza (dedo hacia arriba), -1 retrocede, 0 si el
 * movimiento todavía no es un swipe (corto, o más horizontal que vertical).
 */
export function swipeDirection(dx, dy) {
  if (Math.abs(dy) < SWIPE_MIN_DISTANCE_PX) return 0
  if (Math.abs(dy) < Math.abs(dx) * SWIPE_DIRECTION_RATIO) return 0
  return dy < 0 ? 1 : -1
}

// AJUSTE-01: agrupación de gestos de rueda y teclado, sólo para desarrollo.
/**
 * `noteInputGesture` del legacy: agrupa en un mismo gesto los eventos separados por menos de
 * GESTURE_GAP_MS, y abre uno nuevo después de cada silencio. Devuelve el gesto actualizado.
 */
export function noteGesture(gesture, now) {
  return { id: now - gesture.at > GESTURE_GAP_MS ? gesture.id + 1 : gesture.id, at: now }
}

/** `atScrollEdge` del legacy: seguir un paso más en `direction` se saldría de la paginación. */
export function isAtEdge(state, direction) {
  return (direction < 0 && state.index === 0) || (direction > 0 && state.index === state.count - 1)
}

/**
 * Qué hacer con un intento de navegar (`kind`: 'wheel', 'key' o 'touch'), en el orden del legacy:
 * el bloqueo se chequea antes que el borde. Devuelve si se hace `preventDefault` y si se despacha
 * `NAVIGATE` (el reducer decide si navega, encola la salida, cierra o lo ignora).
 */
export function inputDecision(kind, state, direction, gestureId) {
  // Bloqueado por una transición: el reducer encola la salida si va hacia un borde.
  if (state.phase !== 'idle') return { prevent: true, send: true }
  // En el borde: sale (o ignora el mismo gesto). El swipe no lleva preventDefault en el borde.
  if (isAtEdge(state, direction)) return { prevent: kind !== 'touch', send: true }
  // Ronda 12 del legacy: los coletazos de la misma ruedada que ya navegó no vuelven a navegar.
  if (kind === 'wheel' && gestureId === state.navGestureId) return { prevent: false, send: false }
  return { prevent: true, send: true }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @param {object} options
 * @param {number} options.initialIndex - Fragancia con la que arranca (o a la que se reinicia).
 * @param {number} options.count - Cantidad de fragancias.
 * @param {() => void} [options.onClose] - Se llama al cerrar (✕ o salida por un borde).
 * @returns {{ index: number, pendingIndex: number | null, phase: string, direction: string | null, close: () => void }}
 */
export function useNavigation({ initialIndex, count, onClose }) {
  const [state, setState] = useState(() => initialNavigationState({ index: initialIndex, count }))
  // Copia síncrona del estado: los listeners nativos tienen que ver el efecto de un evento
  // apenas ocurre, como las variables de módulo del legacy.
  const stateRef = useRef(state)
  const gestureRef = useRef({ id: 0, at: 0 })
  const onCloseRef = useRef(onClose)
  const resetKeyRef = useRef(`${initialIndex}:${count}`)

  const send = useCallback((action) => {
    const next = navigationReducer(stateRef.current, action)
    if (next === stateRef.current) return
    stateRef.current = next
    setState(next)
  }, [])

  const close = useCallback(() => send({ type: 'CLOSE' }), [send])

  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Si cambia la fragancia inicial (o la cantidad), se reinicia como una reapertura.
  useEffect(() => {
    const key = `${initialIndex}:${count}`
    if (resetKeyRef.current === key) return
    resetKeyRef.current = key
    send({ type: 'RESET', index: initialIndex, count })
  }, [initialIndex, count, send])

  // Timers de la transición: SWAP a los COLLAPSE_TO_CENTER_MS y UNLOCK LOCK_MS después.
  // El cleanup los cancela al cambiar de fase, al cerrar y al desmontar.
  useEffect(() => {
    let timer = null
    if (state.phase === 'leaving') {
      timer = setTimeout(() => send({ type: 'SWAP' }), COLLAPSE_TO_CENTER_MS)
    } else if (state.phase === 'entering') {
      timer = setTimeout(() => send({ type: 'UNLOCK' }), LOCK_MS)
    }
    return () => clearTimeout(timer)
  }, [state.phase, send])

  useEffect(() => {
    if (state.closed) onCloseRef.current?.()
  }, [state.closed])

  // Listeners globales, como el legacy: el contenedor del desplegado tiene `pointer-events: none`.
  useEffect(() => {
    const touch = { startX: 0, startY: null, handled: false, gestureId: 0 }

    const attempt = (kind, direction, gestureId, e) => {
      const decision = inputDecision(kind, stateRef.current, direction, gestureId)
      if (decision.prevent && e.cancelable) e.preventDefault()
      if (decision.send) send({ type: 'NAVIGATE', direction, gestureId })
    }

    // AJUSTE-01: navegación con rueda, sólo para desarrollo.
    const onWheel = (e) => {
      if (isForeignTarget(e.target)) return
      gestureRef.current = noteGesture(gestureRef.current, Date.now())
      attempt('wheel', wheelDirection(e.deltaY), gestureRef.current.id, e)
    }

    // AJUSTE-01: navegación con teclado, sólo para desarrollo.
    const onKeyDown = (e) => {
      const direction = keyDirection(e.key)
      if (!direction || isForeignTarget(e.target)) return
      gestureRef.current = noteGesture(gestureRef.current, Date.now())
      attempt('key', direction, gestureRef.current.id, e)
    }

    // Sólo gestos de un dedo; cada touchstart abre un gesto nuevo.
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) {
        touch.startY = null
        return
      }
      touch.startX = e.touches[0].clientX
      touch.startY = e.touches[0].clientY
      touch.handled = false
      gestureRef.current = { ...gestureRef.current, id: gestureRef.current.id + 1 }
      touch.gestureId = gestureRef.current.id
    }

    // Mientras dura el gesto se bloquea el scroll nativo; un swipe = una sola acción.
    const onTouchMove = (e) => {
      if (isForeignTarget(e.target)) return
      if (touch.startY === null || touch.handled || e.touches.length !== 1) {
        if (e.cancelable) e.preventDefault()
        return
      }
      const direction = swipeDirection(
        e.touches[0].clientX - touch.startX,
        e.touches[0].clientY - touch.startY,
      )
      if (!direction) {
        if (e.cancelable) e.preventDefault()
        return
      }
      touch.handled = true
      attempt('touch', direction, touch.gestureId, e)
    }

    const onTouchEnd = () => {
      touch.startY = null
      touch.handled = false
    }

    // AJUSTE-01: los listeners de wheel y keydown, sólo para desarrollo.
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      // AJUSTE-01: los listeners de wheel y keydown, sólo para desarrollo.
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [send])

  return {
    index: state.index,
    pendingIndex: state.pendingIndex,
    phase: state.phase,
    direction: state.direction,
    close,
  }
}
