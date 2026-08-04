import { useState } from 'react'
import { QUEST_GENERATOR_PROMPT } from '../questGeneratorPrompt'

// Copy-paste only — no AI calls from this app. Paste the copied prompt
// into any capable AI, answer its questions there, then bring the
// resulting JSON back via "Import quest ideas."
export function CopyPromptButton() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(QUEST_GENERATOR_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="copy-prompt">
      <p className="settings-hint">
        Copies a prompt for designing quests in one domain. Paste it into any capable AI, answer
        its questions there, then bring the JSON it gives you back here via "Import quest ideas."
      </p>
      <button type="button" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy quest prompt'}
      </button>
    </div>
  )
}
