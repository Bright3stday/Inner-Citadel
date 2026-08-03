import { useRef, useState } from 'react'
import { exportToFile, importFromFile } from '../../storage/transfer'
import { replaceState } from '../../actions/transferActions'
import type { AppState } from '../../model/types'
import type { Apply } from '../../state/useAppState'

type Props = {
  state: AppState
  apply: Apply
}

export function SettingsView({ state, apply }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [importedAt, setImportedAt] = useState<string | null>(null)

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

  return (
    <div className="view settings-view">
      <h1>Settings</h1>

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
    </div>
  )
}
