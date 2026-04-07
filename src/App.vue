<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import { authService } from './services/auth.service'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => (route.name === 'login' ? t('app.title') : t('app.title')))
const hasSession = computed(() => {
  // Re-evaluate when route changes so header reacts after login/logout navigation.
  route.fullPath
  return Boolean(authService.getSession())
})

async function onLogout() {
  try {
    authService.clearSession()
  } finally {
    await router.push('/login')
  }
}
</script>

<template>
  <v-app>
    <v-app-bar class="app-topbar" density="comfortable">
      <v-app-bar-title>{{ pageTitle }}</v-app-bar-title>
      <v-spacer />
      <LanguageSwitcher />
      <v-btn
        v-if="hasSession"
        variant="text"
        class="logout-btn"
        @click="onLogout"
      >
        {{ t('app.logout') }}
      </v-btn>
    </v-app-bar>

    <router-view />
  </v-app>
</template>

<style scoped>
.app-topbar {
  background: #2f66c8;
  color: #fff;
}

.logout-btn {
  color: #fff;
}
</style>
