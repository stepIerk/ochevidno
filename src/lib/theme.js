import { useCallback, useEffect, useState } from 'react'

function currentTheme() {
  const attr = document.documentElement.dataset.theme
  if (attr === 'dark' || attr === 'light') return attr
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function persist(theme) {
  try {
    localStorage.setItem('theme', theme)
  } catch (error) {
    console.warn('Не удалось сохранить тему', error)
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(currentTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    persist(theme)
  }, [theme])
  const toggleTheme = useCallback(() => {
    setTheme((value) => (value === 'dark' ? 'light' : 'dark'))
  }, [])
  return [theme, toggleTheme]
}
