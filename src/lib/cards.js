export function parseCards(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return []
  const cards = []
  let question = null
  let answerLines = []
  let inFence = false

  const flush = () => {
    if (question == null) return
    const answer = answerLines.join('\n').trim()
    if (answer === '') {
      console.warn(`[cards] Пропущена карточка без ответа: «${question}»`)
      return
    }
    cards.push({ id: `card-${cards.length + 1}`, question, answer })
  }

  for (const line of raw.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    const match = inFence ? null : line.match(/^##\s+(.+?)\s*$/)
    if (match) {
      flush()
      question = match[1]
      answerLines = []
      continue
    }
    if (question != null) answerLines.push(line)
  }
  flush()
  return cards
}
