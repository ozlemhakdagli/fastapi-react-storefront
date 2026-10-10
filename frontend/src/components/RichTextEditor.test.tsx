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

  it.each([
    ['common.editor_bold', '**bold text**'],
    ['common.editor_italic', '*italic text*'],
    ['common.editor_h2', '## Heading 2'],
    ['common.editor_h3', '### Heading 3'],
    ['common.editor_bullet_list', '- List item'],
    ['common.editor_numbered_list', '1. List item'],
    ['common.editor_quote', '> Quote'],
    ['common.editor_code', '```\ncode\n```'],
    ['common.editor_link', '[link text](url)'],
  ])('the %s button inserts its markdown into an empty field', async (label, markdown) => {
    const onChange = vi.fn()
    render(<RichTextEditor value="" onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: t(label) }))

    expect(onChange).toHaveBeenCalledWith(markdown)
  })

  it('wraps the selected text instead of inserting a sample', async () => {
    const onChange = vi.fn()
    render(<RichTextEditor value="a b c" onChange={onChange} />)
    ;(screen.getByRole('textbox') as HTMLTextAreaElement).setSelectionRange(2, 3) // "b"

    await userEvent.click(screen.getByRole('button', { name: t('common.editor_bold') }))

    expect(onChange).toHaveBeenCalledWith('a **b** c')
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
