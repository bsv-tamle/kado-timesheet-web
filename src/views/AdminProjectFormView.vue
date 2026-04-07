<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppPageHeader from '../components/AppPageHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
import { ApiError } from '../api/http-client'
import { ADMIN_NAV_ITEMS } from '../constants/navigation'
import { authService } from '../services/auth.service'
import { projectService, type ProjectStatus, type SaveProjectPayload } from '../services/project.service'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const formRef = ref()
const isSubmitting = ref(false)
const isLoadingDetail = ref(false)
const errorMessage = ref('')

const projectId = computed(() => Number(route.params.id || 0))
const isEditMode = computed(() => Number.isFinite(projectId.value) && projectId.value > 0)

const projectCode = ref('')
const projectName = ref('')
const status = ref<ProjectStatus>('active')
const billableFlag = ref(true)
const plannedManDays = ref('')
const unitPrice = ref('')
const description = ref('')

const codeRules = computed(() => [(value: string) => !!value || t('app.required')])
const nameRules = computed(() => [(value: string) => !!value || t('app.required')])

const nonNegativeRules = computed(() => [
  (value: string) => {
    if (!value.trim()) return true
    const parsed = Number(value)
    return (!Number.isNaN(parsed) && parsed >= 0) || t('app.projectForm.errors.nonNegative')
  },
])

const title = computed(() =>
  isEditMode.value ? t('app.projectForm.titleEdit') : t('app.projectForm.titleCreate'),
)

async function onSave() {
  const result = await formRef.value?.validate?.()
  if (!result?.valid) return

  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  const payload: SaveProjectPayload = {
    project_code: projectCode.value.trim(),
    project_name: projectName.value.trim(),
    status: status.value,
    billable_flag: billableFlag.value,
    description: description.value.trim(),
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''

    if (isEditMode.value) {
      await projectService.update(session.token, projectId.value, payload)
      await router.push({ name: 'admin-project-list', query: { notice: 'updated' } })
    } else {
      await projectService.create(session.token, payload)
      await router.push({ name: 'admin-project-list', query: { notice: 'created' } })
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

    errorMessage.value = t('app.projectForm.errors.saveFailed')
  } finally {
    isSubmitting.value = false
  }
}

function goBack() {
  router.push({ name: 'admin-project-list' })
}

async function loadProjectDetail() {
  if (!isEditMode.value) return

  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  try {
    isLoadingDetail.value = true
    errorMessage.value = ''

    const response = await projectService.getDetail(session.token, projectId.value)
    const project = response.data

    projectCode.value = project.project_code
    projectName.value = project.project_name
    status.value = project.status
    billableFlag.value = Boolean(project.billable_flag)
    description.value = project.description ?? ''
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      if (error.status === 401) {
        authService.clearSession()
        await router.push('/login')
        return
      }
      if (error.status === 404) {
        await router.push({ name: 'admin-project-list' })
      }
      return
    }

    errorMessage.value = t('app.projectForm.errors.loadFailed')
  } finally {
    isLoadingDetail.value = false
  }
}

onMounted(() => {
  loadProjectDetail()
})
</script>

<template>
  <v-main class="shell-bg">
    <div class="app-shell">
      <AppSidebar section-label-key="app.sidebar.admin" :items="ADMIN_NAV_ITEMS" active-key="projects" />

      <main class="main">
        <AppPageHeader :title="title" :subtitle="t('app.projectForm.subtitle')">
          <template #actions>
            <button class="btn" type="button" @click="goBack">{{ t('app.projectForm.back') }}</button>
            <button class="btn primary" type="button" :disabled="isSubmitting || isLoadingDetail" @click="onSave">
              {{ isSubmitting ? t('app.projectForm.saving') : t('app.projectForm.save') }}
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
                v-model="projectCode"
                :label="t('app.projectForm.fields.projectCode')"
                variant="outlined"
                density="comfortable"
                :rules="codeRules"
                hide-details="auto"
                :disabled="isLoadingDetail"
              />

              <v-text-field
                v-model="projectName"
                :label="t('app.projectForm.fields.projectName')"
                variant="outlined"
                density="comfortable"
                :rules="nameRules"
                hide-details="auto"
                :disabled="isLoadingDetail"
              />

              <v-select
                v-model="status"
                :label="t('app.projectForm.fields.status')"
                :items="[
                  { title: t('app.project.status.active'), value: 'active' },
                  { title: t('app.project.status.inactive'), value: 'inactive' },
                  { title: t('app.project.status.archived'), value: 'archived' },
                ]"
                variant="outlined"
                density="comfortable"
                hide-details
                :disabled="isLoadingDetail"
              />

              <v-select
                v-model="billableFlag"
                :label="t('app.projectForm.fields.billable')"
                :items="[
                  { title: t('app.project.billable.yes'), value: true },
                  { title: t('app.project.billable.no'), value: false },
                ]"
                variant="outlined"
                density="comfortable"
                hide-details
                :disabled="isLoadingDetail"
              />

              <v-text-field
                v-model="plannedManDays"
                :label="t('app.projectForm.fields.plannedManDays')"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                :rules="nonNegativeRules"
                hide-details="auto"
                :disabled="isLoadingDetail"
              />

              <v-text-field
                v-model="unitPrice"
                :label="t('app.projectForm.fields.unitPrice')"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                :rules="nonNegativeRules"
                hide-details="auto"
                :disabled="isLoadingDetail"
              />
            </div>

            <v-textarea
              v-model="description"
              :label="t('app.projectForm.fields.description')"
              rows="4"
              class="mt-4"
              variant="outlined"
              density="comfortable"
              :disabled="isLoadingDetail"
            />

            <p class="note">
              {{ t('app.projectForm.note') }}
            </p>
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
