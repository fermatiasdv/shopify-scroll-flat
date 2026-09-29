import { useState } from 'react'
import { DEFAULT_ASSETS, FRAGRANCES, FragranceScroll, localStorageStorage } from '../fragrance-scroll/index.js'

// Selector de desarrollo: `?i=0..9` arranca directo en el desplegado con esa fragancia. Un valor
// inválido o ausente arranca en el colapsado.
function initialViewFromUrl() {
  const i = new URLSearchParams(window.location.search).get('i')
  const slug = i === null || i.trim() === '' ? undefined : FRAGRANCES[Number(i)]?.slug
  return slug ? { mode: 'expanded', slug } : { mode: 'collapsed', slug: undefined }
}

export default function SandboxApp() {
  // AJUSTE-04: simulación de abrir y volver de la pantalla desplegada.
  const [view, setView] = useState(initialViewFromUrl)

  // AJUSTE-04: en Tapcart será `screen/open`.
  const openExpanded = (slug) => setView({ mode: 'expanded', slug })
  // AJUSTE-04: en Tapcart será `go/back`.
  const closeExpanded = () => setView({ mode: 'collapsed', slug: undefined })

  return (
    <FragranceScroll
      mode={view.mode}
      assets={DEFAULT_ASSETS}
      fragrances={FRAGRANCES}
      initialSlug={view.slug}
      // AJUSTE-11: la última vista se guarda en localStorage.
      storage={localStorageStorage}
      onOpenExpanded={openExpanded}
      onCloseExpanded={closeExpanded}
    />
  )
}
