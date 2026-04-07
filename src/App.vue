<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

const { t } = useI18n()
const route = useRoute()
const pageTitle = computed(() => (route.name === 'login' ? t('app.title') : t('app.title')))
</script>

<template>
  <v-app>
    <v-app-bar class="app-topbar" density="comfortable">
      <v-app-bar-title>{{ pageTitle }}</v-app-bar-title>
      <v-spacer />
      <LanguageSwitcher />
    </v-app-bar>

    <router-view />
  </v-app>
</template>

<style scoped>
.app-topbar {
  background: #2f66c8;
  color: #fff;
}
</style>
