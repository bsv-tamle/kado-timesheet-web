import { createApp } from 'vue'
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { i18n } from './plugins/i18n'
import router from './router'
import './style.css'

createApp(App).use(vuetify).use(i18n).use(router).mount('#app')
