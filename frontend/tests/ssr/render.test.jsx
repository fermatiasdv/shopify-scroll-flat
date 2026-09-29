import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSETS, FRAGRANCES, FragranceScroll } from '../../src/fragrance-scroll/index.js'

const render = (initialSlug, fragrances = FRAGRANCES) =>
  renderToString(
    <FragranceScroll
      mode="expanded"
      assets={DEFAULT_ASSETS}
      fragrances={fragrances}
      initialSlug={initialSlug}
    />,
  )

const renderCollapsed = (props = {}) =>
  renderToString(
    <FragranceScroll mode="collapsed" assets={DEFAULT_ASSETS} fragrances={FRAGRANCES} {...props} />,
  )

// React escapa las comillas del `url("...")` del estilo inline.
const backgroundOf = (i) =>
  `url(&quot;${DEFAULT_ASSETS.backgrounds[i % DEFAULT_ASSETS.backgrounds.length]}&quot;)`

describe('SSR del modo desplegado', () => {
  it('corre en un entorno de servidor, sin window ni document', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })

  it.each(FRAGRANCES.map((fragrance, i) => [fragrance.slug, i]))(
    '%s: renderiza sin lanzar, con su fondo y el botón de cerrar',
    (slug, i) => {
      const html = render(slug)
      expect(html).toContain('fs-stage')
      expect(html).toContain(backgroundOf(i))
      expect(html).toContain('aria-label="Close"')
    },
  )

  it('el primer render no depende del viewport: no trae ítems posicionados', () => {
    const html = render('painkiller')
    expect(html).not.toContain('fs-item')
    expect(html).not.toContain('fs-label-title')
    expect(html).not.toContain('fs-image-product')
  })

  // Con dos fragancias, el índice 0 y el 1 tienen fondos distintos (bg1 y bg2), así que se
  // distingue caer en la primera de caer en cualquier otra.
  it.each([undefined, '', 'no_existe'])('el slug %j cae en la primera fragancia', (slug) => {
    const html = render(slug, [FRAGRANCES[3], FRAGRANCES[4]])
    expect(html).toContain(backgroundOf(0))
    expect(html).not.toContain(backgroundOf(1))
  })

  it('es determinista: dos renders con las mismas props dan el mismo HTML', () => {
    expect(render('glitterati')).toBe(render('glitterati'))
  })
})

describe('SSR del modo colapsado', () => {
  it('renderiza sin lanzar, con el fondo de la primera fragancia, el overlay y el botón', () => {
    const html = renderCollapsed()
    expect(html).toContain('fs-root')
    expect(html).toContain(backgroundOf(0))
    expect(html).toContain('fs-overlay')
    expect(html).toContain('fs-show-button')
    expect(html).toContain('Show fragrances')
    expect(html).not.toContain('aria-label="Close"')
  })

  it('el texto del botón es configurable', () => {
    expect(renderCollapsed({ showLabel: 'Ver fragancias' })).toContain('Ver fragancias')
  })

  it('el primer render no depende del viewport: sin póster ni título posicionados', () => {
    const html = renderCollapsed()
    expect(html).not.toContain('fs-item')
    expect(html).not.toContain('fs-label-title')
  })

  it('no muestra ingrediente ni fila de ingredientes', () => {
    const html = renderCollapsed()
    expect(html).not.toContain('fs-image')
    expect(html).not.toContain('fs-label-ingredient')
  })

  it('la última vista se lee después de montar: el servidor siempre muestra la primera', () => {
    const storage = { get: () => 'ecstasy', set: () => {} }
    const html = renderCollapsed({ storage })
    expect(html).toContain(backgroundOf(0))
    expect(html).toBe(renderCollapsed())
  })

  it('no toca el storage al renderizar en el servidor', () => {
    const calls = []
    const storage = { get: (...args) => calls.push(args), set: (...args) => calls.push(args) }
    renderCollapsed({ storage })
    expect(calls).toEqual([])
  })
})
