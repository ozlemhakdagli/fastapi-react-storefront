import { useRef, useState } from 'react'
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react'
import { RichTextViewer } from '@/components/RichTextViewer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  label?: string
  error?: string
  className?: string
}

const TABS = [
  ['write', 'common.editor_write'],
  ['preview', 'common.editor_preview'],
] as const

export function RichTextEditor({
  id,
  name,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 8,
  label,
  error,
  className,
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const focusAndSetSelection = (start: number, end: number) => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(start, end)
      }
    })
  }

  const applyWrap = (before: string, after: string, defaultText = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)
    const contentToWrap = selected || defaultText

    const nextValue = value.slice(0, start) + before + contentToWrap + after + value.slice(end)
    onChange(nextValue)

    const newStart = start + before.length
    const newEnd = newStart + contentToWrap.length
    focusAndSetSelection(newStart, newEnd)
  }

  const applyLinePrefix = (prefix: string, defaultText = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)

    if (selected) {
      const lines = selected.split('\n')
      const prefixed = lines.map((line) => `${prefix}${line}`).join('\n')
      const nextValue = value.slice(0, start) + prefixed + value.slice(end)
      onChange(nextValue)
      focusAndSetSelection(start, start + prefixed.length)
    } else {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const isNewLine = start === lineStart
      const insertPrefix = isNewLine ? prefix : `\n${prefix}`
      const text = defaultText
      const nextValue =
        value.slice(0, start) + insertPrefix + text + value.slice(end)
      onChange(nextValue)
      const newPos = start + insertPrefix.length + text.length
      focusAndSetSelection(newPos, newPos)
    }
  }

  const insertLink = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)

    if (selected) {
      applyWrap('[', '](url)')
    } else {
      const sample = '[link text](url)'
      const nextValue = value.slice(0, start) + sample + value.slice(end)
      onChange(nextValue)
      focusAndSetSelection(start + 1, start + 10)
    }
  }

  const insertCodeBlock = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)

    if (selected) {
      applyWrap('```\n', '\n```', 'code')
    } else {
      const sample = '```\ncode\n```'
      const nextValue = value.slice(0, start) + sample + value.slice(end)
      onChange(nextValue)
      focusAndSetSelection(start + 4, start + 8)
    }
  }

  const toolbar = [
    { label: 'common.editor_bold', icon: Bold, run: () => applyWrap('**', '**', 'bold text') },
    { label: 'common.editor_italic', icon: Italic, run: () => applyWrap('*', '*', 'italic text') },
    { label: 'common.editor_h2', icon: Heading2, run: () => applyLinePrefix('## ', 'Heading 2') },
    { label: 'common.editor_h3', icon: Heading3, run: () => applyLinePrefix('### ', 'Heading 3') },
    { label: 'common.editor_bullet_list', icon: List, run: () => applyLinePrefix('- ', 'List item') },
    {
      label: 'common.editor_numbered_list',
      icon: ListOrdered,
      run: () => applyLinePrefix('1. ', 'List item'),
    },
    { label: 'common.editor_quote', icon: Quote, run: () => applyLinePrefix('> ', 'Quote') },
    { label: 'common.editor_code', icon: Code, run: insertCodeBlock },
    { label: 'common.editor_link', icon: LinkIcon, run: insertLink },
  ]

  const remaining = maxLength !== undefined ? maxLength - value.length : null

  return (
    <div className={cn('grid gap-1.5', className)}>
      {label || remaining !== null ? (
        <div className="flex items-center justify-between">
          {label ? (
            <label htmlFor={id} className="text-sm font-medium">
              {label}
            </label>
          ) : (
            <span />
          )}
          {remaining !== null ? (
            <span
              className={cn(
                'text-xs',
                remaining < 0
                  ? 'font-medium text-destructive'
                  : 'text-muted-foreground',
              )}
            >
              {t('common.chars_left', { count: remaining })}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-1 border-b bg-muted/40 p-1.5">
          <div role="tablist" className="flex items-center gap-1">
            {TABS.map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
                )}
              >
                {t(label)}
              </button>
            ))}
          </div>

          {activeTab === 'write' ? (
            <div className="flex flex-wrap items-center gap-0.5">
              {toolbar.map(({ label, icon: Icon, run }) => (
                <Button
                  key={label}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  title={t(label)}
                  aria-label={t(label)}
                  onClick={run}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Content area */}
        {activeTab === 'write' ? (
          <Textarea
            ref={textareaRef}
            id={id}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={rows}
            aria-invalid={error ? true : undefined}
            className="border-0 shadow-none focus-visible:ring-0 rounded-t-none resize-y"
          />
        ) : (
          <div
            className="p-3 text-sm min-h-[160px] overflow-auto max-h-[400px]"
            data-testid="rich-text-preview"
          >
            {value.trim() ? (
              <RichTextViewer content={value} />
            ) : (
              <p className="text-sm italic text-muted-foreground">
                {t('common.editor_empty_preview')}
              </p>
            )}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
