// Único objeto con URLs de assets del sandbox y los tests (en Shopify las URLs las arma la sección
// Liquid). Se arma a partir de los archivos de assets/ del tema (hermana de frontend/), por nombre:
//   <fragancia>_botella.png, <fragancia>_ingredientes<n>.webp y bg<n>_background.<ext>,
// con <fragancia> en camelCase (wonderOfTheWorld). Las claves de `bottles` e `ingredients` son el
// slug de la fragancia (wonder_of_the_world).
const FILES = import.meta.glob('../../../../assets/*.{png,jpg,webp}', { eager: true, import: 'default' })

const BOTTLE_RE = /^(\w+)_botella\.\w+$/
const INGREDIENT_RE = /^(\w+)_ingredientes(\d+)\.\w+$/
const BACKGROUND_RE = /^bg(\d+)_background\.\w+$/

// wonderOfTheWorld -> wonder_of_the_world
function slugFromCamel(name) {
  return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function buildAssets(files) {
  const bottles = {}
  const ingredients = {}
  const backgrounds = []

  // Ordenados por nombre, así las variantes y los fondos quedan en orden numérico (1 a 9).
  for (const path of Object.keys(files).sort()) {
    const name = path.split('/').pop()
    const url = files[path]
    let match
    if ((match = name.match(BOTTLE_RE))) {
      bottles[slugFromCamel(match[1])] = url
    } else if ((match = name.match(INGREDIENT_RE))) {
      const slug = slugFromCamel(match[1])
      ;(ingredients[slug] ??= []).push(url)
    } else if (BACKGROUND_RE.test(name)) {
      backgrounds.push(url)
    }
  }

  return { bottles, ingredients, backgrounds }
}

export const DEFAULT_ASSETS = buildAssets(FILES)
