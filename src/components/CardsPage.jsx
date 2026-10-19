import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, FlipHorizontal, RotateCcw, Shuffle } from 'lucide-react'
import { materialHref, subjectHref } from '../lib/router.js'
import Markdown from './Markdown.jsx'

function cardsWord(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'карточка'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'карточки'
  return 'карточек'
}

function shuffledOrder(length) {
  const order = Array.from({ length }, (_, index) => index)
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

export default function CardsPage({ material }) {
  const cards = material.cards
  const total = cards.length
  const [order, setOrder] = useState(() => Array.from({ length: total }, (_, index) => index))
  const [position, setPosition] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffled, setShuffled] = useState(false)
  const [motion, setMotion] = useState(null)
  const swipeStart = useRef(null)
  const suppressClick = useRef(false)
  const timersRef = useRef([])

  const card = cards[order[position]] ?? null

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const move = useCallback(
    (delta) => {
      const target = Math.min(Math.max(position + delta, 0), total - 1)
      if (target === position || motion) return
      if (prefersReducedMotion()) {
        setPosition(target)
        setFlipped(false)
        return
      }
      clearTimers()
      const dir = delta > 0 ? 'next' : 'prev'
      setMotion({ dir, phase: 'out' })
      timersRef.current.push(
        window.setTimeout(() => {
          setPosition(target)
          setFlipped(false)
          setMotion({ dir, phase: 'in' })
          timersRef.current.push(window.setTimeout(() => setMotion(null), 240))
        }, 200),
      )
    },
    [position, total, motion, clearTimers],
  )

  const flip = useCallback(() => {
    if (motion) return
    setFlipped((value) => !value)
  }, [motion])

  const shuffle = useCallback(() => {
    clearTimers()
    setMotion(null)
    setOrder(shuffledOrder(total))
    setPosition(0)
    setFlipped(false)
    setShuffled(true)
  }, [total, clearTimers])

  const reset = useCallback(() => {
    clearTimers()
    setMotion(null)
    setOrder(Array.from({ length: total }, (_, index) => index))
    setPosition(0)
    setFlipped(false)
    setShuffled(false)
  }, [total, clearTimers])

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target
      const tag = target instanceof HTMLElement ? target.tagName : ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      if (event.key === ' ' || event.key === 'Enter') {
        if (tag === 'BUTTON' || tag === 'A') return
        event.preventDefault()
        flip()
      } else if (event.key === 'ArrowLeft') {
        move(-1)
      } else if (event.key === 'ArrowRight') {
        move(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flip, move])

  const onTouchStart = (event) => {
    const touch = event.touches[0]
    swipeStart.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (event) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      suppressClick.current = true
      window.setTimeout(() => {
        suppressClick.current = false
      }, 350)
      move(dx < 0 ? 1 : -1)
    }
  }

  const onCardClick = () => {
    if (suppressClick.current) return
    flip()
  }

  return (
    <div className="cards-page">
      <nav className="breadcrumbs" aria-label="Навигация">
        <a href="#/">Главная</a>
        <span className="breadcrumbs-sep">/</span>
        <a href={subjectHref(material.subjectId)}>{material.subjectName}</a>
        <span className="breadcrumbs-sep">/</span>
        <a href={materialHref(material.id)}>{material.title}</a>
        <span className="breadcrumbs-sep">/</span>
        <span className="breadcrumbs-current">Проверка знаний</span>
      </nav>

      <header className="cards-head">
        <h1>Проверка знаний</h1>
        <p className="cards-sub">
          {material.title} · {total} {cardsWord(total)}
        </p>
      </header>

      {card ? (
        <section className="cards-deck" aria-label="Карточки для повторения">
          <div className="cards-progress">
            <span style={{ width: `${((position + 1) / total) * 100}%` }} />
          </div>

          <div
            className={`flashcard-stage${motion ? ` is-moving motion-${motion.phase} dir-${motion.dir}` : ''}`}
          >
            <div
              className={`flashcard${flipped ? ' is-flipped' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={flipped}
              aria-label={flipped ? 'Показать вопрос' : 'Показать ответ'}
              onClick={onCardClick}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className="flashcard-inner">
                <div className="flashcard-face flashcard-front" aria-hidden={flipped}>
                  <span className="flashcard-label">Вопрос</span>
                  <div className="flashcard-content md">
                    <Markdown source={card.question} />
                  </div>
                </div>
                <div className="flashcard-face flashcard-back" aria-hidden={!flipped}>
                  <span className="flashcard-label">Ответ</span>
                  <div className="flashcard-content md">
                    <Markdown source={card.answer} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="cards-controls">
            <button
              type="button"
              className="icon-button"
              onClick={() => move(-1)}
              disabled={position === 0}
              aria-label="Предыдущая карточка"
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <button type="button" className="cards-flip-button" onClick={flip}>
              <FlipHorizontal size={16} aria-hidden="true" />
              Перевернуть
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => move(1)}
              disabled={position === total - 1}
              aria-label="Следующая карточка"
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>

          <div className="cards-meta">
            <span className="cards-counter">
              {position + 1} / {total}
            </span>
            <div className="cards-meta-actions">
              <button type="button" className="cards-ghost-button" onClick={shuffle}>
                <Shuffle size={14} aria-hidden="true" />
                Перемешать
              </button>
              {shuffled && (
                <button type="button" className="cards-ghost-button" onClick={reset}>
                  <RotateCcw size={14} aria-hidden="true" />
                  Сброс
                </button>
              )}
            </div>
          </div>

          <p className="cards-hint">
            Отвечайте вслух, затем переворачивайте. <kbd>Пробел</kbd> — переворот, <kbd>←</kbd>
            <kbd>→</kbd> — навигация, на телефоне — свайп.
          </p>
        </section>
      ) : (
        <p className="empty">Для этого материала пока нет карточек.</p>
      )}

      <a className="back-link" href={materialHref(material.id)}>
        <ChevronLeft size={14} aria-hidden="true" />
        Вернуться к материалу
      </a>
    </div>
  )
}
