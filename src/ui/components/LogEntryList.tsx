import type { LogEntry, Quest } from '../../model/types'

type Props = {
  quest: Quest
  entries: LogEntry[]
}

// Shared by the weekly review's per-quest breakdown and DomainView's
// per-quest history — same underlying fact (a quest's log entries),
// just filtered to a different range by the caller.
export function LogEntryList({ quest, entries }: Props) {
  if (entries.length === 0) {
    return <p className="log-entry-list-empty">No log entries.</p>
  }

  return (
    <ul className="log-entry-list">
      {entries.map((entry) => {
        const method = quest.methods.find((m) => m.id === entry.methodId)
        return (
          <li key={entry.id}>
            {entry.forDate} · {method?.label ?? 'Logged'} · {entry.count}
          </li>
        )
      })}
    </ul>
  )
}
