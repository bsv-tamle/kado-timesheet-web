<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, type AppLocale } from '../plugins/i18n'

const { t, locale } = useI18n()

const selectedLocale = computed({
  get: () => locale.value as AppLocale,
  set: (value: AppLocale) => setLocale(value),
})

const languageItems = [
  { value: 'vi', flag: '🇻🇳', labelKey: 'app.langVi' },
  { value: 'en', flag: '🇬🇧', labelKey: 'app.langEn' },
  { value: 'ja', flag: '🇯🇵', labelKey: 'app.langJa' },
] as const
</script>

<template>
  <v-btn-toggle
    v-model="selectedLocale"
    mandatory
    density="compact"
    variant="outlined"
    class="language-toggle"
  >
    <v-tooltip
      v-for="item in languageItems"
      :key="item.value"
      location="bottom"
      :text="t(item.labelKey)"
    >
      <template #activator="{ props }">
        <v-btn v-bind="props" :value="item.value">{{ item.flag }}</v-btn>
      </template>
    </v-tooltip>
  </v-btn-toggle>
</template>

<style scoped>
.language-toggle {
  margin-right: 8px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(4px);
}

.language-toggle :deep(.v-btn) {
  min-width: 36px;
  padding-inline: 8px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.92);
  background: transparent;
}

.language-toggle :deep(.v-btn.v-btn--active) {
  color: #0d47a1;
  background: rgba(255, 255, 255, 0.95);
}
</style>

