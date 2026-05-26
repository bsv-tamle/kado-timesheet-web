import { onUnmounted, watch, type Ref } from 'vue'

const DEFAULT_DISMISS_MS = 5000

export function useAutoDismissMessage(message: Ref<string>, dismissMs = DEFAULT_DISMISS_MS) {
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  watch(message, (value) => {
    clearTimer()
    if (!value) return

    timer = setTimeout(() => {
      message.value = ''
      timer = null
    }, dismissMs)
  })

  onUnmounted(clearTimer)
}
