<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ApiError } from '../api/http-client'
import { authService } from '../services/auth.service'

const { t, locale } = useI18n()
const router = useRouter()
const formRef = ref()
const showPassword = ref(false)
const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const isSubmitting = ref(false)
const loginError = ref('')

const emailRules = computed(() => [
  (value: string) => !!value || t('app.required'),
  (value: string) => /.+@.+\..+/.test(value) || t('app.emailInvalid'),
])

const passwordRules = computed(() => [(value: string) => !!value || t('app.required')])

watch(locale, async () => {
  // Re-validate to refresh error text when language changes
  await nextTick()
  formRef.value?.validate?.()
})

async function onSubmit() {
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  try {
    isSubmitting.value = true
    loginError.value = ''

    const payload = await authService.login({
      email: email.value,
      password: password.value,
    })

    const token = payload.data?.access_token
    const user = payload.data?.user

    if (!token || !user) {
      loginError.value = t('app.loginFailed')
      return
    }

    const storage = rememberMe.value ? localStorage : sessionStorage
    storage.setItem('kado_access_token', token)
    storage.setItem('kado_user', JSON.stringify(user))

    // Clear stale auth in the opposite storage
    if (rememberMe.value) {
      sessionStorage.removeItem('kado_access_token')
      sessionStorage.removeItem('kado_user')
    } else {
      localStorage.removeItem('kado_access_token')
      localStorage.removeItem('kado_user')
    }

    await router.push(user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard')
  } catch (error) {
    if (error instanceof ApiError) {
      loginError.value = error.message || t('app.loginFailed')
      return
    }

    loginError.value = t('app.loginFailed')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <v-main class="login-page">
    <v-container class="fill-height d-flex align-center justify-center py-10">
      <v-card class="auth-card" rounded="lg" elevation="8">
        <v-card-text class="pa-8 pa-sm-10">
          <h1 class="auth-title">{{ t('app.loginTitle') }}</h1>
          <p class="auth-subtitle">{{ t('app.loginSubtitle') }}</p>

          <v-form ref="formRef" @submit.prevent="onSubmit">
            <div class="stack">
              <v-alert
                v-if="loginError"
                type="error"
                variant="tonal"
                density="comfortable"
              >
                {{ loginError }}
              </v-alert>

              <div>
                <label class="field-label">{{ t('app.email') }}</label>
                <v-text-field
                  v-model="email"
                  variant="outlined"
                  density="comfortable"
                  :rules="emailRules"
                  autocomplete="email"
                  hide-details="auto"
                  class="field-input"
                />
              </div>

              <div>
                <label class="field-label">{{ t('app.password') }}</label>
                <v-text-field
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  density="comfortable"
                  :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  :rules="passwordRules"
                  autocomplete="current-password"
                  hide-details="auto"
                  class="field-input"
                  @click:append-inner="showPassword = !showPassword"
                />
              </div>

              <v-checkbox
                v-model="rememberMe"
                :label="t('app.rememberMe')"
                hide-details
                density="comfortable"
                class="remember-checkbox"
              />

              <v-btn type="submit" color="primary" size="large" block :loading="isSubmitting">
                {{ isSubmitting ? t('app.loggingIn') : t('app.loginButton') }}
              </v-btn>

              <v-btn variant="text" color="primary" class="forgot-link" size="small">
                {{ t('app.forgotPassword') }}
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<style scoped>
.login-page {
  background: linear-gradient(180deg, #edf3ff 0%, #f7f9fd 100%);
}

.auth-card {
  width: 100%;
  max-width: 520px;
}

.auth-title {
  font-size: 30px;
  line-height: 1.2;
  margin-bottom: 8px;
}

.auth-subtitle {
  color: #5f6368;
  margin-bottom: 22px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
}

.remember-checkbox {
  margin-top: -4px;
}

.forgot-link {
  width: fit-content;
  padding-inline: 0;
}
</style>
