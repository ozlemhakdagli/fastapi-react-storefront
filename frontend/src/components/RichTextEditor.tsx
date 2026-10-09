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

export interface RichTextEditorProps {
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
        {/* Header toolbar & mode tabs */}
        <div className="flex flex-wrap items-center justify-between gap-1 border-b bg-muted/40 p-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'write'}
              onClick={() => setActiveTab('write')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                activeTab === 'write'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              )}
            >
              {t('common.editor_write')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'preview'}
              onClick={() => setActiveTab('preview')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                activeTab === 'preview'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              )}
            >
              {t('common.editor_preview')}
            </button>
          </div>

          {activeTab === 'write' ? (
            <div className="flex flex-wrap items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title={t('common.editor_bold')}
                aria-label={t('common.editor_bold')}
                onClick={() => applyWrap('**', '**', 'bold text')}
              >
                <Bold className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title={t('common.editor_italic')}
                aria-label={t('common.editor_italic')}
                onClick={() => applyWrap('*', '*', 'italic text')}
              >
                <Italic className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title={t('common.editor_h2')}
                aria-label={t('common.editor_h2')}
                onClick={() => applyLinePrefix('## ', 'Heading 2')}
              >
                <Heading2 className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title={t('common.editor_h3')}
                aria-label={t('common.editor_h3')}
                onClick={() => applyLinePrefix('### ', 'Heading 3')}
              >
                <Heading3 className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title={t('common.editor_bullet_list')}
                aria-label={t('common.editor_bullet_list')}
                onClick={() => applyLinePrefix('- ', 'List item')}
              >
                <List className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title={t('common.editor_numbered_list')}
                aria-label={t('common.editor_numbered_list')}
                onClick={() => applyLinePrefix('1. ', 'List item')}
              >
                <ListOrdered className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title={t('common.editor_quote')}
                aria-label={t('common.editor_quote')}
                onClick={() => applyLinePrefix('> ', 'Quote')}
              >
                <Quote className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title={t('common.editor_code')}
                aria-label={t('common.editor_code')}
                onClick={insertCodeBlock}
              >
                <Code className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title={t('common.editor_link')}
                aria-label={t('common.editor_link')}
                onClick={insertLink}
              >
                <LinkIcon className="size-3.5" aria-hidden="true" />
              </Button>
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
