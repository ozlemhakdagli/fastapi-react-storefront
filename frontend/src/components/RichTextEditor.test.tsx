import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RichTextEditor } from '@/components/RichTextEditor'
import { t } from '@/lib/i18n'

describe('RichTextEditor', () => {
  it('renders label, character count, and textarea with value', () => {
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        id="description"
        label="Description"
        value="Hello world"
        maxLength={100}
        onChange={handleChange}
      />,
    )

    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('Hello world')
    expect(screen.getByText(t('common.chars_left', { count: 89 }))).toBeInTheDocument()
  })

  it('renders remaining character count when maxLength is provided without label', () => {
    render(
      <RichTextEditor
        value="Test text"
        maxLength={50}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText(t('common.chars_left', { count: 41 }))).toBeInTheDocument()
  })

  it('switches between Write and Preview tabs', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        value="## Preview heading"
        onChange={handleChange}
      />,
    )

    // Write tab is active initially
    expect(screen.getByRole('textbox')).toBeInTheDocument()

    // Click Preview tab
    const previewTab = screen.getByRole('tab', { name: t('common.editor_preview') })
    await user.click(previewTab)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Preview heading' })).toBeInTheDocument()

    // Click Write tab back
    const writeTab = screen.getByRole('tab', { name: t('common.editor_write') })
    await user.click(writeTab)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows empty preview message when content is empty in preview mode', async () => {
    const user = userEvent.setup()
    render(
      <RichTextEditor
        value=""
        onChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('tab', { name: t('common.editor_preview') }))
    expect(screen.getByText(t('common.editor_empty_preview'))).toBeInTheDocument()
  })

  it('clicking bold toolbar button wraps or inserts markdown syntax', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        value=""
        onChange={handleChange}
      />,
    )

    const boldBtn = screen.getByRole('button', { name: t('common.editor_bold') })
    await user.click(boldBtn)

    expect(handleChange).toHaveBeenCalledWith('**bold text**')
  })

  it('clicking italic toolbar button wraps or inserts markdown syntax', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        value=""
        onChange={handleChange}
      />,
    )

    const italicBtn = screen.getByRole('button', { name: t('common.editor_italic') })
    await user.click(italicBtn)

    expect(handleChange).toHaveBeenCalledWith('*italic text*')
  })

  it('clicking heading2 button prefixes markdown syntax', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        value=""
        onChange={handleChange}
      />,
    )

    const h2Btn = screen.getByRole('button', { name: t('common.editor_h2') })
    await user.click(h2Btn)

    expect(handleChange).toHaveBeenCalledWith('## Heading 2')
  })

  it('clicking heading3 button prefixes markdown syntax', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        value=""
        onChange={handleChange}
      />,
    )

    const h3Btn = screen.getByRole('button', { name: t('common.editor_h3') })
    await user.click(h3Btn)

    expect(handleChange).toHaveBeenCalledWith('### Heading 3')
  })

  it('clicking bullet list button prefixes list syntax', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        value=""
        onChange={handleChange}
      />,
    )

    const listBtn = screen.getByRole('button', { name: t('common.editor_bullet_list') })
    await user.click(listBtn)

    expect(handleChange).toHaveBeenCalledWith('- List item')
  })

  it('clicking numbered list button prefixes ordered list syntax', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        value=""
        onChange={handleChange}
      />,
    )

    const listBtn = screen.getByRole('button', { name: t('common.editor_numbered_list') })
    await user.click(listBtn)

    expect(handleChange).toHaveBeenCalledWith('1. List item')
  })

  it('clicking quote button prefixes blockquote syntax', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        value=""
        onChange={handleChange}
      />,
    )

    const quoteBtn = screen.getByRole('button', { name: t('common.editor_quote') })
    await user.click(quoteBtn)

    expect(handleChange).toHaveBeenCalledWith('> Quote')
  })

  it('clicking code button inserts fenced code block', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        value=""
        onChange={handleChange}
      />,
    )

    const codeBtn = screen.getByRole('button', { name: t('common.editor_code') })
    await user.click(codeBtn)

    expect(handleChange).toHaveBeenCalledWith('```\ncode\n```')
  })

  it('clicking link button inserts markdown link syntax', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <RichTextEditor
        value=""
        onChange={handleChange}
      />,
    )

    const linkBtn = screen.getByRole('button', { name: t('common.editor_link') })
    await user.click(linkBtn)

    expect(handleChange).toHaveBeenCalledWith('[link text](url)')
  })

  it('renders error message and marks textarea as invalid', () => {
    render(
      <RichTextEditor
        value="value"
        onChange={vi.fn()}
        error="Bu alan zorunludur"
      />,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Bu alan zorunludur')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })
})
