<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <v-main>
    <v-container class="py-8">
      <v-card>
        <v-card-title class="text-h6">{{ t('app.title') }}</v-card-title>
        <v-card-text>Dashboard placeholder</v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

