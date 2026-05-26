<script setup lang="ts">
defineProps<{
  error?: string
  success?: string
}>()
</script>

<template>
  <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-4">
    {{ error }}
  </v-alert>
  <v-alert v-if="success" type="success" variant="tonal" density="comfortable" class="mb-4">
    {{ success }}
  </v-alert>
</template>
