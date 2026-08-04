import { ProgressBar } from './ProgressBar'
import type { DailyQuestView } from '../../core/selectors'

type Props = {
  view: DailyQuestView
  onLog: (methodId: string) => void
}

// suggestedDays only ever dims this row's display — it never disables
// the log buttons. Banking progress ahead of "due" is always allowed.
export function QuestRow({ view, onLog }: Props) {
  const { quest, progress, isDueToday } = view

  return (
    <div className={`quest-row${isDueToday ? '' : ' quest-row-not-due'}`}>
      <div className="quest-row-header">
        <span className="quest-title">{quest.title}</span>
      </div>
      <ProgressBar current={progress.current} target={progress.target} />
      <div className="quest-methods">
        {quest.methods.map((method) => (
          <button key={method.id} type="button" onClick={() => onLog(method.id)}>
            + {method.label}
          </button>
        ))}
      </div>
    </div>
  )
}
