import { render, screen } from '@testing-library/react'
import { RichTextViewer } from '@/components/RichTextViewer'

describe('RichTextViewer', () => {
  it('renders null when content is empty or whitespace', () => {
    const { container } = render(<RichTextViewer content="" />)
    expect(container.firstChild).toBeNull()

    const { container: whitespaceContainer } = render(
      <RichTextViewer content={'   \n  \t  '} />,
    )
    expect(whitespaceContainer.firstChild).toBeNull()
  })

  it('renders headings correctly', () => {
    render(<RichTextViewer content={'## Second Level\n### Third Level\n#### Fourth Level'} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Second Level' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Third Level' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Fourth Level' })).toBeInTheDocument()
  })

  it('renders bold, italic and code inline formatting', () => {
    render(<RichTextViewer content={'This is **bold**, this is *italic*, and `code` here.'} />)

    expect(screen.getByText('bold')).toHaveClass('font-semibold')
    expect(screen.getByText('italic')).toHaveClass('italic')
    expect(screen.getByText('code')).toHaveClass('font-mono')
  })

  it('renders unordered and ordered lists', () => {
    render(
      <RichTextViewer
        content={'- First item\n- Second item\n\n1. Numbered one\n2. Numbered two'}
      />,
    )

    const lists = screen.getAllByRole('list')
    expect(lists).toHaveLength(2)
    expect(screen.getByText('First item')).toBeInTheDocument()
    expect(screen.getByText('Numbered one')).toBeInTheDocument()
  })

  it('renders blockquotes and code blocks', () => {
    render(<RichTextViewer content={'> A wise quote\n\n```python\nprint("hello")\n```'} />)

    expect(screen.getByText('A wise quote')).toBeInTheDocument()
    expect(screen.getByText('print("hello")')).toBeInTheDocument()
  })

  it('sanitizes unsafe javascript: links safely', () => {
    render(
      <RichTextViewer
        content={'[safe link](https://example.com) and [unsafe link](javascript:alert(1))'}
      />,
    )

    const safeLink = screen.getByRole('link', { name: 'safe link' })
    expect(safeLink).toHaveAttribute('href', 'https://example.com')

    const unsafeLink = screen.getByRole('link', { name: 'unsafe link' })
    expect(unsafeLink).toHaveAttribute('href', '#')
  })

  it('does not render raw HTML script tags as executable DOM elements', () => {
    render(<RichTextViewer content={'<script>window.__xss = true</script>'} />)
    expect(document.querySelector('script')).toBeNull()
    expect(screen.getByText('<script>window.__xss = true</script>')).toBeInTheDocument()
  })
})
