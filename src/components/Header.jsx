import { useEffect, useRef, useState } from 'react'
import { Code2, Moon, Search, Settings2, Sun, X } from 'lucide-react'
import { useCodeSettings } from '../lib/codeSettings.js'
import { site } from '../lib/content.js'
import { useTheme } from '../lib/theme.js'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

const CODE_THEMES = [
  { value: 'auto', label: 'Как сайт' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
]

export default function Header({ onOpenSearch }) {
  const [theme, toggleTheme] = useTheme()
  const [codeSettings, updateCodeSettings] = useCodeSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)

  useEffect(() => {
    if (!settingsOpen) return undefined
    const onPointerDown = (event) => {
      if (!settingsRef.current?.contains(event.target)) setSettingsOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen])

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
          <div className="settings-anchor" ref={settingsRef}>
            <button
              type="button"
              className="icon-button"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-label="Настройки кода"
              title="Настройки кода"
              aria-expanded={settingsOpen}
            >
              <Settings2 size={16} aria-hidden="true" />
            </button>
            {settingsOpen && (
              <div className="settings-panel" role="dialog" aria-label="Настройки кода">
                <div className="settings-panel-head">
                  <span className="settings-panel-title">
                    <Code2 size={14} aria-hidden="true" />
                    Код в материалах
                  </span>
                  <button
                    type="button"
                    className="icon-button settings-close"
                    onClick={() => setSettingsOpen(false)}
                    aria-label="Закрыть настройки"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
                <label className="settings-toggle">
                  <span className="settings-toggle-text">
                    <span className="settings-label">Подсветка</span>
                    <span className="settings-hint">Ключевые слова, строки, комментарии</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={codeSettings.highlight}
                    onChange={(event) => updateCodeSettings({ highlight: event.target.checked })}
                  />
                  <span className="settings-switch" aria-hidden="true" />
                </label>
                <label className={`settings-toggle${codeSettings.highlight ? '' : ' is-disabled'}`}>
                  <span className="settings-toggle-text">
                    <span className="settings-label">Автоопределение языка</span>
                    <span className="settings-hint">Если язык не указан в markdown</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={codeSettings.autoDetect}
                    disabled={!codeSettings.highlight}
                    onChange={(event) => updateCodeSettings({ autoDetect: event.target.checked })}
                  />
                  <span className="settings-switch" aria-hidden="true" />
                </label>
                <div className={`settings-field${codeSettings.highlight ? '' : ' is-disabled'}`}>
                  <span className="settings-label">Тема кода</span>
                  <div className="settings-segments" role="group" aria-label="Тема подсветки кода">
                    {CODE_THEMES.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`settings-segment${codeSettings.theme === option.value ? ' is-active' : ''}`}
                        onClick={() => updateCodeSettings({ theme: option.value })}
                        disabled={!codeSettings.highlight}
                        aria-pressed={codeSettings.theme === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="settings-foot">Сохраняется в этом браузере.</p>
              </div>
            )}
          </div>
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
