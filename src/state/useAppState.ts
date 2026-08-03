import { useEffect, useRef, useState } from 'react'
import * as storage from '../storage/storage'
import type { AppState } from '../model/types'

export type Apply = <Payload>(
  action: (state: AppState, payload: Payload) => AppState,
  payload: Payload,
) => void

/**
 * The one hook: holds state, applies actions, persists the result.
 * Contains no rules of its own — every action module is imported and
 * called by name. See docs/architecture.md §4.
 */
export function useAppState() {
  const [state, setState] = useState<AppState>(() => storage.load())
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timeout = setTimeout(() => storage.save(state), 300)
    return () => clearTimeout(timeout)
  }, [state])

  const apply: Apply = (action, payload) => {
    setState((prev) => action(prev, payload))
  }

  return { state, apply }
}
