<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppPageHeader from '../components/AppPageHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
import { ApiError } from '../api/http-client'
import { ADMIN_NAV_ITEMS } from '../constants/navigation'
import { authService } from '../services/auth.service'
import { userService, type AdminUser, type UserStatus } from '../services/user.service'

const { t } = useI18n()
const router = useRouter()

const keyword = ref('')
const status = ref<'' | UserStatus>('active')
const departmentId = ref('')
const users = ref<AdminUser[]>([])
const page = ref(1)
const perPage = ref(10)
const total = ref(0)
const isLoading = ref(false)
const actionLoadingUserId = ref<number | null>(null)
const errorMessage = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

async function fetchUsers(targetPage = 1) {
  const session = authService.getSession()
  if (!session?.token) {
    await router.push('/login')
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const response = await userService.list(session.token, {
      keyword: keyword.value.trim() || undefined,
      status: status.value,
      department_id: parsePositiveInt(departmentId.value),
      page: targetPage,
      per_page: perPage.value,
    })

    users.value = response.data.data
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
    errorMessage.value = t('app.employeeList.errors.loadFailed')
  } finally {
    isLoading.value = false
  }
}

function onFilter() {
  fetchUsers(1)
}

function resetFilters() {
  keyword.value = ''
  status.value = 'active'
  departmentId.value = ''
  fetchUsers(1)
}

function goCreateEmployee() {
  router.push({ name: 'admin-user-create' })
}

function goEditEmployee(user: AdminUser) {
  router.push({
    name: 'admin-user-edit',
    params: { id: String(user.id) },
  })
}

function nextStatusByAction(currentStatus: UserStatus): UserStatus {
  return currentStatus === 'active' ? 'inactive' : 'active'
}

const onToggleUserStatus = async (user: AdminUser) => {
  const session = authService.getSession()
  if (!session?.token) return

  try {
    actionLoadingUserId.value = user.id
    await userService.updateStatus(session.token, user.id, nextStatusByAction(user.status))
    await fetchUsers(page.value)
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.employeeList.errors.updateStatusFailed')
  } finally {
    actionLoadingUserId.value = null
  }
}
void onToggleUserStatus

async function onResetPassword(user: AdminUser) {
  const session = authService.getSession()
  if (!session?.token) return

  try {
    actionLoadingUserId.value = user.id
    await userService.resetPassword(session.token, user.id, { send_invitation_email: false })
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
      return
    }
    errorMessage.value = t('app.employeeList.errors.resetPasswordFailed')
  } finally {
    actionLoadingUserId.value = null
  }
}

function statusChipColor(value: UserStatus) {
  if (value === 'active') return 'success'
  if (value === 'inactive') return 'warning'
  return 'error'
}

function statusText(value: UserStatus) {
  if (value === 'active') return t('app.userStatus.active')
  if (value === 'inactive') return t('app.userStatus.inactive')
  return t('app.userStatus.locked')
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <v-main class="shell-bg">
    <div class="app-shell">
      <AppSidebar section-label-key="app.sidebar.admin" :items="ADMIN_NAV_ITEMS" active-key="employees" />

      <main class="main">
        <AppPageHeader :title="t('app.employeeList.title')" :subtitle="t('app.employeeList.subtitle')">
          <template #actions>
            <button class="btn" type="button" @click="resetFilters">{{ t('app.employeeList.clearFilter') }}</button>
            <button class="btn primary" type="button" @click="goCreateEmployee">{{ t('app.employeeList.create') }}</button>
          </template>
        </AppPageHeader>

        <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <div class="card mb-4">
          <div class="filters">
            <v-text-field
              v-model="keyword"
              :label="t('app.employeeList.filters.keyword')"
              variant="outlined"
              density="comfortable"
              hide-details
              class="filter-item"
            />

            <v-text-field
              v-model="departmentId"
              :label="t('app.employeeList.filters.department')"
              variant="outlined"
              density="comfortable"
              hide-details
              class="filter-item"
            />

            <v-select
              v-model="status"
              :label="t('app.employeeList.filters.status')"
              :items="[
                { title: t('app.employeeList.filters.all'), value: '' },
                { title: t('app.userStatus.active'), value: 'active' },
                { title: t('app.userStatus.inactive'), value: 'inactive' },
                { title: t('app.userStatus.locked'), value: 'locked' },
              ]"
              variant="outlined"
              density="comfortable"
              hide-details
              class="filter-item"
            />

            <button class="btn" type="button" @click="onFilter">{{ t('app.employeeList.filter') }}</button>
          </div>
        </div>

        <div class="card">
          <v-table>
            <thead>
              <tr>
                <th>{{ t('app.employeeList.columns.fullName') }}</th>
                <th>{{ t('app.employeeList.columns.email') }}</th>
                <th>{{ t('app.employeeList.columns.department') }}</th>
                <th>{{ t('app.employeeList.columns.position') }}</th>
                <th>{{ t('app.employeeList.columns.status') }}</th>
                <th>{{ t('app.employeeList.columns.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="6" class="text-center py-6">{{ t('app.employeeList.loading') }}</td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="6" class="text-center py-6">{{ t('app.employeeList.empty') }}</td>
              </tr>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.full_name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.department_id ?? '-' }}</td>
                <td>{{ user.position_id ?? '-' }}</td>
                <td>
                  <v-chip size="small" :color="statusChipColor(user.status)">
                    {{ statusText(user.status) }}
                  </v-chip>
                </td>
                <td class="action-cell">
                  <button class="link-btn" type="button" @click="goEditEmployee(user)">
                    {{ t('app.common.edit') }}
                  </button>
                  <button
                    class="link-btn warn"
                    type="button"
                    :disabled="actionLoadingUserId === user.id"
                    @click="onResetPassword(user)"
                  >
                    {{ t('app.employeeList.resetPassword') }}
                  </button>
                  <!-- <button
                    class="link-btn"
                    type="button"
                    :disabled="actionLoadingUserId === user.id || user.role === 'admin'"
                    @click="onToggleUserStatus(user)"
                  >
                    {{ user.status === 'active' ? t('app.employeeList.lock') : t('app.employeeList.unlock') }}
                  </button> -->
                </td>
              </tr>
            </tbody>
          </v-table>

          <div class="pagination-row">
            <div class="pagination-meta">{{ t('app.employeeList.total', { count: total }) }}</div>
            <v-pagination
              :length="totalPages"
              :model-value="page"
              density="comfortable"
              @update:model-value="fetchUsers"
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
  grid-template-columns: minmax(220px, 1.6fr) minmax(160px, 1fr) minmax(160px, 1fr) auto;
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
