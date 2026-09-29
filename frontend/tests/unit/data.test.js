import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSETS } from '../../src/fragrance-scroll/config/assets.js'
import { FRAGRANCES } from '../../src/fragrance-scroll/data/fragrances.js'
import { slugify } from '../../src/fragrance-scroll/lib/slug.js'

const EXPECTED = [
  ['Rebellious', ['Saffron', 'Bergamot', 'Caramel']],
  ['Forbidden Flower', ['Lychee', 'Bergamot', 'Freesia']],
  ['Wonder of the World', ['Almond', 'Freesia', 'Caramel']],
  ['Painkiller', ['Lilac', 'Bergamot', 'Musk']],
  ['Jagged Edge', ['Bergamot', 'Tonka Bean', 'Rose']],
  ['Crimson Desert', ['Raspberry', 'Mandarin', 'Jasmine']],
  ['Glitterati', ['Jasmine', 'Vanilla', 'Musk']],
  ['Ecstasy', ['Black Currant', 'Ginger', 'Rose']],
  ['Epicurean', ['Jasmine', 'Rose', 'Black Currant']],
  ['London Legend', ['Saffron', 'Bulgarian Rose', 'Vanilla']],
]

describe('FRAGRANCES', () => {
  it('tiene las 10 fragancias, en el orden del legacy y con sus 3 ingredientes', () => {
    expect(FRAGRANCES.map((f) => [f.name, f.ingredients])).toEqual(EXPECTED)
  })

  it('el slug de cada fragancia es el slugify de su nombre, sin repetidos', () => {
    expect(FRAGRANCES.map((f) => f.slug)).toEqual(FRAGRANCES.map((f) => slugify(f.name)))
    expect(new Set(FRAGRANCES.map((f) => f.slug)).size).toBe(10)
  })

  it('sólo Painkiller lleva estiramiento de la imagen de ingrediente', () => {
    for (const fragrance of FRAGRANCES) {
      expect(fragrance.ingredientStretch).toEqual(
        fragrance.slug === 'painkiller' ? { scaleX: 2, scaleY: 1.2 } : null,
      )
    }
  })
})

describe('DEFAULT_ASSETS', () => {
  it('cada slug tiene su botella y 3 variantes de ingrediente distintas, en orden', () => {
    for (const { slug } of FRAGRANCES) {
      expect(DEFAULT_ASSETS.bottles[slug], slug).toMatch(/_botella\.png$/)
      const variants = DEFAULT_ASSETS.ingredients[slug]
      expect(variants, slug).toHaveLength(3)
      variants.forEach((url, i) => expect(url).toMatch(new RegExp(`_ingredientes${i + 1}\\.webp$`)))
    }
  })

  it('no hay botellas ni ingredientes de fragancias que no existen', () => {
    const slugs = FRAGRANCES.map((f) => f.slug).sort()
    expect(Object.keys(DEFAULT_ASSETS.bottles).sort()).toEqual(slugs)
    expect(Object.keys(DEFAULT_ASSETS.ingredients).sort()).toEqual(slugs)
  })

  it('tiene 4 fondos, en el orden bg1..bg4', () => {
    expect(DEFAULT_ASSETS.backgrounds.map((url) => url.split('/').pop())).toEqual([
      'bg1_background.jpg',
      'bg2_background.webp',
      'bg3_background.webp',
      'bg4_background.webp',
    ])
  })

  it('cada archivo referenciado existe en assets/', () => {
    const urls = [
      ...Object.values(DEFAULT_ASSETS.bottles),
      ...DEFAULT_ASSETS.backgrounds,
      ...Object.values(DEFAULT_ASSETS.ingredients).flat(),
    ]
    for (const url of urls) {
      // Las imágenes viven en assets/ del tema, hermana de frontend/.
      const file = fileURLToPath(new URL(`../../../assets/${url.split('/').pop()}`, import.meta.url))
      expect(existsSync(file), `no existe ${url}`).toBe(true)
    }
  })
})
