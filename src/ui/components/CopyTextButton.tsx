import { useState } from 'react'

type Props = {
  label: string
  getText: () => string
}

// Shared copy-to-clipboard-with-feedback button — used by every prompt
// in the copy-paste-only prompt library (see ui/domainPromptBuilders.ts
// and ui/questGeneratorPrompt.ts). No AI calls from this app; the
// point of every one of these buttons is to hand text to whatever AI
// the person already uses, then bring the result back manually.
export function CopyTextButton({ label, getText }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(getText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" onClick={handleCopy}>
      {copied ? 'Copied' : label}
    </button>
  )
}
