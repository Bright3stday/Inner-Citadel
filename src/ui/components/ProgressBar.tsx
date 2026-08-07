type Props = {
  current: number
  target: number
  pulse?: 'none' | 'normal' | 'target'
}

export function ProgressBar({ current, target, pulse = 'none' }: Props) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const pulseClass = pulse === 'none' ? '' : ` progress-bar-pulse-${pulse}`

  return (
    <div
      className={`progress-bar${pulseClass}`}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemax={target}
    >
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      <span className="progress-bar-label">
        <span key={current} className="progress-bar-value">
          {current}
        </span>{' '}
        / {target}
      </span>
    </div>
  )
}
