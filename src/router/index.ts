import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import EmployeeDashboardView from '../views/EmployeeDashboardView.vue'
import AdminProjectListView from '../views/AdminProjectListView.vue'
import AdminProjectFormView from '../views/AdminProjectFormView.vue'
import AdminEmployeeListView from '../views/AdminEmployeeListView.vue'
import AdminEmployeeFormView from '../views/AdminEmployeeFormView.vue'
import AdminAssignmentView from '../views/AdminAssignmentView.vue'
import EmployeeTimesheetView from '../views/EmployeeTimesheetView.vue'
import { authService, type UserRole } from '../services/auth.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/dashboard',
      redirect: () => {
        const session = authService.getSession()
        if (!session) return '/login'
        return authService.getHomePathByRole(session.user.role)
      },
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/admin/projects',
      name: 'admin-project-list',
      component: AdminProjectListView,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/admin/projects/new',
      name: 'admin-project-create',
      component: AdminProjectFormView,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/admin/projects/:id/edit',
      name: 'admin-project-edit',
      component: AdminProjectFormView,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/admin/users',
      name: 'admin-user-list',
      component: AdminEmployeeListView,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/admin/users/new',
      name: 'admin-user-create',
      component: AdminEmployeeFormView,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/admin/users/:id/edit',
      name: 'admin-user-edit',
      component: AdminEmployeeFormView,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/admin/assignments',
      name: 'admin-assignment',
      component: AdminAssignmentView,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/employee/dashboard',
      name: 'employee-dashboard',
      component: EmployeeDashboardView,
      meta: { requiresAuth: true, roles: ['employee'] },
    },
    {
      path: '/employee/timesheets',
      name: 'employee-timesheet',
      component: EmployeeTimesheetView,
      meta: { requiresAuth: true, roles: ['employee'] },
    },
  ],
})

router.beforeEach((to) => {
  const session = authService.getSession()
  const isAuthenticated = Boolean(session?.token && session?.user)
  const currentRole = session?.user?.role

  if (to.meta.guestOnly && isAuthenticated && currentRole) {
    return authService.getHomePathByRole(currentRole)
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }

  const allowedRoles = to.meta.roles as UserRole[] | undefined
  if (to.meta.requiresAuth && allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    return authService.getHomePathByRole(currentRole)
  }

  return true
})

export default router
