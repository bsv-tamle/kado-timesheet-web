import { ref } from 'vue'
import { useAutoDismissMessage } from './useAutoDismissMessage'

export function useFlashMessages() {
  const errorMessage = ref('')
  const successMessage = ref('')

  useAutoDismissMessage(errorMessage)
  useAutoDismissMessage(successMessage)

  return { errorMessage, successMessage }
}
