import { allMaterials, typeLabel } from './content.js'
import { extractToc, toPlainText } from './markdown.js'

let index = null

export function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function wordsOf(text) {
  return text.match(/[\p{L}\p{N}]+/gu) ?? []
}

function buildIndex() {
  return allMaterials.map((material) => {
    const text = toPlainText(material.raw)
    const headings = extractToc(material.raw, 6)
      .map((item) => item.text)
      .join(' · ')
    return {
      material,
      title: material.title,
      titleLower: material.title.toLowerCase(),
      subjectLower: material.subjectName.toLowerCase(),
      typeLower: typeLabel(material.type).toLowerCase(),
      headingsLower: headings.toLowerCase(),
      text,
      textLower: text.toLowerCase(),
      titleWords: wordsOf(material.title.toLowerCase()),
      headingWords: wordsOf(headings.toLowerCase()),
      bodyWords: wordsOf(text.toLowerCase()),
    }
  })
}

function getIndex() {
  if (!index) index = buildIndex()
  return index
}

function isWordStart(text, position) {
  if (position === 0) return true
  return !/[\p{L}\p{N}]/u.test(text[position - 1])
}

function countOccurrences(haystack, needle, limit) {
  if (!needle) return 0
  let count = 0
  let position = 0
  while (count < limit) {
    const found = haystack.indexOf(needle, position)
    if (found === -1) break
    count += 1
    position = found + needle.length
  }
  return count
}

function tokenVariants(token) {
  const variants = [token]
  if (token.length >= 5) variants.push(token.slice(0, -1))
  if (token.length >= 6) variants.push(token.slice(0, -2))
  return variants
}

const VARIANT_WEIGHTS = [1, 0.75, 0.55]

function fuzzyMatch(token, word) {
  if (token === word) return true
  const max = Math.min(token.length, word.length)
  if (max < 4) return false
  let common = 0
  while (common < max && token[common] === word[common]) common += 1
  return common >= 4 && common >= max - 2
}

function findFuzzy(words, token) {
  return words.find((word) => fuzzyMatch(token, word)) ?? null
}

export function highlightParts(text, terms) {
  if (!terms.length) return [{ text, hit: false }]
  const sorted = [...terms].sort((a, b) => b.length - a.length)
  const pattern = new RegExp(`(${sorted.map(escapeRegExp).join('|')})`, 'giu')
  const parts = []
  let last = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), hit: false })
    parts.push({ text: match[0], hit: true })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false })
  return parts.length ? parts : [{ text, hit: false }]
}

function makeSnippet(text, terms, width = 200) {
  const lower = text.toLowerCase()
  let position = -1
  for (const term of terms) {
    const found = lower.indexOf(term)
    if (found !== -1 && (position === -1 || found < position)) position = found
  }
  if (position === -1) return null
  const start = Math.max(0, position - 60)
  const end = Math.min(text.length, start + width)
  let slice = text.slice(start, end)
  if (start > 0) slice = '…' + slice
  if (end < text.length) slice = slice + '…'
  return highlightParts(slice, terms)
}

export function searchMaterials(query, limit = 20) {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return []
  const phrase = query.trim().toLowerCase()
  const exactTerms = [...new Set(tokens.flatMap(tokenVariants))]
  const results = []
  for (const entry of getIndex()) {
    let score = 0
    let matchesAll = true
    const fuzzyWords = []
    for (const token of tokens) {
      const variants = tokenVariants(token)
      let tokenScore = 0
      let matched = false
      for (let index = 0; index < variants.length; index += 1) {
        const variant = variants[index]
        let subtotal = 0
        let any = false
        const titlePosition = entry.titleLower.indexOf(variant)
        if (titlePosition !== -1) {
          subtotal += 60
          if (isWordStart(entry.titleLower, titlePosition)) subtotal += 20
          any = true
        }
        const inHeadings = countOccurrences(entry.headingsLower, variant, 3)
        if (inHeadings) {
          subtotal += 14 * inHeadings
          any = true
        }
        const inBody = countOccurrences(entry.textLower, variant, 6)
        if (inBody) {
          subtotal += 5 * inBody
          any = true
        }
        if (!any && entry.subjectLower.includes(variant)) {
          subtotal += 12
          any = true
        }
        if (!any && entry.typeLower.includes(variant)) {
          subtotal += 10
          any = true
        }
        if (any) {
          tokenScore += subtotal * VARIANT_WEIGHTS[index]
          matched = true
          break
        }
      }
      if (!matched) {
        const inTitle = findFuzzy(entry.titleWords, token)
        if (inTitle) {
          tokenScore += 45
          matched = true
          fuzzyWords.push(inTitle)
        } else {
          const inHeading = findFuzzy(entry.headingWords, token)
          if (inHeading) {
            tokenScore += 14
            matched = true
            fuzzyWords.push(inHeading)
          } else {
            const inBody = findFuzzy(entry.bodyWords, token)
            if (inBody) {
              tokenScore += 5
              matched = true
              fuzzyWords.push(inBody)
            } else if (entry.subjectLower.includes(token)) {
              tokenScore += 12
              matched = true
            } else if (entry.typeLower.includes(token)) {
              tokenScore += 10
              matched = true
            }
          }
        }
      }
      if (!matched) {
        matchesAll = false
        break
      }
      score += tokenScore
    }
    if (!matchesAll) continue
    if (phrase.length > 2 && entry.titleLower.includes(phrase)) score += 100
    else if (phrase.length > 2 && entry.textLower.includes(phrase)) score += 30
    const highlightTerms = [...new Set([...exactTerms, ...fuzzyWords])]
    results.push({
      entry,
      score,
      titleParts: highlightParts(entry.title, highlightTerms),
      snippet: makeSnippet(entry.text, highlightTerms),
    })
  }
  results.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, 'ru'))
  return results.slice(0, limit)
}
