import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'
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

const components = {
  a: MarkdownLink,
  img: MarkdownImage,
  table: MarkdownTable,
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
