<script setup lang="ts">
import { ref } from "vue";

import BannerCard from "./BannerCard.vue";
import type { BannerGroupModel } from "../app/bannerEligibility.ts";

defineProps<{
  group: BannerGroupModel;
  title: string;
  emptyLabel: string;
  countLabel: string;
  fusionCombinationLabel: string;
}>();

const expanded = ref(true);

function handleToggle(event: Event): void {
  expanded.value = (event.currentTarget as HTMLDetailsElement).open;
}
</script>

<template>
  <details
    class="banner-group"
    :class="`banner-group--${group.classification}`"
    :open="expanded"
    @toggle="handleToggle"
  >
    <summary class="banner-group__heading">
      <span class="banner-group__chevron" aria-hidden="true">›</span>
      <h2 :id="`banner-group-${group.classification}`">{{ title }}</h2>
      <span class="banner-group__count" :aria-label="countLabel">{{ group.items.length }}</span>
    </summary>
    <div class="banner-group__content">
      <div v-if="group.items.length > 0" class="wiki-card-grid">
        <BannerCard
          v-for="item in group.items"
          :key="item.id"
          :item="item"
          :classification-label="title"
          :fusion-combination-label="fusionCombinationLabel"
        />
      </div>
      <p v-else class="banner-group__empty">{{ emptyLabel }}</p>
    </div>
  </details>
</template>

<style scoped>
.banner-group {
  --banner-group-accent: var(--wiki-color-brand);

  margin-top: var(--wiki-space-12);
}

.banner-group--tower-specific {
  --banner-group-accent: var(--wiki-color-tower-specific);
}

.banner-group--generalist {
  --banner-group-accent: var(--wiki-color-generalist);
}

.banner-group--unique {
  --banner-group-accent: var(--wiki-color-unique);
}

.banner-group--fusion {
  --banner-group-accent: var(--wiki-color-fusion);
}

.banner-group__heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--wiki-space-3);
  padding-bottom: var(--wiki-space-3);
  border-bottom: var(--wiki-border-width) solid var(--wiki-color-border-strong);
  cursor: pointer;
  list-style: none;
}

.banner-group__heading::-webkit-details-marker {
  display: none;
}

.banner-group__chevron {
  color: var(--banner-group-accent);
  font-size: var(--wiki-font-size-section);
  line-height: 1;
  transition: transform var(--wiki-motion-fast);
}

.banner-group[open] .banner-group__chevron {
  transform: rotate(90deg);
}

.banner-group__heading h2 {
  margin: 0;
  color: var(--wiki-color-brand-strong);
  font-family: var(--wiki-font-family-display);
  font-size: var(--wiki-font-size-section);
}

.banner-group__count {
  min-width: var(--wiki-space-8);
  padding: var(--wiki-space-1) var(--wiki-space-3);
  border: var(--wiki-border-width) solid var(--banner-group-accent);
  border-radius: var(--wiki-radius-medium);
  background: var(--wiki-color-surface-soft);
  color: var(--banner-group-accent);
  font-size: var(--wiki-font-size-small);
  font-weight: 800;
  text-align: center;
}

.banner-group__content {
  padding-top: var(--wiki-space-6);
}

.banner-group__empty {
  margin: 0;
  color: var(--wiki-color-ink-muted);
  font-style: italic;
}
</style>
