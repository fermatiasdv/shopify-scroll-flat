import { describe, expect, it } from 'vitest'
import { initialNavigationState, navigationReducer } from '../../src/fragrance-scroll/lib/navigation.js'

const COUNT = 10

const start = (index) => initialNavigationState({ index, count: COUNT })
const navigate = (direction, gestureId) => ({ type: 'NAVIGATE', direction, gestureId })
const run = (state, ...actions) => actions.reduce(navigationReducer, state)

// Una transición completa: NAVIGATE, SWAP (t = 500) y UNLOCK (t = 550).
const settle = (state, direction, gestureId) =>
  run(state, navigate(direction, gestureId), { type: 'SWAP' }, { type: 'UNLOCK' })

describe('navigationReducer', () => {
  describe('1. navegar hacia adelante y hacia atrás desde el medio', () => {
    it('hacia adelante: leaving, SWAP a entering y UNLOCK a idle', () => {
      const leaving = run(start(5), navigate(1, 1))
      expect(leaving).toMatchObject({
        index: 5,
        pendingIndex: 6,
        phase: 'leaving',
        direction: 'down',
        navGestureId: 1,
        closed: false,
      })

      const entering = run(leaving, { type: 'SWAP' })
      expect(entering).toMatchObject({ index: 6, pendingIndex: null, phase: 'entering', direction: 'down' })

      const idle = run(entering, { type: 'UNLOCK' })
      expect(idle).toMatchObject({ index: 6, pendingIndex: null, phase: 'idle', closed: false })
    })

    it('hacia atrás: dirección "up" y el índice baja de a uno', () => {
      const leaving = run(start(5), navigate(-1, 1))
      expect(leaving).toMatchObject({ index: 5, pendingIndex: 4, phase: 'leaving', direction: 'up' })
      expect(settle(start(5), -1, 1)).toMatchObject({ index: 4, phase: 'idle', closed: false })
    })

    it('se puede ir y volver con gestos distintos', () => {
      const back = settle(settle(start(5), 1, 1), -1, 2)
      expect(back).toMatchObject({ index: 5, phase: 'idle', closed: false })
    })
  })

  describe('2. navegación ignorada mientras está bloqueado', () => {
    it('durante leaving, un gesto distinto hacia un destino que no es borde no cambia nada', () => {
      const leaving = run(start(5), navigate(1, 1))
      expect(navigationReducer(leaving, navigate(1, 2))).toEqual(leaving)
      expect(navigationReducer(leaving, navigate(-1, 2))).toEqual(leaving)
    })

    it('durante entering tampoco navega', () => {
      const entering = run(start(5), navigate(1, 1), { type: 'SWAP' })
      expect(navigationReducer(entering, navigate(1, 2))).toEqual(entering)
      expect(navigationReducer(entering, navigate(-1, 2))).toEqual(entering)
    })
  })

  describe('3. salida por el borde inicial y por el final', () => {
    it('retroceder desde la primera fragancia cierra', () => {
      const state = navigationReducer(start(0), navigate(-1, 1))
      expect(state).toMatchObject({ index: 0, closed: true })
    })

    it('avanzar desde la última fragancia cierra', () => {
      const state = navigationReducer(start(COUNT - 1), navigate(1, 1))
      expect(state).toMatchObject({ index: COUNT - 1, closed: true })
    })
  })

  describe('4. el mismo gesto que llegó al borde no sale', () => {
    it('inicial', () => {
      const atEdge = settle(start(1), -1, 7)
      expect(atEdge.index).toBe(0)
      expect(navigationReducer(atEdge, navigate(-1, 7))).toEqual(atEdge)
      expect(navigationReducer(atEdge, navigate(-1, 7)).closed).toBe(false)
    })

    it('final', () => {
      const atEdge = settle(start(COUNT - 2), 1, 7)
      expect(atEdge.index).toBe(COUNT - 1)
      expect(navigationReducer(atEdge, navigate(1, 7)).closed).toBe(false)
    })
  })

  describe('5. un gesto distinto sí sale', () => {
    it('inicial', () => {
      const atEdge = settle(start(1), -1, 7)
      expect(navigationReducer(atEdge, navigate(-1, 8))).toMatchObject({ index: 0, closed: true })
    })

    it('final', () => {
      const atEdge = settle(start(COUNT - 2), 1, 7)
      expect(navigationReducer(atEdge, navigate(1, 8))).toMatchObject({ index: COUNT - 1, closed: true })
    })
  })

  describe('6. salida encolada durante una transición hacia un borde', () => {
    it('inicial: se encola, sobrevive al SWAP y se ejecuta en UNLOCK', () => {
      const leaving = run(start(1), navigate(-1, 1))
      const queued = navigationReducer(leaving, navigate(-1, 2))
      expect(queued).toMatchObject({ queuedExit: -1, closed: false, phase: 'leaving', pendingIndex: 0 })

      const entering = navigationReducer(queued, { type: 'SWAP' })
      expect(entering).toMatchObject({ index: 0, queuedExit: -1, closed: false })

      expect(navigationReducer(entering, { type: 'UNLOCK' })).toMatchObject({
        index: 0,
        phase: 'idle',
        queuedExit: null,
        closed: true,
      })
    })

    it('final: igual hacia adelante', () => {
      const queued = run(start(COUNT - 2), navigate(1, 1), navigate(1, 2))
      expect(queued.queuedExit).toBe(1)
      expect(run(queued, { type: 'SWAP' }, { type: 'UNLOCK' })).toMatchObject({
        index: COUNT - 1,
        closed: true,
      })
    })

    it('el mismo gesto que navegó no encola su propia salida', () => {
      const state = run(start(1), navigate(-1, 1), navigate(-1, 1))
      expect(state.queuedExit).toBeNull()
      expect(run(state, { type: 'SWAP' }, { type: 'UNLOCK' }).closed).toBe(false)
    })
  })

  describe('7. salida encolada que no se ejecuta si el destino no es un borde', () => {
    it('no se encola si la transición en curso no va hacia ese borde', () => {
      const leaving = run(start(5), navigate(1, 1))
      expect(navigationReducer(leaving, navigate(1, 2)).queuedExit).toBeNull()
      expect(navigationReducer(leaving, navigate(-1, 2)).queuedExit).toBeNull()

      const settled = run(navigationReducer(leaving, navigate(1, 2)), { type: 'SWAP' }, { type: 'UNLOCK' })
      expect(settled).toMatchObject({ index: 6, phase: 'idle', closed: false })
    })

    it('si llega a UNLOCK con una salida encolada pero el índice no está en ese borde, la descarta', () => {
      const entering = { ...start(4), phase: 'entering', queuedExit: 1 }
      expect(navigationReducer(entering, { type: 'UNLOCK' })).toMatchObject({
        index: 4,
        phase: 'idle',
        queuedExit: null,
        closed: false,
      })
    })
  })

  describe('8. CLOSE limpia todo lo pendiente', () => {
    it('cierra y deja el estado sin nada pendiente, conservando el índice', () => {
      const busy = run(start(1), navigate(-1, 1), navigate(-1, 2))
      expect(busy).toMatchObject({ phase: 'leaving', pendingIndex: 0, queuedExit: -1, navGestureId: 1 })

      expect(navigationReducer(busy, { type: 'CLOSE' })).toEqual({
        index: 1,
        count: COUNT,
        pendingIndex: null,
        phase: 'idle',
        direction: null,
        queuedExit: null,
        navGestureId: null,
        closed: true,
      })
    })

    it('después de cerrar, SWAP y UNLOCK atrasados no reviven nada', () => {
      const closed = run(start(1), navigate(-1, 1), { type: 'CLOSE' })
      expect(run(closed, { type: 'SWAP' }, { type: 'UNLOCK' })).toEqual(closed)
    })
  })

  describe('9. RESET pone el índice', () => {
    it('vuelve a un estado inicial en el índice y la cantidad pedidos', () => {
      const closed = run(start(3), navigate(1, 1), { type: 'CLOSE' })
      const reset = navigationReducer(closed, { type: 'RESET', index: 7, count: COUNT })
      expect(reset).toEqual(initialNavigationState({ index: 7, count: COUNT }))
      expect(reset).toMatchObject({ index: 7, closed: false, phase: 'idle', navGestureId: null })
    })

    it('acepta otra cantidad de fragancias', () => {
      const reset = navigationReducer(start(0), { type: 'RESET', index: 2, count: 3 })
      expect(reset).toMatchObject({ index: 2, count: 3 })
      expect(navigationReducer(reset, navigate(1, 1)).closed).toBe(true)
    })
  })

  describe('casos derivados del legacy y del diseño', () => {
    it('una vez cerrado, NAVIGATE se ignora', () => {
      const closed = navigationReducer(start(0), navigate(-1, 1))
      expect(navigationReducer(closed, navigate(1, 2))).toEqual(closed)
    })

    it('SWAP y UNLOCK fuera de fase no tienen efecto', () => {
      const idle = start(5)
      expect(navigationReducer(idle, { type: 'SWAP' })).toEqual(idle)
      expect(navigationReducer(idle, { type: 'UNLOCK' })).toEqual(idle)

      const leaving = run(start(5), navigate(1, 1))
      expect(navigationReducer(leaving, { type: 'UNLOCK' })).toEqual(leaving)

      const entering = run(leaving, { type: 'SWAP' })
      expect(navigationReducer(entering, { type: 'SWAP' })).toEqual(entering)
    })

    it('durante entering no se encola una salida (pendingIndex ya es null)', () => {
      const entering = run(start(1), navigate(-1, 1), { type: 'SWAP' })
      expect(entering).toMatchObject({ index: 0, pendingIndex: null, phase: 'entering' })

      const attempt = navigationReducer(entering, navigate(-1, 2))
      expect(attempt.queuedExit).toBeNull()
      expect(navigationReducer(attempt, { type: 'UNLOCK' }).closed).toBe(false)
    })

    it('UNLOCK no cambia direction', () => {
      const entering = run(start(5), navigate(-1, 1), { type: 'SWAP' })
      expect(entering.direction).toBe('up')
      expect(navigationReducer(entering, { type: 'UNLOCK' }).direction).toBe('up')
    })

    it('con una sola fragancia, cualquier dirección cierra', () => {
      const single = initialNavigationState({ index: 0, count: 1 })
      expect(navigationReducer(single, navigate(1, 1)).closed).toBe(true)
      expect(navigationReducer(single, navigate(-1, 1)).closed).toBe(true)
    })

    it('una acción desconocida devuelve el mismo estado', () => {
      const state = start(5)
      expect(navigationReducer(state, { type: 'NOPE' })).toBe(state)
    })

    it('es puro: no muta el estado recibido', () => {
      const frozen = Object.freeze(start(5))
      const leaving = navigationReducer(frozen, navigate(1, 1))
      expect(frozen).toEqual(start(5))
      expect(leaving).not.toBe(frozen)
    })
  })
})
