import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ShopifyApp from './ShopifyApp.jsx'
import './shopify.css'

// Entrada del bundle del tema (assets/fragrance-scroll.js). La sección
// `sections/fragrance-scroll.liquid` renderiza:
//   <fragrance-scroll data-section-id="…">
//     <script type="application/json" data-fs-config>{ assets, fragrances, showLabel }</script>
//     <div data-fs-mount></div>
//   </fragrance-scroll>
// El custom element monta React al conectarse y lo desmonta al desconectarse, así el Theme Editor
// (que reemplaza el HTML de la sección en cada cambio) lo vuelve a montar solo.
class FragranceScrollElement extends HTMLElement {
  connectedCallback() {
    const configNode = this.querySelector('script[data-fs-config]')
    const mountNode = this.querySelector('[data-fs-mount]')
    if (!configNode || !mountNode || this.root) return

    let config
    try {
      config = JSON.parse(configNode.textContent)
    } catch (error) {
      console.error('[fragrance-scroll] config inválida', error)
      return
    }
    if (!config.fragrances?.length) return

    this.root = createRoot(mountNode)
    this.root.render(
      <StrictMode>
        <ShopifyApp sectionId={this.dataset.sectionId} config={config} />
      </StrictMode>,
    )
  }

  disconnectedCallback() {
    this.root?.unmount()
    this.root = null
  }
}

// El script puede cargarse más de una vez (varias secciones en la misma página).
if (!customElements.get('fragrance-scroll')) {
  customElements.define('fragrance-scroll', FragranceScrollElement)
}
