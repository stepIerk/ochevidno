import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'ochevidno:code-settings'
const THEMES = ['auto', 'light', 'dark']

export const defaultCodeSettings = {
  highlight: true,
  autoDetect: true,
  theme: 'auto',
}

let listeners = new Set()
let cached = null

function normalize(value) {
  const source = value && typeof value === 'object' ? value : {}
  return {
    highlight: source.highlight !== false,
    autoDetect: source.autoDetect !== false,
    theme: THEMES.includes(source.theme) ? source.theme : 'auto',
  }
}

function read() {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cached = normalize(raw ? JSON.parse(raw) : null)
  } catch {
    cached = normalize(null)
  }
  return cached
}

function persist(next) {
  cached = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* localStorage may be unavailable */
  }
  listeners.forEach((listener) => listener(next))
}

export function useCodeSettings() {
  const [settings, setSettings] = useState(read)

  useEffect(() => {
    listeners.add(setSettings)
    return () => listeners.delete(setSettings)
  }, [])

  const update = useCallback((patch) => {
    persist(normalize({ ...read(), ...patch }))
  }, [])

  return [settings, update]
}
