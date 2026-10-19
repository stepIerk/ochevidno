import manifest from '../../content/manifest.json'
import { parseCards } from './cards.js'
import { toPlainText } from './markdown.js'

const modules = import.meta.glob('/content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export const site = {
  title: manifest.title ?? 'Материалы',
  subtitle: manifest.subtitle ?? '',
}

export const typeLabels = manifest.types ?? {}

export function typeLabel(type) {
  if (typeLabels[type]) return typeLabels[type]
  if (!type) return 'Материал'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function loadRaw(file) {
  if (typeof file !== 'string' || file === '') return null
  const key = '/content/' + file.replace(/^\.?\//, '')
  const raw = modules[key]
  if (typeof raw !== 'string') {
    console.warn(`[content] Не найден файл: content/${file} — проверьте поле "file" в manifest.json`)
    return null
  }
  return raw
}

export const subjects = (manifest.subjects ?? []).map((subject, subjectIndex) => {
  const materials = (subject.materials ?? []).map((material, index) => {
    const raw = loadRaw(material.file)
    const cards = parseCards(loadRaw(material.cards))
    return {
      ...material,
      raw,
      cards,
      cardsCount: cards.length,
      available: raw != null,
      index,
      subjectId: subject.id,
      subjectName: subject.name,
    }
  })
  return {
    ...subject,
    index: subjectIndex,
    materials,
    availableMaterials: materials.filter((material) => material.available),
  }
})

export const allMaterials = subjects.flatMap((subject) => subject.availableMaterials)

const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))
const materialById = new Map(allMaterials.map((material) => [material.id, material]))

export function getSubject(id) {
  return subjectById.get(id) ?? null
}

export function getMaterial(id) {
  return materialById.get(id) ?? null
}

export function getSiblings(material) {
  const subject = getSubject(material.subjectId)
  const list = subject ? subject.availableMaterials : []
  const index = list.findIndex((item) => item.id === material.id)
  return {
    prev: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
    position: index + 1,
    total: list.length,
  }
}

const statsCache = new Map()

export function materialStats(material) {
  if (statsCache.has(material.id)) return statsCache.get(material.id)
  const text = toPlainText(material.raw)
  const words = text ? text.split(/\s+/).length : 0
  const stats = { words, minutes: Math.max(1, Math.round(words / 180)) }
  statsCache.set(material.id, stats)
  return stats
}
