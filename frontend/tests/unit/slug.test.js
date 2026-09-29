import { describe, expect, it } from 'vitest'
import { FRAGRANCES } from '../../src/fragrance-scroll/data/fragrances.js'
import { indexFromSlug, slugify } from '../../src/fragrance-scroll/lib/slug.js'

const EXPECTED_SLUGS = [
  ['Rebellious', 'rebellious'],
  ['Forbidden Flower', 'forbidden_flower'],
  ['Wonder of the World', 'wonder_of_the_world'],
  ['Painkiller', 'painkiller'],
  ['Jagged Edge', 'jagged_edge'],
  ['Crimson Desert', 'crimson_desert'],
  ['Glitterati', 'glitterati'],
  ['Ecstasy', 'ecstasy'],
  ['Epicurean', 'epicurean'],
  ['London Legend', 'london_legend'],
]

describe('slugify', () => {
  it.each(EXPECTED_SLUGS)('"%s" da "%s"', (name, slug) => {
    expect(slugify(name)).toBe(slug)
  })

  it('recorta los bordes y junta espacios y guiones seguidos en un solo "_"', () => {
    expect(slugify('  Foo - Bar--Baz  ')).toBe('foo_bar_baz')
  })

  it('coincide con el slug de cada fragancia de FRAGRANCES', () => {
    expect(FRAGRANCES.map((f) => slugify(f.name))).toEqual(FRAGRANCES.map((f) => f.slug))
    expect(FRAGRANCES.map((f) => f.slug)).toEqual(EXPECTED_SLUGS.map(([, slug]) => slug))
  })
})

describe('indexFromSlug', () => {
  it.each(EXPECTED_SLUGS.map(([, slug], i) => [slug, i]))('"%s" da el índice %i', (slug, index) => {
    expect(indexFromSlug(FRAGRANCES, slug)).toBe(index)
  })

  it.each([
    ['inexistente', 'nope'],
    ['vacío', ''],
    ['undefined', undefined],
    ['null', null],
    ['número', 3],
    ['distinto en mayúsculas', 'ECSTASY'],
  ])('un slug inválido (%s) da 0', (_label, slug) => {
    expect(indexFromSlug(FRAGRANCES, slug)).toBe(0)
  })
})
