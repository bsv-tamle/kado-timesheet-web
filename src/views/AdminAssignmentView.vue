<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPageHeader from '../components/AppPageHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
import { ApiError } from '../api/http-client'
import { ADMIN_NAV_ITEMS } from '../constants/navigation'
import { authService } from '../services/auth.service'
import { assignmentService, type AssignedProject } from '../services/assignment.service'
import { projectService, type Project } from '../services/project.service'
import { userService, type AdminUser } from '../services/user.service'

const { t } = useI18n()

const employees = ref<AdminUser[]>([])
const selectedEmployeeId = ref<number | null>(null)
const employeeKeyword = ref('')
const employeePage = ref(1)
const employeeLastPage = ref(1)
const isLoadingEmployee = ref(false)

const assignedProjects = ref<AssignedProject[]>([])
const isLoadingAssignments = ref(false)

const availableProjects = ref<Project[]>([])
const projectKeyword = ref('')
const projectPage = ref(1)
const projectLastPage = ref(1)
const isLoadingAvailableProjects = ref(false)

const isSubmitting = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const canOperate = computed(() => selectedEmployeeId.value !== null)
const canLoadMoreEmployees = computed(() => employeePage.value < employeeLastPage.value)
const canLoadMoreProjects = computed(() => projectPage.value < projectLastPage.value)

let employeeSearchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchEmployees(reset = false) {
  const session = authService.getSession()
  if (!session?.token) return

  try {
    isLoadingEmployee.value = true
    errorMessage.value = ''

    const nextPage = reset ? 1 : employeePage.value + 1
    const response = await userService.list(session.token, {
      status: 'active',
      keyword: employeeKeyword.value.trim() || undefined,
      page: nextPage,
      per_page: 100,
    })

    const chunk = response.data.data.filter((user) => user.role === 'employee')

    employees.value = reset ? chunk : [...employees.value, ...chunk]
    employeePage.value = response.data.current_page
    employeeLastPage.value = response.data.last_page

    if (!selectedEmployeeId.value && employees.value.length > 0) {
      selectedEmployeeId.value = employees.value[0].id
    }
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.assignment.errors.loadEmployeeFailed')
  } finally {
    isLoadingEmployee.value = false
  }
}

function onEmployeeSearchInput(value: string) {
  employeeKeyword.value = value
  if (employeeSearchTimer) clearTimeout(employeeSearchTimer)
  employeeSearchTimer = setTimeout(() => {
    selectedEmployeeId.value = null
    fetchEmployees(true)
  }, 250)
}

async function fetchAvailableProjects(reset = false) {
  const session = authService.getSession()
  if (!session?.token) return

  try {
    isLoadingAvailableProjects.value = true
    errorMessage.value = ''

    const nextPage = reset ? 1 : projectPage.value + 1
    const response = await projectService.list(session.token, {
      status: 'active',
      keyword: projectKeyword.value.trim() || undefined,
      page: nextPage,
      per_page: 100,
    })

    const assignedIds = new Set(assignedProjects.value.map((item) => item.id))
    const chunk = response.data.data.filter((project) => !assignedIds.has(project.id))

    availableProjects.value = reset ? chunk : [...availableProjects.value, ...chunk]
    projectPage.value = response.data.current_page
    projectLastPage.value = response.data.last_page
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.assignment.errors.loadProjectFailed')
  } finally {
    isLoadingAvailableProjects.value = false
  }
}

async function loadAssignments() {
  const session = authService.getSession()
  const employeeId = selectedEmployeeId.value
  if (!session?.token || !employeeId) {
    assignedProjects.value = []
    return
  }

  try {
    isLoadingAssignments.value = true
    errorMessage.value = ''

    const response = await assignmentService.getByEmployee(session.token, employeeId)
    assignedProjects.value = response.data.assigned_projects
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.assignment.errors.loadAssignmentFailed')
  } finally {
    isLoadingAssignments.value = false
  }
}

watch(selectedEmployeeId, async () => {
  await loadAssignments()
  await fetchAvailableProjects(true)
})

async function onAssign(project: Project) {
  const session = authService.getSession()
  const employeeId = selectedEmployeeId.value
  if (!session?.token || !employeeId) return

  try {
    isSubmitting.value = true
    errorMessage.value = ''
    infoMessage.value = ''

    const response = await assignmentService.assign(session.token, {
      employee_id: employeeId,
      project_ids: [project.id],
    })

    await loadAssignments()
    await fetchAvailableProjects(true)
    infoMessage.value = t('app.assignment.messages.assigned', { count: response.data.assigned_count })
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.assignment.errors.assignFailed')
  } finally {
    isSubmitting.value = false
  }
}

async function onUnassign(project: AssignedProject) {
  const session = authService.getSession()
  const employeeId = selectedEmployeeId.value
  if (!session?.token || !employeeId) return

  try {
    isSubmitting.value = true
    errorMessage.value = ''
    infoMessage.value = ''

    const response = await assignmentService.unassign(session.token, {
      employee_id: employeeId,
      project_ids: [project.id],
    })

    await loadAssignments()
    await fetchAvailableProjects(true)
    infoMessage.value = t('app.assignment.messages.unassigned', { count: response.data.unassigned_count })
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.assignment.errors.unassignFailed')
  } finally {
    isSubmitting.value = false
  }
}

async function onRefresh() {
  await loadAssignments()
  await fetchAvailableProjects(true)
}

onMounted(async () => {
  await fetchEmployees(true)
  await loadAssignments()
  await fetchAvailableProjects(true)
})
</script>

<template>
  <v-main class="shell-bg">
    <div class="app-shell">
      <AppSidebar section-label-key="app.sidebar.admin" :items="ADMIN_NAV_ITEMS" active-key="assignments" />

      <main class="main">
        <AppPageHeader :title="t('app.assignment.title')" :subtitle="t('app.assignment.subtitle')">
          <template #actions>
            <button class="btn" type="button" @click="onRefresh" :disabled="!canOperate || isSubmitting">
              {{ t('app.assignment.refresh') }}
            </button>
          </template>
        </AppPageHeader>

        <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-alert v-if="infoMessage" type="success" variant="tonal" density="comfortable" class="mb-4">
          {{ infoMessage }}
        </v-alert>

        <div class="split">
          <div class="card">
            <div class="card-header">{{ t('app.assignment.selectEmployee') }}</div>
            <div class="card-body">
              <v-autocomplete
                v-model="selectedEmployeeId"
                :label="t('app.assignment.employee')"
                :items="employees.map((item) => ({ title: `${item.full_name} (${item.email})`, value: item.id }))"
                v-model:search="employeeKeyword"
                @update:search="onEmployeeSearchInput"
                variant="outlined"
                density="comfortable"
                hide-details
                :loading="isLoadingEmployee"
                no-filter
                clearable
              />

              <button
                v-if="canLoadMoreEmployees"
                class="btn load-more"
                type="button"
                :disabled="isLoadingEmployee"
                @click="fetchEmployees(false)"
              >
                {{ t('app.assignment.loadMoreEmployees') }}
              </button>

              <div class="note">{{ t('app.assignment.employeeNote') }}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">{{ t('app.assignment.assignedProjects') }}</div>
            <div class="card-body">
              <div v-if="isLoadingAssignments" class="empty">{{ t('app.assignment.loading') }}</div>
              <div v-else-if="assignedProjects.length === 0" class="empty">{{ t('app.assignment.emptyAssigned') }}</div>
              <div v-else class="list">
                <div v-for="project in assignedProjects" :key="project.id" class="list-item">
                  <span>{{ project.project_name }}</span>
                  <button class="btn" type="button" :disabled="isSubmitting" @click="onUnassign(project)">
                    {{ t('app.assignment.unassign') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <div class="card-header">{{ t('app.assignment.availableProjects') }}</div>
          <div class="card-body">
            <div class="toolbar">
              <v-text-field
                v-model="projectKeyword"
                :label="t('app.assignment.searchProject')"
                variant="outlined"
                density="comfortable"
                hide-details
                class="toolbar-field"
              />
              <button class="btn" type="button" :disabled="isLoadingAvailableProjects" @click="fetchAvailableProjects(true)">
                {{ t('app.assignment.search') }}
              </button>
            </div>

            <div v-if="availableProjects.length === 0" class="empty">{{ t('app.assignment.emptyAvailable') }}</div>
            <div v-else class="list">
              <div v-for="project in availableProjects" :key="project.id" class="list-item">
                <span>{{ project.project_code }} / {{ project.project_name }}</span>
                <button class="btn success" type="button" :disabled="!canOperate || isSubmitting" @click="onAssign(project)">
                  {{ t('app.assignment.assign') }}
                </button>
              </div>
            </div>

            <button
              v-if="canLoadMoreProjects"
              class="btn load-more"
              type="button"
              :disabled="isLoadingAvailableProjects"
              @click="fetchAvailableProjects(false)"
            >
              {{ t('app.assignment.loadMoreProjects') }}
            </button>
          </div>
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

.split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.card-header {
  padding: 12px 16px;
  font-weight: 700;
  border-bottom: 1px solid #e5e7eb;
}

.card-body {
  padding: 16px;
}

.toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  margin-bottom: 12px;
}

.toolbar-field {
  min-width: 0;
}

.note {
  margin-top: 10px;
  color: #6b7280;
  font-size: 14px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.empty {
  color: #6b7280;
}

.mt-4 {
  margin-top: 16px;
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

.btn.success {
  background: #1f9d55;
  color: #fff;
  border-color: #1f9d55;
}

.load-more {
  margin-top: 12px;
}

@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .split {
    grid-template-columns: 1fr;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
