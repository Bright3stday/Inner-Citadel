import { useRef, useState } from 'react'
import { exportToFile, importFromFile } from '../../storage/transfer'
import { replaceState } from '../../actions/transferActions'
import { updateSettings } from '../../actions/settingsActions'
import * as storage from '../../storage/storage'
import type { AppState } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function notificationPermission(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

export function SettingsView({ state, apply }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [importedAt, setImportedAt] = useState<string | null>(null)
  const [permission, setPermission] = useState(notificationPermission)

  async function handleRequestPermission() {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  function handleExport() {
    exportToFile(state)
  }

  function handleImportClick() {
    setError(null)
    fileInputRef.current?.click()
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow selecting the same file again next time
    if (!file) return

    const confirmed = window.confirm(
      'Importing REPLACES all data currently in this browser with the contents of this file. ' +
        'This does not merge — anything logged here since your last export will be lost ' +
        '(though it stays recoverable from a local backup until your next import). Continue?',
    )
    if (!confirmed) return

    try {
      const imported = await importFromFile(file, state)
      apply(replaceState, imported)
      setError(null)
      setImportedAt(new Date().toLocaleString())
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function handleReset() {
    const confirmed = window.confirm(
      'Reset clears everything in this browser — all domains, quests, and log history. ' +
        "A copy of what you had is kept in a local backup, but there's no way to restore it " +
        'from within the app yet. Export first if you want a safe copy. Continue?',
    )
    if (!confirmed) return

    storage.saveBackup(state)
    storage.clear()
    location.reload()
  }

  return (
    <div className="view settings-view">
      <h1>Settings</h1>

      <div className="settings-section">
        <h2>Weekly ritual</h2>
        <label className="settings-field">
          Week starts on
          <select
            value={state.settings.weekStartsOn}
            onChange={(e) => apply(updateSettings, { weekStartsOn: Number(e.target.value) as 0 | 1 })}
          >
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </select>
        </label>

        <label className="settings-field">
          Remind me
          <select
            value={state.settings.reminderDay ?? ''}
            onChange={(e) =>
              apply(updateSettings, { reminderDay: e.target.value === '' ? null : Number(e.target.value) })
            }
          >
            <option value="">Off</option>
            {WEEKDAY_NAMES.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>

        {state.settings.reminderDay !== null && (
          <label className="settings-field">
            At
            <input
              type="time"
              value={state.settings.reminderTime ?? '09:00'}
              onChange={(e) => apply(updateSettings, { reminderTime: e.target.value })}
            />
          </label>
        )}

        {state.settings.reminderDay !== null && permission !== 'granted' && (
          <>
            {permission === 'unsupported' && (
              <p className="settings-hint">Notifications aren't supported in this browser.</p>
            )}
            {permission === 'default' && (
              <button type="button" onClick={handleRequestPermission}>
                Enable notifications
              </button>
            )}
            {permission === 'denied' && (
              <p className="settings-hint">
                Notifications are blocked — allow them for this site in your browser settings.
              </p>
            )}
          </>
        )}

        <p className="settings-hint">
          Best-effort only — checked when the app is open or just opened, not while fully closed. The
          Review tab always works regardless.
        </p>
      </div>

      <div className="settings-section">
        <h2>Export</h2>
        <p className="settings-hint">
          Downloads everything as one JSON file — quests, domains, and log history.
        </p>
        <button type="button" onClick={handleExport}>
          Export data
        </button>
      </div>

      <div className="settings-section">
        <h2>Import</h2>
        <p className="settings-hint">
          Replaces everything currently stored here with a previously exported file. Use this to
          move data between devices — it's a one-way replace, not a merge.
        </p>
        <button type="button" onClick={handleImportClick}>
          Import data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
        {error && <p className="settings-error">{error}</p>}
        {importedAt && !error && <p className="settings-success">Imported at {importedAt}.</p>}
      </div>

      <div className="settings-section">
        <h2>Reset</h2>
        <p className="settings-hint">
          Clears everything stored in this browser and starts over empty. Useful on a new device,
          or to get rid of old data you don't want. This does not undo — export first if you want
          a copy.
        </p>
        <button type="button" onClick={handleReset}>
          Reset data
        </button>
      </div>
    </div>
  )
}
