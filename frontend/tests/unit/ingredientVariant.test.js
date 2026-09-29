import { describe, expect, it } from 'vitest'
import { pickIngredientVariant } from '../../src/fragrance-scroll/lib/ingredientVariant.js'

describe('pickIngredientVariant', () => {
  it('devuelve el elemento correspondiente al valor de `random`', () => {
    const variants = ['a', 'b', 'c']
    expect(pickIngredientVariant(variants, () => 0)).toBe('a')
    expect(pickIngredientVariant(variants, () => 0.34)).toBe('b')
    expect(pickIngredientVariant(variants, () => 0.99)).toBe('c')
  })

  it('con Math.random real, siempre devuelve una de las variantes', () => {
    const variants = ['x', 'y', 'z']
    for (let i = 0; i < 50; i++) {
      expect(variants).toContain(pickIngredientVariant(variants))
    }
  })
})
