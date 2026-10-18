import { useEffect, useState } from 'react'

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '')
  const [path, queryPart] = raw.split('?')
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
  const query = new URLSearchParams(queryPart ?? '')
  if (!segments.length) return { name: 'home', id: null, query }
  if (segments[0] === 'm' && segments[1]) return { name: 'material', id: segments[1], query }
  if (segments[0] === 's' && segments[1]) return { name: 'subject', id: segments[1], query }
  return { name: 'notfound', id: null, query }
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return route
}

export function navigate(to) {
  const target = to.startsWith('#') ? to : '#' + to
  if (window.location.hash === target) return
  window.location.hash = target
}

export function materialHref(id, query) {
  const base = `#/m/${encodeURIComponent(id)}`
  return query ? `${base}?q=${encodeURIComponent(query)}` : base
}

export function subjectHref(id) {
  return `#/s/${encodeURIComponent(id)}`
}
