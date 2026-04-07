<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
}>()
</script>

<template>
  <header class="dashboard-header">
    <div class="header-text">
      <div class="page-title">{{ title }}</div>
      <div class="page-subtitle">{{ subtitle }}</div>
    </div>

    <div class="header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.dashboard-header {
  background: #ffffff;
  color: #111827;
  border-radius: 12px;
  border: 1px solid #dbe4f7;
  border-left: 5px solid #2f66c8;
  box-shadow: 0 6px 14px rgba(16, 24, 40, 0.06);
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

:slotted(.btn) {
  border: 1px solid #cdd8f1;
  background: #ffffff;
  color: #2f66c8;
  border-radius: 8px;
  padding: 8px 12px;
}

:slotted(.btn.primary) {
  background: #3a78ea;
  color: #fff;
  border-color: #3a78ea;
}
</style>
