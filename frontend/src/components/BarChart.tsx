import { Fragment } from 'react'

interface BarChartProps {
  /** One bar per point, drawn from left to right. */
  data: { label: string; value: number }[]
  /** The text summary that screen readers announce for the whole chart. */
  ariaLabel: string
  /** Formats the value labels and the hover titles. Default: the plain number. */
  formatValue?: (value: number) => string
}

// The chart is drawn in these user units; the svg scales to the width of its card.
const WIDTH = 600
const HEIGHT = 230
const SIDE = 8 // gutter left and right
const TOP = 24 // room above the tallest bar for its value label
const BOTTOM = 36 // room below the baseline for the axis labels
const BASELINE = HEIGHT - BOTTOM
const PLOT_HEIGHT = BASELINE - TOP
const LABEL_SIZE = 18 // about 10 px on a phone

/** Zero, negative and invalid values are drawn as empty bars. */
function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function BarChart({ data, ariaLabel, formatValue = String }: BarChartProps) {
  const largest = data.reduce((max, point) => Math.max(max, positive(point.value)), 0)
  const slot = (WIDTH - 2 * SIDE) / Math.max(data.length, 1)
  const barWidth = slot * 0.6

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full"
    >
      {data.map((point, index) => {
        const value = positive(point.value)
        // With no value above zero every bar has height 0 (no division by zero).
        const height = largest > 0 ? (value / largest) * PLOT_HEIGHT : 0
        const x = SIDE + index * slot + (slot - barWidth) / 2
        const centerX = x + barWidth / 2
        const text = formatValue(value)
        return (
          <Fragment key={index}>
            <rect
              x={x}
              y={BASELINE - height}
              width={barWidth}
              height={height}
              rx={2}
              className="fill-primary"
            >
              <title>{`${point.label}: ${text}`}</title>
            </rect>
            {value > 0 ? (
              <text
                x={centerX}
                y={BASELINE - height - 6}
                textAnchor="middle"
                fontSize={LABEL_SIZE}
                className="fill-foreground"
              >
                {text}
              </text>
            ) : null}
            {(data.length - 1 - index) % 2 === 0 ? (
              <text
                x={centerX}
                y={HEIGHT - 10}
                textAnchor="middle"
                fontSize={LABEL_SIZE}
                className="fill-muted-foreground"
              >
                {point.label}
              </text>
            ) : null}
          </Fragment>
        )
      })}
      <line
        x1={SIDE}
        x2={WIDTH - SIDE}
        y1={BASELINE}
        y2={BASELINE}
        strokeWidth={1}
        className="stroke-border"
      />
    </svg>
  )
}
