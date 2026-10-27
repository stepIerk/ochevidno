import hljs from 'highlight.js/lib/common'
import delphi from 'highlight.js/lib/languages/delphi'
import latex from 'highlight.js/lib/languages/latex'

hljs.registerLanguage('pascal', delphi)
hljs.registerLanguage('latex', latex)

const AUTO_LANGUAGES = [
  'c',
  'cpp',
  'pascal',
  'csharp',
  'java',
  'kotlin',
  'swift',
  'go',
  'rust',
  'python',
  'javascript',
  'typescript',
  'ruby',
  'php',
  'perl',
  'lua',
  'r',
  'sql',
  'bash',
  'shell',
  'latex',
  'objectivec',
  'vbnet',
]

const LANGUAGE_LABELS = {
  bash: 'Bash',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  css: 'CSS',
  go: 'Go',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  json: 'JSON',
  kotlin: 'Kotlin',
  latex: 'LaTeX',
  lua: 'Lua',
  markdown: 'Markdown',
  objectivec: 'Objective-C',
  pascal: 'Pascal',
  perl: 'Perl',
  php: 'PHP',
  plaintext: 'Текст',
  python: 'Python',
  r: 'R',
  ruby: 'Ruby',
  rust: 'Rust',
  scss: 'SCSS',
  shell: 'Shell',
  sql: 'SQL',
  swift: 'Swift',
  typescript: 'TypeScript',
  vbnet: 'VB.NET',
  xml: 'XML',
  yaml: 'YAML',
}

const PSEUDO_CODE = /::=|<[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё0-9 _-]*>/

export function codeLanguageLabel(language) {
  if (!language) return 'Код'
  return LANGUAGE_LABELS[language] ?? hljs.getLanguage(language)?.name ?? language
}

export function highlightCode(code, language, { highlight, autoDetect }) {
  const requested = typeof language === 'string' ? language.toLowerCase() : ''
  const known = requested && hljs.getLanguage(requested) ? requested : ''

  if (!highlight) return { html: '', language: known, auto: false }
  if (known) {
    return {
      html: hljs.highlight(code, { language: known, ignoreIllegals: true }).value,
      language: known,
      auto: false,
    }
  }
  if (!autoDetect || !code.trim() || PSEUDO_CODE.test(code)) {
    return { html: '', language: '', auto: false }
  }

  const result = hljs.highlightAuto(code, AUTO_LANGUAGES)
  if (!result.language || result.relevance < 2) {
    return { html: '', language: '', auto: false }
  }
  return { html: result.value, language: result.language, auto: true }
}
