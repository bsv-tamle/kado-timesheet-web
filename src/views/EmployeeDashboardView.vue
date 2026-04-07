<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppSidebar from '../components/AppSidebar.vue'
import DashboardHeader from '../components/DashboardHeader.vue'

const { t } = useI18n()

const employeeNavItems = [
  { key: 'dashboard', labelKey: 'app.menu.dashboard' },
  { key: 'timesheet', labelKey: 'app.menu.timesheet' },
  { key: 'reports', labelKey: 'app.menu.myReports' },
  { key: 'profile', labelKey: 'app.menu.profile' },
]
</script>

<template>
  <v-main class="shell-bg">
    <div class="app-shell">
      <AppSidebar section-label-key="app.sidebar.employee" :items="employeeNavItems" active-key="dashboard" />

      <main class="main">
        <DashboardHeader
          :title="t('app.employeeDashboard.title')"
          :subtitle="t('app.employeeDashboard.subtitle')"
        >
          <template #actions>
            <button class="btn primary">{{ t('app.employeeDashboard.enterTimesheet') }}</button>
          </template>
        </DashboardHeader>

        <div class="grid-3">
          <div class="card"><div class="stat-label">{{ t('app.employeeDashboard.totalMonthHours') }}</div><div class="stat-value">146.5h</div></div>
          <div class="card"><div class="stat-label">{{ t('app.employeeDashboard.loggedDays') }}</div><div class="stat-value">19</div></div>
          <div class="card"><div class="stat-label">{{ t('app.employeeDashboard.activeProjects') }}</div><div class="stat-value">3</div></div>
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

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

  .grid-3 {
    grid-template-columns: 1fr;
  }
}
</style>
