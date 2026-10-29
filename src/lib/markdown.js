import GithubSlugger from 'github-slugger'

const DISPLAY_MATH = /\\\[([\s\S]*?)\\\]/g
const INLINE_MATH = /\\\(([\s\S]*?)\\\)/g
const CODE_FENCE = /^\s{0,3}(```+|~~~+)/
const INLINE_CODE = /`[^`\n]*`/g
const CONTAINER_PREFIX = /^[ \t>]*$/

function escapeDollars(text) {
  return text.replace(/\$/g, '\\$')
}

function containerPrefixAt(text, offset) {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1
  return /^[ \t>]*/.exec(text.slice(lineStart, offset))[0]
}

function stripClosingPrefix(inner) {
  const lastNewline = inner.lastIndexOf('\n')
  if (lastNewline === -1) return inner
  return CONTAINER_PREFIX.test(inner.slice(lastNewline + 1)) ? inner.slice(0, lastNewline) : inner
}

function toDisplayMath(match, inner, offset, whole) {
  const prefix = containerPrefixAt(whole, offset)
  const lines = escapeDollars(stripClosingPrefix(inner).trim()).split('\n')
  const body = lines
    .map((line) => (line.trim() && prefix && !line.startsWith(prefix) ? prefix + line : line))
    .join('\n')
  return body ? `\n\n${prefix}$$\n${body}\n${prefix}$$\n\n` : match
}

function toInlineMath(match, inner) {
  const body = escapeDollars(inner.replace(/\s*\n\s*/g, ' ').trim())
  return body ? `$${body}$` : match
}

function transformMath(segment) {
  const codeSpans = []
  const masked = segment.replace(INLINE_CODE, (span) => {
    codeSpans.push(span)
    return `\uE000${codeSpans.length - 1}\uE001`
  })
  const transformed = masked.replace(DISPLAY_MATH, toDisplayMath).replace(INLINE_MATH, toInlineMath)
  return transformed.replace(/\uE000(\d+)\uE001/g, (match, index) => codeSpans[Number(index)])
}

export function normalizeMathDelimiters(source) {
  const lines = source.split('\n')
  const output = []
  let buffer = []
  let fence = null
  const flush = () => {
    if (buffer.length) {
      output.push(transformMath(buffer.join('\n')))
      buffer = []
    }
  }
  for (const line of lines) {
    const match = CODE_FENCE.exec(line)
    if (fence === null) {
      if (match) {
        flush()
        fence = match[1][0]
        output.push(line)
      } else {
        buffer.push(line)
      }
      continue
    }
    output.push(line)
    if (match && match[1][0] === fence) fence = null
  }
  flush()
  return output.join('\n')
}

export function stripInline(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\$([^$]*)\$/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .trim()
}

export function extractToc(markdown, maxDepth = 4) {
  const slugger = new GithubSlugger()
  const all = []
  let inFence = false
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) continue
    const text = stripInline(match[2])
    if (!text) continue
    all.push({ depth: match[1].length, text, id: slugger.slug(text) })
  }
  return all.filter((item) => item.depth <= maxDepth)
}

export function toPlainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/\\\[[\s\S]*?\\\]/g, ' ')
    .replace(/\\\([\s\S]*?\\\)/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]*\$/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[\^[^\]]*\]/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, '')
    .replace(/[|\t]/g, ' ')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
