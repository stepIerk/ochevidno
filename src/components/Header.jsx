import { Moon, Search, Sun } from 'lucide-react'
import { site } from '../lib/content.js'
import { useTheme } from '../lib/theme.js'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

export default function Header({ onOpenSearch }) {
  const [theme, toggleTheme] = useTheme()
  return (
    <header className="header">
      <div className="page header-inner">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden="true">Θ</span>
          {site.title}
        </a>
        <div className="header-actions">
          <button
            type="button"
            className="search-trigger"
            onClick={onOpenSearch}
            aria-label="Открыть поиск по материалам"
          >
            <Search size={15} aria-hidden="true" />
            <span className="search-trigger-label">Поиск по материалам</span>
            <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            aria-label="Переключить тему"
            title="Переключить тему"
          >
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  )
}
