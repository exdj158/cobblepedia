import { useKeyboard } from "bagon-hooks"
import { onCleanup } from "solid-js"

type UseVimScrollProps = {
  onScrollToTop: () => void
  onScrollToBottom: () => void
  timeoutMs?: number
  disabled?: boolean
}

export function useVimScroll(props: UseVimScrollProps) {
  let gKeyTimeout: number | null = null
  let gKeyPressed = false

  const clearGKey = () => {
    if (gKeyTimeout !== null) {
      window.clearTimeout(gKeyTimeout)
      gKeyTimeout = null
    }
    gKeyPressed = false
  }

  useKeyboard({
    isDisabled: props.disabled,
    onKeyDown: (event) => {
      if (isEditableTarget(event.target)) {
        return
      }

      if (event.key === "g" || event.key === "G") {
        if (!gKeyPressed) {
          if (event.key === "G") {
            event.preventDefault()
            props.onScrollToBottom()
            return
          }
          gKeyPressed = true
          gKeyTimeout = window.setTimeout(() => {
            clearGKey()
          }, props.timeoutMs ?? 800)
        } else {
          event.preventDefault()
          clearGKey()
          props.onScrollToTop()
        }
        return
      }

      if (gKeyPressed) {
        clearGKey()
      }
    },
  })

  onCleanup(() => {
    clearGKey()
  })
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true
  }

  if (target instanceof HTMLSelectElement) {
    return true
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    return true
  }

  return Boolean(target.closest("[contenteditable='true']"))
}
