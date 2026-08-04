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
    <button type="button" onClick={handleCopy}>
      {copied ? 'Copied' : 'Copy quest prompt'}
    </button>
  )
}
