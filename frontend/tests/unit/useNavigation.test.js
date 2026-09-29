import { describe, expect, it } from 'vitest'
import {
  GESTURE_GAP_MS,
  NEXT_KEYS,
  PREV_KEYS,
  SWIPE_DIRECTION_RATIO,
  SWIPE_MIN_DISTANCE_PX,
} from '../../src/fragrance-scroll/config/input.js'
import {
  inputDecision,
  isAtEdge,
  isForeignTarget,
  keyDirection,
  noteGesture,
  swipeDirection,
  wheelDirection,
} from '../../src/fragrance-scroll/hooks/useNavigation.js'
import { initialNavigationState, navigationReducer } from '../../src/fragrance-scroll/lib/navigation.js'

const COUNT = 10
const at = (index) => initialNavigationState({ index, count: COUNT })
const navigate = (direction, gestureId) => ({ type: 'NAVIGATE', direction, gestureId })

describe('keyDirection (AJUSTE-01)', () => {
  it.each(NEXT_KEYS)('%j avanza', (key) => expect(keyDirection(key)).toBe(1))
  it.each(PREV_KEYS)('%j retrocede', (key) => expect(keyDirection(key)).toBe(-1))
  it.each(['Enter', 'a', 'ArrowLeft', 'ArrowRight', 'Escape'])('%j no navega', (key) => {
    expect(keyDirection(key)).toBe(0)
  })
})

describe('wheelDirection (AJUSTE-01)', () => {
  it('hacia abajo avanza y hacia arriba retrocede', () => {
    expect(wheelDirection(100)).toBe(1)
    expect(wheelDirection(-100)).toBe(-1)
  })

  it('deltaY 0 cuenta como retroceso, igual que el legacy', () => {
    expect(wheelDirection(0)).toBe(-1)
  })
})

describe('swipeDirection', () => {
  it('con el dedo hacia arriba avanza y hacia abajo retrocede', () => {
    expect(swipeDirection(0, -SWIPE_MIN_DISTANCE_PX)).toBe(1)
    expect(swipeDirection(0, SWIPE_MIN_DISTANCE_PX)).toBe(-1)
  })

  it('no cuenta si recorre menos de SWIPE_MIN_DISTANCE_PX', () => {
    expect(swipeDirection(0, -(SWIPE_MIN_DISTANCE_PX - 1))).toBe(0)
    expect(swipeDirection(0, SWIPE_MIN_DISTANCE_PX - 1)).toBe(0)
  })

  it('exige |dy| >= |dx| * SWIPE_DIRECTION_RATIO', () => {
    const dx = SWIPE_MIN_DISTANCE_PX / SWIPE_DIRECTION_RATIO
    expect(swipeDirection(dx, -SWIPE_MIN_DISTANCE_PX)).toBe(1) // justo en el límite
    expect(swipeDirection(dx + 1, -SWIPE_MIN_DISTANCE_PX)).toBe(0)
    expect(swipeDirection(100, -100)).toBe(0) // más horizontal que vertical
    expect(swipeDirection(-100, 100)).toBe(0)
  })

  it('un gesto casi horizontal no cuenta aunque sea largo', () => {
    expect(swipeDirection(300, -70)).toBe(0)
  })
})

describe('isForeignTarget', () => {
  // Simula un elemento cuyo `closest` encuentra un ancestro que matchee alguno de los selectores.
  const inside = (...matches) => ({
    closest: (selector) => (matches.some((m) => selector.split(',').map((s) => s.trim()).includes(m)) ? {} : null),
  })

  it.each(['dialog', 'input', 'textarea', 'select', '[contenteditable=""]', '[contenteditable="true"]'])(
    'ignora los eventos que vienen de %s',
    (selector) => expect(isForeignTarget(inside(selector))).toBe(true),
  )

  it('no ignora el resto de los elementos', () => {
    expect(isForeignTarget(inside())).toBe(false)
  })

  it('no rompe con un target que no es un elemento', () => {
    expect(isForeignTarget(null)).toBe(false)
    expect(isForeignTarget(undefined)).toBe(false)
    expect(isForeignTarget({})).toBe(false)
  })
})

describe('noteGesture (AJUSTE-01)', () => {
  it('el primer evento abre el gesto 1', () => {
    expect(noteGesture({ id: 0, at: 0 }, 5000)).toEqual({ id: 1, at: 5000 })
  })

  it('los eventos separados por GESTURE_GAP_MS o menos son un mismo gesto', () => {
    let gesture = noteGesture({ id: 0, at: 0 }, 5000)
    gesture = noteGesture(gesture, 5010)
    gesture = noteGesture(gesture, 5010 + GESTURE_GAP_MS)
    expect(gesture.id).toBe(1)
  })

  it('después de un silencio de más de GESTURE_GAP_MS abre un gesto nuevo', () => {
    const first = noteGesture({ id: 0, at: 0 }, 5000)
    expect(noteGesture(first, 5000 + GESTURE_GAP_MS + 1).id).toBe(2)
  })

  it('una ráfaga continua no abre gestos nuevos aunque dure mucho', () => {
    let gesture = { id: 0, at: 0 }
    for (let t = 1000; t <= 3000; t += 100) gesture = noteGesture(gesture, t)
    expect(gesture.id).toBe(1)
  })
})

describe('isAtEdge', () => {
  it('en la primera fragancia sólo retroceder es un borde', () => {
    expect(isAtEdge(at(0), -1)).toBe(true)
    expect(isAtEdge(at(0), 1)).toBe(false)
  })

  it('en la última sólo avanzar es un borde', () => {
    expect(isAtEdge(at(COUNT - 1), 1)).toBe(true)
    expect(isAtEdge(at(COUNT - 1), -1)).toBe(false)
  })

  it('en el medio no hay borde', () => {
    expect(isAtEdge(at(5), 1)).toBe(false)
    expect(isAtEdge(at(5), -1)).toBe(false)
  })
})

describe('inputDecision (orden de L:scroll-motor.js: bloqueo, borde, gesto)', () => {
  const leaving = navigationReducer(at(5), navigate(1, 1))

  describe('bloqueado por una transición', () => {
    it.each(['wheel', 'key', 'touch'])('%s: evita el scroll nativo y despacha (el reducer encola)', (kind) => {
      expect(inputDecision(kind, leaving, 1, 2)).toEqual({ prevent: true, send: true })
    })

    it('se chequea antes que el borde', () => {
      const towardsEdge = navigationReducer(at(COUNT - 2), navigate(1, 1))
      expect(towardsEdge.pendingIndex).toBe(COUNT - 1)
      expect(inputDecision('wheel', towardsEdge, 1, 2)).toEqual({ prevent: true, send: true })
    })
  })

  describe('en un borde, sin transición', () => {
    it.each(['wheel', 'key'])('%s: evita el scroll nativo y despacha', (kind) => {
      expect(inputDecision(kind, at(0), -1, 1)).toEqual({ prevent: true, send: true })
      expect(inputDecision(kind, at(COUNT - 1), 1, 1)).toEqual({ prevent: true, send: true })
    })

    it('touch: despacha sin evitar el scroll nativo', () => {
      expect(inputDecision('touch', at(0), -1, 1)).toEqual({ prevent: false, send: true })
      expect(inputDecision('touch', at(COUNT - 1), 1, 1)).toEqual({ prevent: false, send: true })
    })
  })

  describe('fuera de los bordes, sin transición', () => {
    it.each(['wheel', 'key', 'touch'])('%s de un gesto nuevo navega y evita el scroll nativo', (kind) => {
      expect(inputDecision(kind, at(5), 1, 1)).toEqual({ prevent: true, send: true })
      expect(inputDecision(kind, at(5), -1, 1)).toEqual({ prevent: true, send: true })
    })

    it('rueda: los coletazos del gesto que ya navegó no vuelven a navegar ni evitan el scroll', () => {
      const settled = navigationReducer(
        navigationReducer(navigationReducer(at(5), navigate(1, 7)), { type: 'SWAP' }),
        { type: 'UNLOCK' },
      )
      expect(settled.phase).toBe('idle')
      expect(settled.navGestureId).toBe(7)
      expect(inputDecision('wheel', settled, 1, 7)).toEqual({ prevent: false, send: false })
      expect(inputDecision('wheel', settled, 1, 8)).toEqual({ prevent: true, send: true })
    })

    it('teclado: una tecla mantenida (mismo gesto) sí vuelve a navegar, como el legacy', () => {
      const settled = navigationReducer(
        navigationReducer(navigationReducer(at(5), navigate(1, 7)), { type: 'SWAP' }),
        { type: 'UNLOCK' },
      )
      expect(inputDecision('key', settled, 1, 7)).toEqual({ prevent: true, send: true })
    })
  })

  describe('cerrado', () => {
    it('sigue devolviendo la decisión y el reducer ignora la acción', () => {
      const closed = navigationReducer(at(5), { type: 'CLOSE' })
      expect(navigationReducer(closed, navigate(1, 1))).toBe(closed)
    })
  })
})
