import { lazy, Suspense, useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Home from './components/Home.jsx'
import SearchPalette from './components/SearchPalette.jsx'
import SubjectPage from './components/SubjectPage.jsx'
import { getMaterial, getSubject, site } from './lib/content.js'
import { useRoute } from './lib/router.js'

const MaterialView = lazy(() => import('./components/MaterialView.jsx'))
const CardsPage = lazy(() => import('./components/CardsPage.jsx'))

function NotFound({ message }) {
  return (
    <div className="notfound">
      <h1>{message}</h1>
      <p>
        <a className="link" href="#/">
          Вернуться на главную
        </a>
      </p>
    </div>
  )
}

export default function App() {
  const route = useRoute()
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route.name, route.id])

  useEffect(() => {
    if (route.name === 'material') {
      const material = getMaterial(route.id)
      document.title = material ? `${material.title} — ${site.title}` : site.title
    } else if (route.name === 'cards') {
      const material = getMaterial(route.id)
      document.title = material ? `Проверка знаний — ${material.title} — ${site.title}` : site.title
    } else if (route.name === 'subject') {
      const subject = getSubject(route.id)
      document.title = subject ? `${subject.name} — ${site.title}` : site.title
    } else {
      document.title = site.title
    }
  }, [route])

  let page
  if (route.name === 'home') {
    page = <Home />
  } else if (route.name === 'material') {
    const material = getMaterial(route.id)
    const initialQuery = route.query.get('q') ?? ''
    page = material ? (
      <Suspense fallback={<p className="empty">Загрузка материала…</p>}>
        <MaterialView
          key={`${material.id}?${initialQuery}`}
          material={material}
          initialQuery={initialQuery}
        />
      </Suspense>
    ) : (
      <NotFound message="Материал не найден" />
    )
  } else if (route.name === 'subject') {
    const subject = getSubject(route.id)
    page = subject ? <SubjectPage subject={subject} /> : <NotFound message="Предмет не найден" />
  } else if (route.name === 'cards') {
    const material = getMaterial(route.id)
    page = material ? (
      <Suspense fallback={<p className="empty">Загрузка карточек…</p>}>
        <CardsPage material={material} />
      </Suspense>
    ) : (
      <NotFound message="Материал не найден" />
    )
  } else {
    page = <NotFound message="Страница не найдена" />
  }

  return (
    <>
      <Header onOpenSearch={() => setPaletteOpen(true)} />
      <main className="page">{page}</main>
      <footer className="footer">
        <div className="page footer-inner">
          <span>{site.title}</span>
          <span>made by 118</span>
          <span className="footer-muted">{new Date().getFullYear()}</span>
        </div>
      </footer>
      {paletteOpen && <SearchPalette onClose={() => setPaletteOpen(false)} />}
    </>
  )
}
