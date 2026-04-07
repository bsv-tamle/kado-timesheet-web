<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SidebarNavItem } from '../constants/navigation'

const { t } = useI18n()

defineProps<{
  sectionLabelKey: string
  items: SidebarNavItem[]
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
        <RouterLink v-if="item.to" :to="item.to" class="nav-link">
          {{ t(item.labelKey) }}
        </RouterLink>
        <span v-else class="nav-link disabled">
          {{ t(item.labelKey) }}
        </span>
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
  border-radius: 8px;
  border: 1px solid transparent;
  overflow: hidden;
}

.nav li.active {
  background: #fff;
  border-color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.nav-link {
  display: block;
  padding: 9px 10px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
}

.nav li.active .nav-link {
  color: #2f66c8;
}

.nav-link.disabled {
  opacity: 0.82;
  cursor: default;
}
</style>
