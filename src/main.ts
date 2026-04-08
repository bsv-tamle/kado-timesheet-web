import { createApp } from 'vue'
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue'
import { AUTH_UNAUTHORIZED_EVENT } from './api/http-client'
import vuetify from './plugins/vuetify'
import { i18n } from './plugins/i18n'
import router from './router'
import { authService } from './services/auth.service'
import './style.css'

window.addEventListener(AUTH_UNAUTHORIZED_EVENT, async () => {
  authService.clearSession()
  if (router.currentRoute.value.path !== '/login') {
    await router.push('/login')
  }
})

createApp(App).use(vuetify).use(i18n).use(router).mount('#app')
