export default function Toc({ items, activeId, onNavigate }) {
  if (!items.length) return null
  return (
    <nav className="toc-nav" aria-label="Содержание">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`toc-item toc-depth-${Math.min(item.depth, 4)}${item.id === activeId ? ' is-active' : ''}`}
          onClick={() => onNavigate(item)}
        >
          {item.text}
        </button>
      ))}
    </nav>
  )
}
