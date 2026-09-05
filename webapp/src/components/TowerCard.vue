<script setup lang="ts">
import { towerImageUrl } from "../assets/towerImages.ts";
import type { TowerCatalogueItem } from "../app/towerCatalogue.ts";

defineProps<{
  item: TowerCatalogueItem;
  actionLabel: string;
}>();
</script>

<template>
  <v-card
    class="tower-card"
    :aria-label="`${actionLabel}: ${item.name}`"
    :to="{ name: 'tower-detail', params: { towerId: item.id } }"
  >
    <div class="tower-card__visual">
      <img
        class="tower-card__image"
        :src="towerImageUrl(item.id)"
        :alt="item.visualAlt"
        :width="item.visual.width"
        :height="item.visual.height"
      />
    </div>
    <v-card-title class="tower-card__title">{{ item.name }}</v-card-title>
    <v-card-text class="tower-card__summary">{{ item.summary }}</v-card-text>
    <v-card-actions>
      <span class="tower-card__action">{{ actionLabel }}</span>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.tower-card {
  height: 100%;
  overflow: hidden;
  border: var(--wiki-border-width) solid var(--wiki-color-border);
  background: var(--wiki-banner-background);
  transition:
    transform var(--wiki-motion-fast),
    border-color var(--wiki-motion-fast),
    box-shadow var(--wiki-motion-fast);
}

.tower-card:hover {
  transform: translateY(calc(-1 * var(--wiki-space-1)));
  border-color: var(--wiki-color-brand);
  box-shadow: var(--wiki-elevation-card);
}

.tower-card__visual {
  display: grid;
  min-height: var(--wiki-tower-image-size);
  place-items: center;
  padding: var(--wiki-space-6);
  background: radial-gradient(circle, var(--wiki-color-glow), transparent 68%);
}

.tower-card__image {
  width: auto;
  height: auto;
  max-width: var(--wiki-tower-image-size);
  max-height: var(--wiki-tower-image-size);
  image-rendering: pixelated;
  filter: drop-shadow(0 var(--wiki-space-2) var(--wiki-space-2) var(--wiki-color-shadow));
  transform: scale(2.25);
}

.tower-card__title {
  color: var(--wiki-color-brand-strong);
  font-family: var(--wiki-font-family-display);
}

.tower-card__summary {
  min-height: 5rem;
  color: var(--wiki-color-ink-muted);
}

.tower-card__action {
  color: var(--wiki-color-brand-strong);
  font-size: var(--wiki-font-size-small);
  font-weight: 700;
}
</style>
