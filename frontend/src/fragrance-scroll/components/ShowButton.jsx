// Botón "Show fragrances →" del modo colapsado. Estilos de `.fragrances-show-button` del
// legacy (`.fs-show-button`). El texto es configurable; por defecto es `actions.show_fragrances`.
export default function ShowButton({ onClick, label = 'Show fragrances' }) {
  return (
    <button type="button" className="fs-show-button" onClick={onClick}>
      {label}
      <span className="fs-show-arrow" aria-hidden="true">
        &rarr;
      </span>
    </button>
  )
}
