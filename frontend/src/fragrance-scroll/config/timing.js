// Constantes de tiempo y easings, con los valores del legacy.

// L:scroll-styles.js
// 500 en el legacy (medio giro de la botella); sin giro, el cambio se adelanta a 300.
export const COLLAPSE_TO_CENTER_MS = 300
export const WORD_FADE_STAGGER_MS = 60
export const DIRECTIONAL_ENTER_OFFSET_PX = 48
export const INGREDIENT_ZOOM_SCALE = 0.5 // TEST_ITEM_ZOOM_SCALE del legacy

// L:scroll-config.js
export const LOCK_MS = 50
export const BACKGROUND_TRANSITION_MS = 500
export const LABEL_TRANSITION_MS = 350
export const WORD_FADE_MS = 300

// Botella flat (reemplazan a los giros de L:scroll-bottle.js)
/** Fundido cruzado entre la botella saliente y la entrante, desde t = 0 de la transición. */
export const BOTTLE_CROSSFADE_MS = 500
/** Entrada y salida del ingrediente en una transición (40% más rápida que los 500 ms del legacy). */
export const INGREDIENT_TRANSITION_MS = COLLAPSE_TO_CENTER_MS
/** Entrada del ingrediente al abrir el desplegado: 40% más rápida que LABEL_TRANSITION_MS. */
export const INGREDIENT_INTRO_MS = LABEL_TRANSITION_MS * 0.6
/** Demora desde que se abre el desplegado hasta que entra la imagen de ingrediente. */
export const INGREDIENT_INTRO_DELAY_MS = 300
