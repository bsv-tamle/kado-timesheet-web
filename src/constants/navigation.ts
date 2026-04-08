export interface SidebarNavItem {
  key: string
  labelKey: string
  to?: string
}

export const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
  { key: 'dashboard', labelKey: 'app.menu.dashboard', to: '/admin/dashboard' },
  { key: 'projects', labelKey: 'app.menu.projects', to: '/admin/projects' },
  { key: 'employees', labelKey: 'app.menu.employees', to: '/admin/users' },
  { key: 'assignments', labelKey: 'app.menu.assignments', to: '/admin/assignments' },
  { key: 'reports', labelKey: 'app.menu.reports' },
  { key: 'categories', labelKey: 'app.menu.categories' },
]

export const EMPLOYEE_NAV_ITEMS: SidebarNavItem[] = [
  { key: 'dashboard', labelKey: 'app.menu.dashboard', to: '/employee/dashboard' },
  { key: 'timesheet', labelKey: 'app.menu.timesheet', to: '/employee/timesheets' },
  { key: 'reports', labelKey: 'app.menu.myReports' },
  { key: 'profile', labelKey: 'app.menu.profile' },
]
