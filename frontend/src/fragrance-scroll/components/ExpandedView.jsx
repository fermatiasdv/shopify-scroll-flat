import { useEffect, useState } from 'react'
import {
  BACKGROUND_TRANSITION_MS,
  BOTTLE_CROSSFADE_MS,
  INGREDIENT_INTRO_DELAY_MS,
  INGREDIENT_INTRO_MS,
  INGREDIENT_TRANSITION_MS,
  LABEL_TRANSITION_MS,
  WORD_FADE_MS,
} from '../config/timing.js'
import { useNavigation } from '../hooks/useNavigation.js'
import { useViewport } from '../hooks/useViewport.js'
import { pickIngredientVariant } from '../lib/ingredientVariant.js'
import { layoutFor } from '../lib/layout.js'
import { sceneFor } from '../lib/scene.js'
import { indexFromSlug } from '../lib/slug.js'
import { writeLastSlug } from '../lib/storage.js'
import Background from './Background.jsx'
import Bottle from './Bottle.jsx'
import CloseButton from './CloseButton.jsx'
import IngredientImage from './IngredientImage.jsx'
import Panel from './Panel.jsx'

// Pantalla del modo desplegado. La coreografía de la transición se deriva de `navigation.phase`,
// con COLLAPSE_TO_CENTER_MS como constante principal:
//  - t = 0 (`leaving`): la botella hace el fundido cruzado hacia la de la fragancia destino, el
//    ingrediente sale (fade y zoom) y el fondo hace el crossfade. El panel no se mueve todavía.
//  - t = COLLAPSE_TO_CENTER_MS (`entering`, el índice ya cambió): entran el ingrediente y el panel nuevos (el panel
//    viejo se desmonta).
// Al abrir, la botella ya está en su lugar (es la misma imagen que la del colapsado) y el ingrediente
// entra INGREDIENT_INTRO_DELAY_MS después. El panel ya está en su lugar.

export default function ExpandedView({ assets, fragrances, initialSlug, storage, onCloseExpanded }) {
  const viewport = useViewport()
  const navigation = useNavigation({
    initialIndex: indexFromSlug(fragrances, initialSlug),
    count: fragrances.length,
    onClose: onCloseExpanded,
  })
  const index = navigation.index
  const fragrance = fragrances[index]
  const { phase } = navigation
  // El fondo y la botella cruzan hacia el destino desde t = 0, antes de que cambie el índice.
  const targetIndex = navigation.pendingIndex ?? index
  const targetSlug = fragrances[targetIndex].slug

  // Entrada del ingrediente al abrir: oculto hasta que pasa INGREDIENT_INTRO_DELAY_MS.
  const [introDone, setIntroDone] = useState(false)
  // Variante de ingrediente elegida al azar entre las 3 de la fragancia actual. Se sortea de nuevo
  // cada vez que el ingrediente pasa a visible: al terminar la entrada y al entrar en una transición.
  const [ingredientSrc, setIngredientSrc] = useState(() => pickIngredientVariant(assets.ingredients[fragrance.slug]))
  const [enteredIndex, setEnteredIndex] = useState(index)

  // Una transición pisa la entrada: el ingrediente entra por la coreografía.
  if (phase !== 'idle' && !introDone) setIntroDone(true)
  if (phase === 'entering' && enteredIndex !== index) {
    setEnteredIndex(index)
    setIngredientSrc(pickIngredientVariant(assets.ingredients[fragrance.slug]))
  }

  useEffect(() => {
    if (introDone) return undefined
    const timer = setTimeout(() => {
      setIntroDone(true)
      setIngredientSrc(pickIngredientVariant(assets.ingredients[fragrance.slug]))
    }, INGREDIENT_INTRO_DELAY_MS)
    return () => clearTimeout(timer)
  }, [introDone, assets, fragrance.slug])

  // Última vista: se guarda al abrir y cada vez que cambia la fragancia actual.
  const currentSlug = fragrance.slug
  useEffect(() => {
    writeLastSlug(storage, currentSlug)
  }, [storage, currentSlug])

  const style = {
    '--fs-label-transition-ms': `${LABEL_TRANSITION_MS}ms`,
    '--fs-background-transition-ms': `${BACKGROUND_TRANSITION_MS}ms`,
    '--fs-bottle-transition-ms': `${BOTTLE_CROSSFADE_MS}ms`,
    '--fs-word-fade-ms': `${WORD_FADE_MS}ms`,
  }

  // Hasta tener el viewport (servidor y primer render) sólo se muestra lo que no depende del layout.
  let items = null
  if (viewport) {
    const layout = layoutFor(viewport.width, viewport.height)
    const scene = sceneFor(index, layout, fragrances)
    style['--fs-title-font-size'] = `${layout.titleFontSizePx}px`
    style['--fs-ingredient-font-size'] = `${layout.ingredientFontSizePx}px`

    // La botella va última en el DOM, así queda al frente de la imagen de ingrediente.
    items = (
      <>
        <IngredientImage
          src={ingredientSrc}
          x={scene.ingredient.x}
          y={scene.ingredient.y}
          height={scene.ingredient.height}
          stretch={scene.ingredient.stretch}
          hidden={phase === 'leaving' || !introDone}
          transitionMs={phase === 'idle' ? INGREDIENT_INTRO_MS : INGREDIENT_TRANSITION_MS}
        />
        <Panel
          key={index}
          title={scene.title}
          ingredientsLine={scene.ingredientsLine}
          enterDirection={phase === 'entering' ? navigation.direction : null}
        />
        <Bottle
          x={scene.product.x}
          y={scene.product.y}
          size={scene.product.size}
          slug={fragrance.slug}
          name={fragrance.name}
          url={fragrance.url}
          src={assets.bottles[targetSlug]}
        />
      </>
    )
  }

  return (
    <div className="fs-stage" style={style}>
      <Background src={assets.backgrounds[targetIndex % assets.backgrounds.length]} />
      <div className="fs-overlay" aria-hidden="true" />
      <div className="fs-content" aria-hidden="true">
        {items}
      </div>
      <CloseButton onClick={navigation.close} />
    </div>
  )
}
