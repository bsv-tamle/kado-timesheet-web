<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

const { t } = useI18n()
</script>

<template>
  <v-app>
    <v-app-bar color="blue-darken-3" density="comfortable">
      <v-app-bar-title>{{ t('app.title') }}</v-app-bar-title>
      <v-spacer />
      <LanguageSwitcher />
    </v-app-bar>

    <router-view />
  </v-app>
</template>
