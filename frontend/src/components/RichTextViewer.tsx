import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface RichTextViewerProps {
  content: string
  className?: string
}

function getSafeHref(url: string): string {
  const trimmed = url.trim()
  if (/^(https?:\/\/|mailto:|tel:|\/|#|\.\/)/i.test(trimmed)) {
    return trimmed
  }
  if (/^\/\//.test(trimmed)) {
    return `https:${trimmed}`
  }
  if (!trimmed.includes(':')) {
    return trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed
  }
  return '#'
}

interface InlineMatch {
  index: number
  length: number
  node: ReactNode
}

function renderInline(text: string, baseKey = 'inline'): ReactNode[] {
  if (!text) return []

  const nodes: ReactNode[] = []
  let remaining = text
  let subIndex = 0

  while (remaining.length > 0) {
    const matches: InlineMatch[] = []

    // 1. Inline code: `code`
    const codeMatch = remaining.match(/`([^`\n]+)`/)
    if (codeMatch && codeMatch.index !== undefined) {
      matches.push({
        index: codeMatch.index,
        length: codeMatch[0].length,
        node: (
          <code
            key={`${baseKey}-code-${subIndex}`}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
          >
            {codeMatch[1]}
          </code>
        ),
      })
    }

    // 2. Link: [text](url)
    const linkMatch = remaining.match(/\[([^\]\n]+)\]\(([^)\s]+)\)/)
    if (linkMatch && linkMatch.index !== undefined) {
      matches.push({
        index: linkMatch.index,
        length: linkMatch[0].length,
        node: (
          <a
            key={`${baseKey}-link-${subIndex}`}
            href={getSafeHref(linkMatch[2])}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:opacity-80 underline-offset-4"
          >
            {renderInline(linkMatch[1], `${baseKey}-link-inner-${subIndex}`)}
          </a>
        ),
      })
    }

    // 3. Bold-Italic: ***text***
    const boldItalicMatch = remaining.match(/\*\*\*([^*\n]+)\*\*\*/)
    if (boldItalicMatch && boldItalicMatch.index !== undefined) {
      matches.push({
        index: boldItalicMatch.index,
        length: boldItalicMatch[0].length,
        node: (
          <strong key={`${baseKey}-bi-${subIndex}`} className="font-semibold">
            <em className="italic">
              {renderInline(boldItalicMatch[1], `${baseKey}-bi-inner-${subIndex}`)}
            </em>
          </strong>
        ),
      })
    }

    // 4. Bold: **text** or __text__
    const boldMatch = remaining.match(/\*\*([^*\n]+)\*\*|__([^_\n]+)__/)
    if (boldMatch && boldMatch.index !== undefined) {
      const boldText = boldMatch[1] ?? boldMatch[2]
      matches.push({
        index: boldMatch.index,
        length: boldMatch[0].length,
        node: (
          <strong key={`${baseKey}-b-${subIndex}`} className="font-semibold">
            {renderInline(boldText, `${baseKey}-b-inner-${subIndex}`)}
          </strong>
        ),
      })
    }

    // 5. Italic: *text* or _text_
    const italicMatch = remaining.match(/\*([^*\n]+)\*|(?<=\s|^)_([^_\n]+)_(?=\s|$|[.,!?;:])/)
    if (italicMatch && italicMatch.index !== undefined) {
      const italicText = italicMatch[1] ?? italicMatch[2]
      matches.push({
        index: italicMatch.index,
        length: italicMatch[0].length,
        node: (
          <em key={`${baseKey}-i-${subIndex}`} className="italic">
            {renderInline(italicText, `${baseKey}-i-inner-${subIndex}`)}
          </em>
        ),
      })
    }

    if (matches.length === 0) {
      nodes.push(remaining)
      break
    }

    // Pick earliest match. If tied, pick longest match.
    matches.sort((a, b) => a.index - b.index || b.length - a.length)
    const best = matches[0]

    if (best.index > 0) {
      nodes.push(remaining.slice(0, best.index))
    }
    nodes.push(best.node)
    remaining = remaining.slice(best.index + best.length)
    subIndex++
  }

  return nodes
}

type Block =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'code_block'; language?: string; code: string }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'unordered_list'; items: string[] }
  | { type: 'ordered_list'; items: string[] }
  | { type: 'paragraph'; lines: string[] }

export function RichTextViewer({ content, className }: RichTextViewerProps) {
  if (!content || !content.trim()) {
    return null
  }

  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line
    if (/^\s*$/.test(line)) {
      i++
      continue
    }

    // Fenced code block
    if (/^```/.test(line.trim())) {
      const lang = line.trim().slice(3).trim()
      i++
      const codeLines: string[] = []
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i])
        i++
      }
      if (i < lines.length && /^```/.test(lines[i].trim())) {
        i++
      }
      blocks.push({
        type: 'code_block',
        language: lang,
        code: codeLines.join('\n'),
      })
      continue
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const hashes = headingMatch[1].length
      const level: 2 | 3 | 4 =
        hashes === 2 ? 2 : hashes === 3 ? 3 : hashes === 4 ? 4 : hashes === 1 ? 2 : 4
      blocks.push({
        type: 'heading',
        level,
        text: headingMatch[2].trim(),
      })
      i++
      continue
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push({
        type: 'blockquote',
        lines: quoteLines,
      })
      continue
    }

    // Unordered list
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''))
        i++
      }
      blocks.push({
        type: 'unordered_list',
        items,
      })
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({
        type: 'ordered_list',
        items,
      })
      continue
    }

    // Paragraph
    const pLines: string[] = []
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^```/.test(lines[i].trim()) &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      pLines.push(lines[i])
      i++
    }

    if (pLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        lines: pLines,
      })
    }
  }

  return (
    <div className={cn('rich-text-content space-y-2 text-foreground', className)}>
      {blocks.map((block, bIdx) => {
        switch (block.type) {
          case 'heading': {
            const headingContent = renderInline(block.text, `h-${bIdx}`)
            if (block.level === 2) {
              return (
                <h2 key={bIdx} className="text-xl font-bold tracking-tight mt-4 mb-2 first:mt-0">
                  {headingContent}
                </h2>
              )
            }
            if (block.level === 3) {
              return (
                <h3
                  key={bIdx}
                  className="text-lg font-semibold tracking-tight mt-3 mb-1.5 first:mt-0"
                >
                  {headingContent}
                </h3>
              )
            }
            return (
              <h4 key={bIdx} className="text-base font-semibold mt-2 mb-1 first:mt-0">
                {headingContent}
              </h4>
            )
          }
          case 'code_block': {
            return (
              <pre
                key={bIdx}
                className="bg-muted p-3 rounded-lg overflow-x-auto text-sm my-2 font-mono text-muted-foreground"
              >
                <code>{block.code}</code>
              </pre>
            )
          }
          case 'blockquote': {
            return (
              <blockquote
                key={bIdx}
                className="border-l-4 border-muted-foreground/40 pl-4 py-1 italic my-2 text-muted-foreground"
              >
                {block.lines.map((qLine, qIdx) => (
                  <p key={qIdx} className="my-1 first:mt-0 last:mb-0">
                    {renderInline(qLine, `bq-${bIdx}-${qIdx}`)}
                  </p>
                ))}
              </blockquote>
            )
          }
          case 'unordered_list': {
            return (
              <ul key={bIdx} className="list-disc pl-5 space-y-1 my-2">
                {block.items.map((item, idx) => (
                  <li key={idx} className="leading-6">
                    {renderInline(item, `ul-${bIdx}-${idx}`)}
                  </li>
                ))}
              </ul>
            )
          }
          case 'ordered_list': {
            return (
              <ol key={bIdx} className="list-decimal pl-5 space-y-1 my-2">
                {block.items.map((item, idx) => (
                  <li key={idx} className="leading-6">
                    {renderInline(item, `ol-${bIdx}-${idx}`)}
                  </li>
                ))}
              </ol>
            )
          }
          case 'paragraph': {
            const paragraphNodes: ReactNode[] = []
            block.lines.forEach((pLine, lIdx) => {
              if (lIdx > 0) {
                paragraphNodes.push('\n')
              }
              paragraphNodes.push(...renderInline(pLine, `p-${bIdx}-${lIdx}`))
            })
            return (
              <p
                key={bIdx}
                className="leading-7 my-2 first:mt-0 last:mb-0 whitespace-pre-line"
              >
                {paragraphNodes}
              </p>
            )
          }
        }
      })}
    </div>
  )
}
