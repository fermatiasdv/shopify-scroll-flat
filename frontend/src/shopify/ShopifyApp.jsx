import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import FragranceScroll from '../fragrance-scroll/FragranceScroll.jsx'
import { localStorageStorage, readLastSlug } from '../fragrance-scroll/lib/storage.js'

// Adaptador de Shopify: el equivalente de `SandboxApp` (y de lo que en Tapcart harán `screen/open`
// y `go/back`). El colapsado queda montado en la sección y el desplegado se abre como overlay en
// un portal sobre `body`.
//  - Abrir agrega una entrada al historial, así el "atrás" del navegador lo cierra. Cerrar con ✕,
//    Escape o saliendo por un borde vuelve esa entrada.
//  - Si la entrada actual ya es la del desplegado (recarga, o volver desde la página de producto),
//    arranca desplegado en la última vista.
//  - En el Theme Editor no se toca el historial: seleccionar un bloque abre su fragancia.

const HISTORY_KEY = 'fragranceScroll'
const SCROLL_LOCK_CLASS = 'fs-scroll-locked'
const COLLAPSED = { mode: 'collapsed', slug: undefined }

const isDesignMode = () => Boolean(window.Shopify?.designMode)
const ownsHistoryEntry = (sectionId) => window.history.state?.[HISTORY_KEY] === sectionId

function viewFromHistory(sectionId) {
  if (isDesignMode() || !ownsHistoryEntry(sectionId)) return COLLAPSED
  return { mode: 'expanded', slug: readLastSlug(localStorageStorage) ?? undefined }
}

export default function ShopifyApp({ sectionId, config }) {
  const { assets, fragrances, showLabel } = config
  const [view, setView] = useState(() => viewFromHistory(sectionId))
  const expanded = view.mode === 'expanded'

  const openExpanded = useCallback(
    (slug) => {
      if (!isDesignMode() && !ownsHistoryEntry(sectionId)) {
        window.history.pushState({ ...window.history.state, [HISTORY_KEY]: sectionId }, '')
      }
      setView({ mode: 'expanded', slug })
    },
    [sectionId],
  )

  // Con entrada propia en el historial se vuelve atrás y el `popstate` colapsa.
  const closeExpanded = useCallback(() => {
    if (!isDesignMode() && ownsHistoryEntry(sectionId)) window.history.back()
    else setView(COLLAPSED)
  }, [sectionId])

  // Atrás y adelante del navegador.
  useEffect(() => {
    const onPopState = () => setView(viewFromHistory(sectionId))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [sectionId])

  // Con el desplegado abierto la página de atrás no scrollea y Escape lo cierra.
  useEffect(() => {
    if (!expanded) return undefined
    const root = document.documentElement
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeExpanded()
    }
    root.classList.add(SCROLL_LOCK_CLASS)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      root.classList.remove(SCROLL_LOCK_CLASS)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded, closeExpanded])

  // Theme Editor: seleccionar el bloque de una fragancia la muestra desplegada.
  useEffect(() => {
    if (!isDesignMode()) return undefined
    const onSelect = (e) => {
      if (e.detail?.sectionId !== sectionId) return
      const fragrance = fragrances.find((f) => f.blockId === e.detail.blockId)
      if (fragrance) setView({ mode: 'expanded', slug: fragrance.slug })
    }
    const onDeselect = (e) => {
      if (e.detail?.sectionId === sectionId) setView(COLLAPSED)
    }
    document.addEventListener('shopify:block:select', onSelect)
    document.addEventListener('shopify:block:deselect', onDeselect)
    return () => {
      document.removeEventListener('shopify:block:select', onSelect)
      document.removeEventListener('shopify:block:deselect', onDeselect)
    }
  }, [sectionId, fragrances])

  return (
    <>
      <FragranceScroll
        mode="collapsed"
        assets={assets}
        fragrances={fragrances}
        storage={localStorageStorage}
        showLabel={showLabel}
        onOpenExpanded={openExpanded}
      />
      {expanded &&
        createPortal(
          <div className="fs-portal">
            <FragranceScroll
              mode="expanded"
              assets={assets}
              fragrances={fragrances}
              initialSlug={view.slug}
              storage={localStorageStorage}
              onCloseExpanded={closeExpanded}
            />
          </div>,
          document.body,
        )}
    </>
  )
}
