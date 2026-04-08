<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppPageHeader from '../components/AppPageHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
import { ApiError } from '../api/http-client'
import { EMPLOYEE_NAV_ITEMS } from '../constants/navigation'
import { authService } from '../services/auth.service'
import {
  timesheetService,
  type MyProject,
  type SaveTimesheetDetailInput,
  type TimesheetEntry,
} from '../services/timesheet.service'

const { t } = useI18n()
const router = useRouter()

const selectedMonth = ref(formatMonth(new Date()))
const entries = ref<TimesheetEntry[]>([])
const totalHoursMonth = ref(0)
const myProjects = ref<MyProject[]>([])

const isLoading = ref(false)
const isLoadingProjects = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isFormOpen = ref(false)
const isEditMode = ref(false)
const editingEntryId = ref<number | null>(null)
const formWorkDate = ref(formatDate(new Date()))
const formDetails = ref<Array<{ project_id: number | null; hours_worked: string; note: string }>>([])

const canSubmitForm = computed(() => formDetails.value.length > 0)

function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatMonth(date: Date) {
  return formatDate(date).slice(0, 7)
}

function openCreateForm() {
  isEditMode.value = false
  editingEntryId.value = null
  formWorkDate.value = formatDate(new Date())
  formDetails.value = [{ project_id: null, hours_worked: '', note: '' }]
  isFormOpen.value = true
  errorMessage.value = ''
}

function openEditForm(entry: TimesheetEntry) {
  isEditMode.value = true
  editingEntryId.value = entry.entry_id
  formWorkDate.value = entry.work_date
  formDetails.value = entry.details.map((detail) => ({
    project_id: detail.project_id,
    hours_worked: String(detail.hours_worked),
    note: detail.note ?? '',
  }))
  isFormOpen.value = true
  errorMessage.value = ''
}

function closeForm() {
  isFormOpen.value = false
}

function addDetailRow() {
  formDetails.value.push({
    project_id: null,
    hours_worked: '',
    note: '',
  })
}

function removeDetailRow(index: number) {
  formDetails.value.splice(index, 1)
}

function projectItemsForRow(index: number) {
  const selectedByOtherRows = new Set(
    formDetails.value
      .filter((_, rowIndex) => rowIndex !== index)
      .map((detail) => detail.project_id)
      .filter((value): value is number => Number.isInteger(value) && (value as number) > 0),
  )

  const currentValue = formDetails.value[index]?.project_id

  return myProjects.value
    .filter((project) => project.id === currentValue || !selectedByOtherRows.has(project.id))
    .map((project) => ({
      title: `${project.project_code} / ${project.project_name}`,
      value: project.id,
    }))
}

async function fetchTimesheets() {
  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const response = await timesheetService.list(session.token, selectedMonth.value)
    entries.value = response.data.entries
    totalHoursMonth.value = response.data.summary.total_hours_month
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.timesheet.errors.loadFailed')
  } finally {
    isLoading.value = false
  }
}

async function fetchMyProjects() {
  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  try {
    isLoadingProjects.value = true
    const response = await timesheetService.myProjects(session.token)
    myProjects.value = response.data
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.timesheet.errors.loadProjectFailed')
  } finally {
    isLoadingProjects.value = false
  }
}

function normalizeDetails(): SaveTimesheetDetailInput[] | null {
  const normalized: SaveTimesheetDetailInput[] = []

  for (const detail of formDetails.value) {
    const projectId = detail.project_id
    const hoursWorked = Number(detail.hours_worked)
    const note = detail.note.trim()

    if (!Number.isInteger(projectId) || (projectId as number) <= 0) return null
    if (!Number.isFinite(hoursWorked) || hoursWorked < 0) return null

    normalized.push({
      project_id: projectId as number,
      hours_worked: hoursWorked,
      note: note || undefined,
    })
  }

  return normalized
}

async function onSubmitForm() {
  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  const details = normalizeDetails()
  if (!formWorkDate.value || !details || details.length === 0) {
    errorMessage.value = t('app.timesheet.errors.invalidForm')
    return
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const payload = {
      work_date: formWorkDate.value,
      details,
    }

    if (isEditMode.value && editingEntryId.value) {
      await timesheetService.update(session.token, editingEntryId.value, payload)
      successMessage.value = t('app.timesheet.messages.updated')
    } else {
      await timesheetService.create(session.token, payload)
      successMessage.value = t('app.timesheet.messages.created')
    }

    closeForm()
    await fetchTimesheets()
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.timesheet.errors.saveFailed')
  } finally {
    isSubmitting.value = false
  }
}

async function onDeleteDetail(detailId: number) {
  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  const accepted = window.confirm(t('app.timesheet.confirmDeleteDetail'))
  if (!accepted) return

  try {
    isSubmitting.value = true
    errorMessage.value = ''
    successMessage.value = ''

    await timesheetService.deleteDetail(session.token, detailId)
    successMessage.value = t('app.timesheet.messages.deleted')
    await fetchTimesheets()
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.timesheet.errors.deleteFailed')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchMyProjects()
  fetchTimesheets()
})
</script>

<template>
  <v-main class="shell-bg">
    <div class="app-shell">
      <AppSidebar section-label-key="app.sidebar.employee" :items="EMPLOYEE_NAV_ITEMS" active-key="timesheet" />

      <main class="main">
        <AppPageHeader :title="t('app.timesheet.title')" :subtitle="t('app.timesheet.subtitle')">
          <template #actions>
            <input v-model="selectedMonth" type="month" class="month-input" @change="fetchTimesheets" />
            <button class="btn" type="button" :disabled="isLoading" @click="fetchTimesheets">
              {{ t('app.timesheet.refresh') }}
            </button>
            <button class="btn primary" type="button" @click="openCreateForm">
              {{ t('app.timesheet.createEntry') }}
            </button>
          </template>
        </AppPageHeader>

        <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-alert v-if="successMessage" type="success" variant="tonal" density="comfortable" class="mb-4">
          {{ successMessage }}
        </v-alert>

        <div class="card summary-card mb-4">
          <div class="summary-title">{{ t('app.timesheet.summaryTitle') }}</div>
          <div class="summary-hours">{{ totalHoursMonth }}h</div>
        </div>

        <div class="card">
          <div class="card-header">{{ t('app.timesheet.entryListTitle') }}</div>
          <div class="card-body entry-list-body">
            <div v-if="isLoading" class="empty">{{ t('app.timesheet.loading') }}</div>
            <div v-else-if="entries.length === 0" class="empty">{{ t('app.timesheet.empty') }}</div>
            <div v-else class="entry-list">
              <section v-for="entry in entries" :key="entry.entry_id" class="entry-item">
                <div class="entry-header">
                  <div>
                    <strong>{{ t('app.timesheet.entryDate', { date: entry.work_date }) }}</strong>
                    <div class="small">{{ t('app.timesheet.entryTotal', { hours: entry.total_hours }) }}</div>
                  </div>
                  <div class="entry-actions">
                    <button class="btn" type="button" @click="openEditForm(entry)">
                      {{ t('app.common.edit') }}
                    </button>
                  </div>
                </div>

                <v-table class="detail-table">
                  <colgroup>
                    <col class="col-project" />
                    <col class="col-hours" />
                    <col class="col-note" />
                    <col class="col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>{{ t('app.timesheet.columns.project') }}</th>
                      <th>{{ t('app.timesheet.columns.hours') }}</th>
                      <th>{{ t('app.timesheet.columns.note') }}</th>
                      <th>{{ t('app.timesheet.columns.actions') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="detail in entry.details" :key="detail.detail_id">
                      <td class="project-cell">{{ detail.project_code }} / {{ detail.project_name }}</td>
                      <td>{{ detail.hours_worked }}</td>
                      <td>{{ detail.note || '-' }}</td>
                      <td>
                        <button class="link-btn warn" type="button" :disabled="isSubmitting" @click="onDeleteDetail(detail.detail_id)">
                          {{ t('app.timesheet.deleteDetail') }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </section>
            </div>
          </div>
        </div>

        <v-dialog v-model="isFormOpen" max-width="980">
          <div class="card dialog-card">
            <div class="card-header">
              {{ isEditMode ? t('app.timesheet.editEntry') : t('app.timesheet.createEntry') }}
            </div>
            <div class="card-body">
              <v-text-field
                v-model="formWorkDate"
                type="date"
                :label="t('app.timesheet.form.workDate')"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-4"
              />

              <div class="detail-rows">
                <div v-for="(detail, index) in formDetails" :key="index" class="detail-row">
                  <v-select
                    v-model="detail.project_id"
                    :items="projectItemsForRow(index)"
                    :label="t('app.timesheet.form.projectId')"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    :loading="isLoadingProjects"
                  />
                  <v-text-field
                    v-model="detail.hours_worked"
                    :label="t('app.timesheet.form.hours')"
                    type="number"
                    min="0"
                    step="0.25"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                  <v-text-field
                    v-model="detail.note"
                    :label="t('app.timesheet.form.note')"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                  <button class="btn danger" type="button" :disabled="formDetails.length <= 1" @click="removeDetailRow(index)">
                    {{ t('app.timesheet.removeRow') }}
                  </button>
                </div>
              </div>

              <div class="dialog-actions mt-4">
                <button class="btn" type="button" @click="addDetailRow">{{ t('app.timesheet.addRow') }}</button>
                <div class="spacer" />
                <button class="btn" type="button" @click="closeForm">{{ t('app.timesheet.cancel') }}</button>
                <button class="btn primary" type="button" :disabled="!canSubmitForm || isSubmitting" @click="onSubmitForm">
                  {{ isSubmitting ? t('app.timesheet.submitting') : t('app.timesheet.submitEntry') }}
                </button>
              </div>
            </div>
          </div>
        </v-dialog>
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

.month-input {
  width: 170px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #111827;
  padding: 7px 10px;
  height: 38px;
  line-height: 1.2;
}

.card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.summary-card {
  padding: 16px;
}

.card-header {
  padding: 12px 16px;
  font-weight: 700;
  border-bottom: 1px solid #e5e7eb;
}

.card-body {
  padding: 16px;
}

.entry-list-body {
  max-height: 62vh;
  overflow-y: auto;
}

.summary-title {
  color: #6b7280;
  margin-bottom: 6px;
}

.summary-hours {
  font-size: 28px;
  font-weight: 700;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.entry-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
}

.entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.entry-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.small {
  color: #6b7280;
  font-size: 14px;
}

.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) minmax(220px, 2fr) auto;
  gap: 10px;
  align-items: center;
}

.dialog-card {
  overflow: hidden;
}

.dialog-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spacer {
  flex: 1;
}

.empty {
  color: #6b7280;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
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

.btn.danger {
  border-color: #fbcfe8;
  color: #be185d;
}

.link-btn {
  background: none;
  border: none;
  color: #2f66c8;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.link-btn.warn {
  color: #b45309;
}

.detail-table :deep(table) {
  table-layout: fixed;
  width: 100%;
}

.detail-table :deep(col.col-project) {
  width: 58%;
}

.detail-table :deep(col.col-hours) {
  width: 12%;
}

.detail-table :deep(col.col-note) {
  width: 18%;
}

.detail-table :deep(col.col-actions) {
  width: 12%;
}

.project-cell {
  overflow-wrap: anywhere;
}

@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .detail-table :deep(col.col-project),
  .detail-table :deep(col.col-hours),
  .detail-table :deep(col.col-note),
  .detail-table :deep(col.col-actions) {
    width: auto;
  }

  .detail-row {
    grid-template-columns: 1fr;
  }

  .month-input {
    width: 100%;
  }
}
</style>
