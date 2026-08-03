type Props = {
  current: number
  target: number
}

export function ProgressBar({ current, target }: Props) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={current} aria-valuemax={target}>
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      <span className="progress-bar-label">
        {current} / {target}
      </span>
    </div>
  )
}
