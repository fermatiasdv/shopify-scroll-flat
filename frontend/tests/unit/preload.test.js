import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_ASSETS } from '../../src/fragrance-scroll/config/assets.js'
import { schedulePreload } from '../../src/fragrance-scroll/lib/preload.js'

// `document`/`window`/`navigator`/`Image` no existen en el entorno `node` de Vitest: se simulan los
// mínimos que usa `preload.js`.
function fakeWindow() {
  const listeners = new Map()
  return {
    addEventListener: (type, cb) => listeners.set(type, cb),
    fireLoad: () => listeners.get('load')?.(),
  }
}

function stubEnvironment({ readyState = 'complete', navigator = {} } = {}) {
  const created = []
  class FakeImage {
    set src(url) {
      created.push({ url, fetchPriority: this.fetchPriority, decoding: this.decoding })
    }
  }
  const win = fakeWindow()
  vi.stubGlobal('document', { readyState })
  vi.stubGlobal('window', win)
  vi.stubGlobal('navigator', navigator)
  vi.stubGlobal('Image', FakeImage)
  return { created, win }
}

// Deja correr el callback encolado (setTimeout(cb, 0) o `requestIdleCallback`).
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const bottleUrls = Object.values(DEFAULT_ASSETS.bottles)
const lowUrls = [...DEFAULT_ASSETS.backgrounds, ...Object.values(DEFAULT_ASSETS.ingredients).flat()]

afterEach(() => vi.unstubAllGlobals())

describe('schedulePreload', () => {
  it('con saveData activado no precarga nada', async () => {
    const { created } = stubEnvironment({ navigator: { connection: { saveData: true } } })
    schedulePreload(DEFAULT_ASSETS)
    await flush()
    expect(created).toHaveLength(0)
  })

  it('precarga las botellas primero y el resto en prioridad baja', async () => {
    const { created } = stubEnvironment()
    schedulePreload(DEFAULT_ASSETS)
    await flush()

    expect(created).toHaveLength(bottleUrls.length + lowUrls.length)
    expect(created.slice(0, bottleUrls.length).map((c) => c.url)).toEqual(bottleUrls)
    created.slice(0, bottleUrls.length).forEach((c) => expect(c.fetchPriority).toBe('auto'))
    lowUrls.forEach((url) => {
      const entry = created.find((c) => c.url === url)
      expect(entry, url).toBeTruthy()
      expect(entry.fetchPriority).toBe('low')
    })
  })

  it('si la página todavía no cargó, espera al evento load antes de precargar', async () => {
    const { created, win } = stubEnvironment({ readyState: 'loading' })
    schedulePreload(DEFAULT_ASSETS)
    await flush()
    expect(created).toHaveLength(0)

    win.fireLoad()
    await flush()
    expect(created.length).toBeGreaterThan(0)
  })

  it('sin requestIdleCallback, usa setTimeout como fallback', async () => {
    const { created } = stubEnvironment()
    vi.stubGlobal('requestIdleCallback', undefined)
    schedulePreload(DEFAULT_ASSETS)
    await flush()
    expect(created.length).toBeGreaterThan(0)
  })
})
