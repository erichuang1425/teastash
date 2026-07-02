interface ProgressRingProps {
  ratio: number // 0..1
  size?: number
  strokeWidth?: number
  label?: string
  trackColor?: string
  color?: string
}

export function ProgressRing({
  ratio,
  size = 88,
  strokeWidth = 9,
  label,
  trackColor = '#EADFC8',
  color = '#6B8E23',
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, ratio))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped)

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(clamped * 100)}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[15px] font-semibold text-ink">{label ?? `${Math.round(clamped * 100)}%`}</span>
      </div>
    </div>
  )
}
