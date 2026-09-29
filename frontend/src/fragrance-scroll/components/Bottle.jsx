import { useCrossfade } from '../hooks/useCrossfade.js'

// AJUSTE-03: link de prueba a Google.
const FRAGRANCE_QUERY_PARAM = 'fragrance'

// AJUSTE-03: link de prueba a Google.
// Destino del link sobre la botella. Es el único lugar donde se resuelve la URL.
function bottleLinkHref(slug) {
  const url = new URL('https://www.google.com/')
  if (slug) url.searchParams.set(FRAGRANCE_QUERY_PARAM, slug)
  return url.toString()
}

// Botella flat del modo desplegado: el link de la botella (`.fs-image-product`), en un cuadro de
// lado `size` centrado en (x, y). Cuando cambia `src` hace un fundido cruzado entre la botella
// saliente y la entrante (--fs-bottle-transition-ms). Al montar aparece ya visible, igual que en
// el colapsado, así abrir el desplegado no se nota en la botella.
//
// `url` (el `url` de la fragancia, ej. la página de producto en Shopify) es el destino del link, en
// la misma pestaña. Sin `url` se usa el link de prueba, en una pestaña nueva.
export default function Bottle({ x, y, size, slug, name, src, url }) {
  const layers = useCrossfade(src)
  const linkProps = url
    ? { href: url }
    : { href: bottleLinkHref(slug), target: '_blank', rel: 'noopener noreferrer' }

  return (
    <a
      className="fs-item fs-image fs-image-product"
      {...linkProps}
      aria-label={name}
      style={{ left: x, top: y, width: size, height: size, opacity: 1 }}
    >
      {layers.map((layer, i) =>
        layer.src ? (
          <img
            key={i}
            className="fs-bottle-layer"
            src={layer.src}
            alt=""
            draggable={false}
            style={{ opacity: layer.active ? 1 : 0 }}
          />
        ) : null,
      )}
    </a>
  )
}
