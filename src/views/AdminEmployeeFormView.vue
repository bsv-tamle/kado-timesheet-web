<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppPageHeader from '../components/AppPageHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
import { ApiError } from '../api/http-client'
import { ADMIN_NAV_ITEMS } from '../constants/navigation'
import { authService } from '../services/auth.service'
import { userService, type UserStatus } from '../services/user.service'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const formRef = ref()
const isSubmitting = ref(false)
const isLoadingDetail = ref(false)
const errorMessage = ref('')

const userId = computed(() => Number(route.params.id || 0))
const isEditMode = computed(() => Number.isFinite(userId.value) && userId.value > 0)
const title = computed(() => (isEditMode.value ? t('app.employeeForm.titleEdit') : t('app.employeeForm.titleCreate')))

const fullName = ref('')
const email = ref('')
const phone = ref('')
const departmentId = ref('')
const positionId = ref('')
const status = ref<UserStatus>('active')
const role = ref<'employee'>('employee')
const avatar = ref('')
const sendInvitationEmail = ref(true)

const fullNameRules = computed(() => [(value: string) => !!value || t('app.required')])
const emailRules = computed(() => [
  (value: string) => !!value || t('app.required'),
  (value: string) => /.+@.+\..+/.test(value) || t('app.emailInvalid'),
])

function toNullableNumber(value: string): number | null {
  const parsed = Number(value)
  if (!value.trim() || !Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

async function loadUserDetail() {
  if (!isEditMode.value) return

  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  try {
    isLoadingDetail.value = true
    errorMessage.value = ''

    const response = await userService.getDetail(session.token, userId.value)
    const user = response.data

    fullName.value = user.full_name
    email.value = user.email
    phone.value = user.phone || ''
    departmentId.value = user.department_id ? String(user.department_id) : ''
    positionId.value = user.position_id ? String(user.position_id) : ''
    status.value = user.status
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      if (error.status === 401) {
        authService.clearSession()
        await router.push('/login')
        return
      }
      if (error.status === 404) {
        await router.push({ name: 'admin-user-list' })
      }
      return
    }
    errorMessage.value = t('app.employeeForm.errors.loadFailed')
  } finally {
    isLoadingDetail.value = false
  }
}

async function onSave() {
  const result = await formRef.value?.validate?.()
  if (!result?.valid) return

  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  const payloadBase = {
    full_name: fullName.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim() || null,
    department_id: toNullableNumber(departmentId.value),
    position_id: toNullableNumber(positionId.value),
    status: status.value,
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''

    if (isEditMode.value) {
      await userService.update(session.token, userId.value, payloadBase)
      await router.push({ name: 'admin-user-list', query: { notice: 'updated' } })
    } else {
      await userService.create(session.token, {
        ...payloadBase,
        role: 'employee',
        send_invitation_email: sendInvitationEmail.value,
      })
      await router.push({ name: 'admin-user-list', query: { notice: 'created' } })
    }
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      if (error.status === 401) {
        authService.clearSession()
        await router.push('/login')
      }
      return
    }
    errorMessage.value = t('app.employeeForm.errors.saveFailed')
  } finally {
    isSubmitting.value = false
  }
}

function goBack() {
  router.push({ name: 'admin-user-list' })
}

onMounted(() => {
  loadUserDetail()
})
</script>

<template>
  <v-main class="shell-bg">
    <div class="app-shell">
      <AppSidebar section-label-key="app.sidebar.admin" :items="ADMIN_NAV_ITEMS" active-key="employees" />

      <main class="main">
        <AppPageHeader :title="title" :subtitle="t('app.employeeForm.subtitle')">
          <template #actions>
            <button class="btn" type="button" @click="goBack">{{ t('app.employeeForm.back') }}</button>
            <button class="btn primary" type="button" :disabled="isSubmitting || isLoadingDetail" @click="onSave">
              {{ isSubmitting ? t('app.employeeForm.saving') : t('app.employeeForm.save') }}
            </button>
          </template>
        </AppPageHeader>

        <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <div class="card">
          <v-form ref="formRef" @submit.prevent="onSave">
            <div class="form-grid">
              <v-text-field
                v-model="fullName"
                :label="t('app.employeeForm.fields.fullName')"
                :rules="fullNameRules"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                :disabled="isLoadingDetail"
              />

              <v-text-field
                v-model="email"
                :label="t('app.employeeForm.fields.email')"
                :rules="emailRules"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                :disabled="isLoadingDetail"
              />

              <v-text-field
                v-model="phone"
                :label="t('app.employeeForm.fields.phone')"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                :disabled="isLoadingDetail"
              />

              <v-text-field
                v-model="departmentId"
                :label="t('app.employeeForm.fields.department')"
                type="number"
                min="1"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                :disabled="isLoadingDetail"
              />

              <v-text-field
                v-model="positionId"
                :label="t('app.employeeForm.fields.position')"
                type="number"
                min="1"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                :disabled="isLoadingDetail"
              />

              <v-select
                v-model="status"
                :label="t('app.employeeForm.fields.status')"
                :items="[
                  { title: t('app.userStatus.active'), value: 'active' },
                  { title: t('app.userStatus.inactive'), value: 'inactive' },
                  { title: t('app.userStatus.locked'), value: 'locked' },
                ]"
                variant="outlined"
                density="comfortable"
                hide-details
                :disabled="isLoadingDetail"
              />

              <v-select
                v-model="role"
                :label="t('app.employeeForm.fields.role')"
                :items="[{ title: 'Employee', value: 'employee' }]"
                variant="outlined"
                density="comfortable"
                hide-details
                disabled
              />

              <v-text-field
                v-model="avatar"
                :label="t('app.employeeForm.fields.avatar')"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                disabled
              />
            </div>

            <v-checkbox
              v-if="!isEditMode"
              v-model="sendInvitationEmail"
              :label="t('app.employeeForm.fields.sendInvitationEmail')"
              hide-details
              class="mt-2"
            />

            <p class="note">{{ t('app.employeeForm.note') }}</p>
          </v-form>
        </div>
      </main>
    </div>
  </v-main>
</template>

<style scoped>
.shell-bg {
  background: #f3f4f6;
}

.app-shell {
  min-height: calc(100vh - 64px);
  display: grid;
  grid-template-columns: 250px 1fr;
}

.main {
  padding: 18px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.mb-4 {
  margin-bottom: 16px;
}

.btn {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 8px 12px;
}

.btn.primary {
  background: #3a78ea;
  color: #fff;
  border-color: #3a78ea;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.note {
  margin-top: 10px;
  color: #6b7280;
  font-size: 14px;
}

@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
