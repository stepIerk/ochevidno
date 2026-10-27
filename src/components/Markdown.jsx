import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'
import { useCodeSettings } from '../lib/codeSettings.js'
import { codeLanguageLabel, highlightCode } from '../lib/highlight.js'
import { normalizeMathDelimiters } from '../lib/markdown.js'

const remarkPlugins = [remarkGfm, remarkMath]
const rehypePlugins = [rehypeRaw, [rehypeKatex, { throwOnError: false }], rehypeSlug]

function resolveSrc(src) {
  if (typeof src !== 'string' || !src.startsWith('/')) return src
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/'
  return base + src.slice(1)
}

function onAnchorClick(event) {
  const href = event.currentTarget.getAttribute('href')
  if (!href || !href.startsWith('#')) return
  const target = document.getElementById(decodeURIComponent(href.slice(1)))
  if (!target) return
  event.preventDefault()
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function MarkdownLink({ href, children }) {
  if (typeof href === 'string' && href.startsWith('#')) {
    return (
      <a href={href} onClick={onAnchorClick}>
        {children}
      </a>
    )
  }
  const external = typeof href === 'string' && /^https?:/i.test(href)
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : null)}>
      {children}
    </a>
  )
}

function MarkdownImage({ src, alt }) {
  return <img src={resolveSrc(src)} alt={alt ?? ''} loading="lazy" />
}

function MarkdownTable({ children }) {
  return (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  )
}

function codeText(value) {
  if (Array.isArray(value)) return value.join('')
  if (typeof value === 'string') return value
  return String(value ?? '')
}

function MarkdownPre({ children }) {
  const [settings] = useCodeSettings()
  const { highlight, autoDetect, theme } = settings
  const list = Array.isArray(children) ? children : [children]
  const element = list.find((child) => child && typeof child === 'object' && child.props)
  const className = element?.props?.className ?? ''
  const text = codeText(element?.props?.children ?? children).replace(/\n$/, '')
  const language = /language-([^\s]+)/.exec(className)?.[1] ?? ''
  const result = useMemo(
    () => highlightCode(text, language, { highlight, autoDetect }),
    [text, language, highlight, autoDetect],
  )
  const codeProps = result.html
    ? { dangerouslySetInnerHTML: { __html: result.html } }
    : { children: text }

  return (
    <div
      className="code-block"
      data-code-theme={theme === 'auto' ? undefined : theme}
    >
      <div className="code-block-head">
        <span className="code-block-lang">{codeLanguageLabel(result.language || language)}</span>
        {result.auto && <span className="code-block-auto">авто</span>}
      </div>
      <pre>
        <code
          className={`hljs${result.language ? ` language-${result.language}` : ''}`}
          {...codeProps}
        />
      </pre>
    </div>
  )
}

const components = {
  a: MarkdownLink,
  img: MarkdownImage,
  table: MarkdownTable,
  pre: MarkdownPre,
}

const Markdown = memo(function Markdown({ source }) {
  const processed = useMemo(() => normalizeMathDelimiters(source), [source])
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
      {processed}
    </ReactMarkdown>
  )
})

export default Markdown
