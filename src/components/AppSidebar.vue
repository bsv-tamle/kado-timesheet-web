<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface SidebarItem {
  key: string
  labelKey: string
}

const { t } = useI18n()

defineProps<{
  sectionLabelKey: string
  items: SidebarItem[]
  activeKey: string
}>()
</script>

<template>
  <aside class="sidebar">
    <div class="nav-group-title">{{ t(sectionLabelKey) }}</div>
    <ul class="nav">
      <li
        v-for="item in items"
        :key="item.key"
        :class="{ active: item.key === activeKey }"
      >
        {{ t(item.labelKey) }}
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #2f66c8 0%, #2859b2 100%);
  color: #fff;
  padding: 20px 16px;
}

.nav-group-title {
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  margin-bottom: 8px;
}

.nav {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav li {
  padding: 9px 10px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid transparent;
}

.nav li.active {
  background: #fff;
  color: #2f66c8;
  border-color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}
</style>
