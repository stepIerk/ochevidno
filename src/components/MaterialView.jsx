import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Mark from 'mark.js'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Hash, ListTree, TextSearch, X } from 'lucide-react'
import { getSiblings, materialStats } from '../lib/content.js'
import { extractToc } from '../lib/markdown.js'
import { escapeRegExp } from '../lib/search.js'
import { materialHref, subjectHref } from '../lib/router.js'
import Markdown from './Markdown.jsx'
import Toc from './Toc.jsx'
import TypeBadge from './TypeBadge.jsx'

const HIGHLIGHT_CLASS = 'md-hit'
const HIGHLIGHT_ACTIVE = 'md-hit-active'

export default function MaterialView({ material, initialQuery }) {
  const toc = useMemo(() => extractToc(material.raw, 4), [material])
  const stats = useMemo(() => materialStats(material), [material])
  const siblings = useMemo(() => getSiblings(material), [material])
  const articleRef = useRef(null)
  const inputRef = useRef(null)
  const [activeHeading, setActiveHeading] = useState('')
  const [query, setQuery] = useState(initialQuery ?? '')
  const [matchCount, setMatchCount] = useState(0)
  const [activeMatch, setActiveMatch] = useState(0)
  const [tocOpen, setTocOpen] = useState(false)

  const resolveHeadingNode = useCallback((item) => {
    const direct = document.getElementById(item.id)
    if (direct) return direct
    const root = articleRef.current
    if (!root) return null
    const probe = item.text.slice(0, 48)
    return (
      Array.from(root.querySelectorAll('h1, h2, h3, h4')).find((heading) => {
        const text = heading.textContent.replace(/\s+/g, ' ').trim()
        return text === item.text || text.startsWith(probe)
      }) ?? null
    )
  }, [])

  useEffect(() => {
    if (!toc.length) return undefined
    const resolved = toc
      .map((item) => {
        const node = resolveHeadingNode(item)
        return node ? { id: item.id, node } : null
      })
      .filter(Boolean)
    if (!resolved.length) return undefined
    let raf = 0
    const update = () => {
      let current = resolved[0].id
      for (const item of resolved) {
        if (item.node.getBoundingClientRect().top <= 110) current = item.id
      }
      setActiveHeading(current)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [toc, resolveHeadingNode])

  useEffect(() => {
    if (!tocOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setTocOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [tocOpen])

  const focusMatch = useCallback((index, smooth = true) => {
    const root = articleRef.current
    if (!root) return
    const hits = root.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`)
    if (!hits.length) return
    const target = ((index % hits.length) + hits.length) % hits.length
    hits.forEach((element) => element.classList.remove(HIGHLIGHT_ACTIVE))
    const element = hits[target]
    element.classList.add(HIGHLIGHT_ACTIVE)
    element.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
    setActiveMatch(target + 1)
  }, [])

  useEffect(() => {
    const root = articleRef.current
    if (!root) return undefined
    const marker = new Mark(root)
    const term = query.trim()
    marker.unmark({
      className: HIGHLIGHT_CLASS,
      done: () => {
        if (!term) {
          setMatchCount(0)
          setActiveMatch(0)
          return
        }
        let count = 0
        marker.markRegExp(new RegExp(escapeRegExp(term), 'giu'), {
          className: HIGHLIGHT_CLASS,
          exclude: ['.katex', 'script', 'style'],
          each: () => {
            count += 1
          },
          done: () => {
            setMatchCount(count)
            if (count > 0) requestAnimationFrame(() => focusMatch(0, false))
          },
        })
      },
    })
    return () => marker.unmark({ className: HIGHLIGHT_CLASS })
  }, [query, material.id, focusMatch])

  const step = useCallback(
    (delta) => {
      const root = articleRef.current
      if (!root) return
      const hits = root.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`)
      if (!hits.length) return
      const current = activeMatch > 0 ? activeMatch - 1 : 0
      focusMatch(current + delta, true)
    },
    [activeMatch, focusMatch],
  )

  const navigateToHeading = useCallback(
    (item) => {
      const target = resolveHeadingNode(item)
      if (!target) return
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [resolveHeadingNode],
  )

  const hasQuery = query.trim() !== ''

  return (
    <div className="material">
      <nav className="breadcrumbs" aria-label="Навигация">
        <a href="#/">Главная</a>
        <span className="breadcrumbs-sep">/</span>
        <a href={subjectHref(material.subjectId)}>{material.subjectName}</a>
        <span className="breadcrumbs-sep">/</span>
        <span className="breadcrumbs-current">{material.title}</span>
      </nav>

      <header className="material-head">
        <h1>{material.title}</h1>
        <div className="material-meta">
          <TypeBadge type={material.type} />
          <span className="material-meta-item">
            <Hash size={13} aria-hidden="true" />
            {toc.length} разделов
          </span>
          <span className="material-meta-item">
            <Clock size={13} aria-hidden="true" />
            {stats.minutes} мин чтения
          </span>
        </div>
      </header>

      <div className="material-toolbar">
        <button
          type="button"
          className="toc-toggle"
          onClick={() => setTocOpen(true)}
          aria-expanded={tocOpen}
          aria-label="Открыть содержание"
        >
          <ListTree size={15} aria-hidden="true" />
          Содержание
        </button>
        <div className="find">
          <TextSearch size={15} className="find-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                step(event.shiftKey ? -1 : 1)
              }
              if (event.key === 'Escape') setQuery('')
            }}
            placeholder="Поиск в тексте…"
            aria-label="Поиск в тексте материала"
          />
          {query !== '' && (
            <button
              type="button"
              className="find-clear"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Очистить поиск"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="find-status" aria-live="polite">
          {hasQuery && (matchCount > 0 ? `${activeMatch || 1} / ${matchCount}` : 'не найдено')}
        </div>
        <div className="find-nav">
          <button
            type="button"
            className="icon-button"
            onClick={() => step(-1)}
            disabled={matchCount === 0}
            aria-label="Предыдущее совпадение"
          >
            <ChevronUp size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => step(1)}
            disabled={matchCount === 0}
            aria-label="Следующее совпадение"
          >
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {tocOpen && (
        <div
          className="toc-sheet-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTocOpen(false)
          }}
        >
          <div className="toc-sheet" role="dialog" aria-modal="true" aria-label="Содержание">
            <div className="toc-sheet-head">
              <span>Содержание</span>
              <button
                type="button"
                className="icon-button"
                onClick={() => setTocOpen(false)}
                aria-label="Закрыть содержание"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
            <Toc
              items={toc}
              activeId={activeHeading}
              onNavigate={(item) => {
                navigateToHeading(item)
                setTocOpen(false)
              }}
            />
          </div>
        </div>
      )}

      <div className="material-body">
        <article className="md" ref={articleRef}>
          <Markdown source={material.raw} />
        </article>
        <aside className="toc-desktop">
          <p className="toc-title">Содержание</p>
          <Toc items={toc} activeId={activeHeading} onNavigate={navigateToHeading} />
        </aside>
      </div>

      <nav className="pager" aria-label="Соседние материалы">
        {siblings.prev ? (
          <a className="pager-link pager-prev" href={materialHref(siblings.prev.id)}>
            <span className="pager-hint">
              <ChevronLeft size={13} aria-hidden="true" />
              Предыдущий
            </span>
            <span className="pager-title">{siblings.prev.title}</span>
          </a>
        ) : (
          <span />
        )}
        {siblings.next ? (
          <a className="pager-link pager-next" href={materialHref(siblings.next.id)}>
            <span className="pager-hint">
              Следующий
              <ChevronRight size={13} aria-hidden="true" />
            </span>
            <span className="pager-title">{siblings.next.title}</span>
          </a>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
