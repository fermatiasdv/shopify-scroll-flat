// Reducer de navegación del modo desplegado. Puro y sin timers: los timers
// que disparan SWAP (t = COLLAPSE_TO_CENTER_MS) y UNLOCK (t = +LOCK_MS) viven en `useNavigation`.
// Las reglas son las de `onWheel`/`onKeyDown`/`onTouchMove` y `goToIndex` de L:scroll-motor.js.

export function initialNavigationState({ index, count }) {
  return {
    index,
    count,
    pendingIndex: null,
    phase: 'idle',
    direction: null,
    queuedExit: null,
    navGestureId: null,
    closed: false,
  }
}

// `atScrollEdge` del legacy: parado en la fragancia actual, seguir un paso más en `direction`
// (1 avanzar, -1 retroceder) se saldría de la paginación.
function isAtEdge(state, direction) {
  return (direction < 0 && state.index === 0) || (direction > 0 && state.index === state.count - 1)
}

// Condición de `queueExitIfEdgeBound`: la transición en curso va justo hacia el borde de `direction`.
function isHeadingToEdge(state, direction) {
  return (direction < 0 && state.pendingIndex === 0)
    || (direction > 0 && state.pendingIndex === state.count - 1)
}

function navigate(state, { direction, gestureId }) {
  if (state.closed) return state

  // El bloqueo se chequea ANTES que el borde. Sólo se encola una intención de un gesto distinto
  // del que disparó la transición (`queueExitIfEdgeBound`).
  if (state.phase !== 'idle') {
    if (gestureId === state.navGestureId) return state
    if (isHeadingToEdge(state, direction)) return { ...state, queuedExit: direction }
    return state
  }

  // Un mismo gesto no puede navegar y además salir por el borde.
  if (isAtEdge(state, direction)) {
    if (gestureId === state.navGestureId) return state
    return { ...state, closed: true }
  }

  return {
    ...state,
    navGestureId: gestureId,
    pendingIndex: state.index + direction,
    phase: 'leaving',
    direction: direction > 0 ? 'down' : 'up',
  }
}

function swap(state) {
  if (state.closed || state.phase !== 'leaving') return state
  // `pendingIndex` vuelve a null: durante `entering` no se encola una salida (como el legacy).
  return { ...state, index: state.pendingIndex, pendingIndex: null, phase: 'entering' }
}

function unlock(state) {
  if (state.closed || state.phase !== 'entering') return state
  const next = { ...state, phase: 'idle', queuedExit: null }
  if (state.queuedExit !== null && isAtEdge(state, state.queuedExit)) {
    return { ...next, closed: true }
  }
  return next
}

function close(state) {
  return {
    ...state,
    closed: true,
    phase: 'idle',
    pendingIndex: null,
    direction: null,
    queuedExit: null,
    navGestureId: null,
  }
}

export function navigationReducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return navigate(state, action)
    case 'SWAP':
      return swap(state)
    case 'UNLOCK':
      return unlock(state)
    case 'CLOSE':
      return close(state)
    case 'RESET':
      return initialNavigationState({ index: action.index, count: action.count })
    default:
      return state
  }
}
