// Botón ✕ arriba a la derecha. El texto por defecto es `actions.close` del legacy.
export default function CloseButton({ onClick, label = 'Close' }) {
  return (
    <button type="button" className="fs-close-button" aria-label={label} onClick={onClick}>
      <span aria-hidden="true">&#10005;</span>
    </button>
  )
}
