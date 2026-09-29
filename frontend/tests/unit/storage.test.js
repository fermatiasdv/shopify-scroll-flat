import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LAST_SLUG_KEY,
  localStorageStorage,
  readLastSlug,
  writeLastSlug,
} from '../../src/fragrance-scroll/lib/storage.js'

// `localStorage` simulado con un Map.
function fakeLocalStorage() {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('localStorageStorage', () => {
  it('sin localStorage (servidor): get devuelve null y set no lanza', () => {
    expect(typeof localStorage).toBe('undefined')
    expect(localStorageStorage.get('k')).toBeNull()
    expect(() => localStorageStorage.set('k', 'v')).not.toThrow()
  })

  it('guarda y lee un valor', () => {
    vi.stubGlobal('localStorage', fakeLocalStorage())
    localStorageStorage.set('k', 'v')
    expect(localStorageStorage.get('k')).toBe('v')
  })

  it('una clave inexistente da null', () => {
    vi.stubGlobal('localStorage', fakeLocalStorage())
    expect(localStorageStorage.get('nada')).toBeNull()
  })

  it('si el acceso a localStorage lanza (modo privado, datos bloqueados), se ignora', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('cuota')
      },
    })
    expect(localStorageStorage.get('k')).toBeNull()
    expect(() => localStorageStorage.set('k', 'v')).not.toThrow()
  })
})

describe('última fragancia vista', () => {
  it('writeLastSlug guarda el slug bajo la clave de la última vista', () => {
    const storage = { get: vi.fn(), set: vi.fn() }
    writeLastSlug(storage, 'ecstasy')
    expect(storage.set).toHaveBeenCalledWith(LAST_SLUG_KEY, 'ecstasy')
  })

  it('readLastSlug devuelve lo guardado', () => {
    const storage = { get: vi.fn(() => 'glitterati'), set: vi.fn() }
    expect(readLastSlug(storage)).toBe('glitterati')
    expect(storage.get).toHaveBeenCalledWith(LAST_SLUG_KEY)
  })

  it.each([null, undefined, '', 3, {}])('readLastSlug devuelve null con %j', (value) => {
    expect(readLastSlug({ get: () => value, set: () => {} })).toBeNull()
  })

  it('sin storage no lee ni guarda nada, y no lanza', () => {
    expect(readLastSlug(undefined)).toBeNull()
    expect(() => writeLastSlug(undefined, 'ecstasy')).not.toThrow()
  })

  it('si el storage lanza, se ignora', () => {
    const storage = {
      get: () => {
        throw new Error('falla')
      },
      set: () => {
        throw new Error('falla')
      },
    }
    expect(readLastSlug(storage)).toBeNull()
    expect(() => writeLastSlug(storage, 'ecstasy')).not.toThrow()
  })

  it('ida y vuelta con el localStorage simulado', () => {
    vi.stubGlobal('localStorage', fakeLocalStorage())
    writeLastSlug(localStorageStorage, 'london_legend')
    expect(readLastSlug(localStorageStorage)).toBe('london_legend')
  })
})
