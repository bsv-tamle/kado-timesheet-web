<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppSidebar from '../components/AppSidebar.vue'
import AppPageHeader from '../components/AppPageHeader.vue'

const { t } = useI18n()

const adminNavItems = [
  { key: 'dashboard', labelKey: 'app.menu.dashboard' },
  { key: 'projects', labelKey: 'app.menu.projects' },
  { key: 'employees', labelKey: 'app.menu.employees' },
  { key: 'assignments', labelKey: 'app.menu.assignments' },
  { key: 'reports', labelKey: 'app.menu.reports' },
  { key: 'categories', labelKey: 'app.menu.categories' },
]
</script>

<template>
  <v-main class="shell-bg">
    <div class="app-shell">
      <AppSidebar section-label-key="app.sidebar.admin" :items="adminNavItems" active-key="dashboard" />

      <main class="main">
        <AppPageHeader
          :title="t('app.adminDashboard.title')"
          :subtitle="t('app.adminDashboard.subtitle')"
        >
          <template #actions>
            <button class="btn">{{ t('app.adminDashboard.monthLabel') }}</button>
            <button class="btn primary">{{ t('app.common.export') }}</button>
          </template>
        </AppPageHeader>

        <div class="grid-4">
          <div class="card"><div class="stat-label">{{ t('app.adminDashboard.activeEmployees') }}</div><div class="stat-value">42</div></div>
          <div class="card"><div class="stat-label">{{ t('app.adminDashboard.activeProjects') }}</div><div class="stat-value">18</div></div>
          <div class="card"><div class="stat-label">{{ t('app.adminDashboard.pendingTimesheet') }}</div><div class="stat-value">7</div></div>
          <div class="card"><div class="stat-label">{{ t('app.adminDashboard.totalMonthHours') }}</div><div class="stat-value">3248h</div></div>
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

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.stat-label {
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
