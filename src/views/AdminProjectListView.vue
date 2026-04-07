<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppPageHeader from '../components/AppPageHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
import { ApiError } from '../api/http-client'
import { ADMIN_NAV_ITEMS } from '../constants/navigation'
import { authService } from '../services/auth.service'
import { projectService, type Project, type ProjectStatus } from '../services/project.service'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const keyword = ref('')
const status = ref<'' | ProjectStatus>('')
const billableFlag = ref<'' | 'true' | 'false'>('')
const projects = ref<Project[]>([])
const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const isLoading = ref(false)
const isUpdatingStatus = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))

async function fetchProjects(targetPage = 1) {
  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const response = await projectService.list(session.token, {
      keyword: keyword.value.trim() || undefined,
      status: status.value,
      billable_flag: billableFlag.value,
      page: targetPage,
      per_page: perPage.value,
    })

    projects.value = response.data.data
    page.value = response.data.current_page
    total.value = response.data.total
    perPage.value = response.data.per_page
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      if (error.status === 401) {
        authService.clearSession()
        await router.push('/login')
      }
      return
    }

    errorMessage.value = t('app.projectList.errors.loadFailed')
  } finally {
    isLoading.value = false
  }
}

function onFilter() {
  fetchProjects(1)
}

function resetFilters() {
  keyword.value = ''
  status.value = ''
  billableFlag.value = ''
  fetchProjects(1)
}

function goCreateProject() {
  router.push({ name: 'admin-project-create' })
}

function goEditProject(project: Project) {
  router.push({
    name: 'admin-project-edit',
    params: { id: String(project.id) },
  })
}

async function onToggleArchive(project: Project) {
  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  const nextStatus: ProjectStatus = project.status === 'archived' ? 'active' : 'archived'

  try {
    isUpdatingStatus.value = project.id
    successMessage.value = ''
    await projectService.updateStatus(session.token, project.id, nextStatus)
    await fetchProjects(page.value)
    successMessage.value =
      nextStatus === 'archived' ? t('app.projectList.messages.archived') : t('app.projectList.messages.restored')
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.projectList.errors.updateStatusFailed')
  } finally {
    isUpdatingStatus.value = null
  }
}

async function resolveNoticeFromQuery() {
  const notice = typeof route.query.notice === 'string' ? route.query.notice : ''

  if (notice === 'created') {
    successMessage.value = t('app.projectForm.successCreated')
  } else if (notice === 'updated') {
    successMessage.value = t('app.projectForm.successUpdated')
  } else {
    return
  }

  const nextQuery = { ...route.query }
  delete nextQuery.notice
  await router.replace({ query: nextQuery })
}

function statusChipColor(value: ProjectStatus) {
  if (value === 'active') return 'success'
  if (value === 'inactive') return 'warning'
  return 'default'
}

function statusText(value: ProjectStatus) {
  if (value === 'active') return t('app.project.status.active')
  if (value === 'inactive') return t('app.project.status.inactive')
  return t('app.project.status.archived')
}

onMounted(() => {
  resolveNoticeFromQuery()
  fetchProjects()
})
</script>

<template>
  <v-main class="shell-bg">
    <div class="app-shell">
      <AppSidebar section-label-key="app.sidebar.admin" :items="ADMIN_NAV_ITEMS" active-key="projects" />

      <main class="main">
        <AppPageHeader :title="t('app.projectList.title')" :subtitle="t('app.projectList.subtitle')">
          <template #actions>
            <button class="btn" type="button" @click="resetFilters">{{ t('app.projectList.clearFilter') }}</button>
            <button class="btn primary" type="button" @click="goCreateProject">{{ t('app.projectList.create') }}</button>
          </template>
        </AppPageHeader>

        <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-alert v-if="successMessage" type="success" variant="tonal" density="comfortable" class="mb-4">
          {{ successMessage }}
        </v-alert>

        <div class="card mb-4">
          <div class="filters">
            <v-text-field
              v-model="keyword"
              :label="t('app.projectList.filters.keyword')"
              variant="outlined"
              density="comfortable"
              hide-details
              class="filter-item"
            />

            <v-select
              v-model="status"
              :label="t('app.projectList.filters.status')"
              :items="[
                { title: t('app.projectList.filters.all'), value: '' },
                { title: t('app.project.status.active'), value: 'active' },
                { title: t('app.project.status.inactive'), value: 'inactive' },
                { title: t('app.project.status.archived'), value: 'archived' },
              ]"
              variant="outlined"
              density="comfortable"
              hide-details
              class="filter-item"
            />

            <v-select
              v-model="billableFlag"
              :label="t('app.projectList.filters.billable')"
              :items="[
                { title: t('app.projectList.filters.all'), value: '' },
                { title: t('app.project.billable.yes'), value: 'true' },
                { title: t('app.project.billable.no'), value: 'false' },
              ]"
              variant="outlined"
              density="comfortable"
              hide-details
              class="filter-item"
            />

            <button class="btn" type="button" @click="onFilter">{{ t('app.projectList.filter') }}</button>
          </div>
        </div>

        <div class="card">
          <v-table>
            <thead>
              <tr>
                <th>{{ t('app.project.columns.code') }}</th>
                <th>{{ t('app.project.columns.name') }}</th>
                <th>{{ t('app.project.columns.status') }}</th>
                <th>{{ t('app.project.columns.billable') }}</th>
                <th>{{ t('app.project.columns.updated') }}</th>
                <th>{{ t('app.project.columns.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="6" class="text-center py-6">{{ t('app.projectList.loading') }}</td>
              </tr>
              <tr v-else-if="projects.length === 0">
                <td colspan="6" class="text-center py-6">{{ t('app.projectList.empty') }}</td>
              </tr>
              <tr v-for="project in projects" :key="project.id">
                <td>{{ project.project_code }}</td>
                <td>{{ project.project_name }}</td>
                <td>
                  <v-chip size="small" :color="statusChipColor(project.status)">
                    {{ statusText(project.status) }}
                  </v-chip>
                </td>
                <td>{{ project.billable_flag ? t('app.project.billable.yes') : t('app.project.billable.no') }}</td>
                <td>{{ project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '-' }}</td>
                <td class="action-cell">
                  <button class="link-btn" type="button" @click="goEditProject(project)">{{ t('app.common.edit') }}</button>
                  <button
                    class="link-btn warn"
                    type="button"
                    :disabled="isUpdatingStatus === project.id"
                    @click="onToggleArchive(project)"
                  >
                    {{ project.status === 'archived' ? t('app.projectList.restore') : t('app.projectList.archive') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </v-table>

          <div class="pagination-row">
            <div class="pagination-meta">{{ t('app.projectList.total', { count: total }) }}</div>
            <v-pagination
              :length="totalPages"
              :model-value="page"
              density="comfortable"
              @update:model-value="fetchProjects"
            />
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

.filters {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(220px, 1.5fr) repeat(2, minmax(180px, 1fr)) auto;
  align-items: center;
}

.filter-item {
  min-width: 0;
}

.action-cell {
  display: flex;
  align-items: center;
  gap: 8px;
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

.pagination-row {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.pagination-meta {
  color: #6b7280;
}

@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .pagination-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
