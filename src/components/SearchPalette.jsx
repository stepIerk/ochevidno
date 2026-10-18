import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, Search } from 'lucide-react'
import { searchMaterials } from '../lib/search.js'
import { navigate } from '../lib/router.js'
import { typeIcons } from '../lib/icons.js'
import { typeLabel } from '../lib/content.js'

function renderParts(parts) {
  return parts.map((part, index) => (part.hit ? <mark key={index}>{part.text}</mark> : part.text))
}

export default function SearchPalette({ onClose }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const results = useMemo(() => (query.trim() ? searchMaterials(query) : []), [query])

  useEffect(() => {
    inputRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const openResult = useCallback(
    (material) => {
      onClose()
      navigate(`/m/${material.id}?q=${encodeURIComponent(query.trim())}`)
    },
    [onClose, query],
  )

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (!results.length) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((value) => (value + 1) % results.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((value) => (value - 1 + results.length) % results.length)
      } else if (event.key === 'Enter' && results[active]) {
        event.preventDefault()
        openResult(results[active].entry.material)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results, active, openResult, onClose])

  return (
    <div
      className="palette-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Поиск по материалам"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="palette">
        <div className="palette-input-row">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            className="palette-input"
            type="text"
            spellCheck={false}
            autoComplete="off"
            placeholder="Название, тема, предмет или текст материала…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            aria-label="Поисковый запрос"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-results">
          {!query.trim() && (
            <div className="palette-hint">
              <p>Поиск идёт по названиям, заголовкам, тексту и формулам всех материалов.</p>
              <p className="palette-hint-muted">
                Попробуйте: «коллоквиум», «предел», «собственные значения» или название предмета.
              </p>
            </div>
          )}
          {query.trim() !== '' && results.length === 0 && (
            <div className="palette-empty">Ничего не найдено по запросу «{query.trim()}»</div>
          )}
          {results.map((result, index) => {
            const material = result.entry.material
            const Icon = typeIcons[material.type] ?? typeIcons.other
            return (
              <button
                key={material.id}
                type="button"
                className={`palette-result${index === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => openResult(material)}
              >
                <span className="palette-result-icon">
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className="palette-result-body">
                  <span className="palette-result-title">{renderParts(result.titleParts)}</span>
                  <span className="palette-result-meta">
                    {material.subjectName} · {typeLabel(material.type)}
                  </span>
                  {result.snippet && (
                    <span className="palette-result-snippet">{renderParts(result.snippet)}</span>
                  )}
                </span>
                {index === active && (
                  <CornerDownLeft size={14} className="palette-result-enter" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
