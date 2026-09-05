<script setup lang="ts">
import BannerVisual from "./BannerVisual.vue";
import { towerImageUrl } from "../assets/towerImages.ts";
import type { LocalizedBannerItem } from "../app/bannerEligibility.ts";

const props = defineProps<{
  item: LocalizedBannerItem;
  classificationLabel: string;
  fusionCombinationLabel: string;
}>();

function fusionDescription(): string {
  return `${props.fusionCombinationLabel}: ${props.item.fusionTowers
    .map((tower) => tower.name)
    .join(" + ")}`;
}
</script>

<template>
  <v-card class="banner-card">
    <BannerVisual
      :visual="item.visual"
      :classification="item.classification"
      :alt="item.visualAlt"
    />
    <v-card-item>
      <div class="banner-card__classification">{{ classificationLabel }}</div>
      <div class="banner-card__heading">
        <v-card-title class="banner-card__title">{{ item.name }}</v-card-title>
        <div
          v-if="item.fusionTowers.length > 0"
          class="banner-card__fusion"
          :aria-label="fusionDescription()"
          :title="fusionDescription()"
        >
          <template v-for="(tower, index) in item.fusionTowers" :key="tower.id">
            <span v-if="index > 0" class="banner-card__fusion-plus" aria-hidden="true">+</span>
            <span class="banner-card__tower-icon">
              <img
                :src="towerImageUrl(tower.id)"
                alt=""
                aria-hidden="true"
                :width="tower.width"
                :height="tower.height"
              />
            </span>
          </template>
        </div>
      </div>
    </v-card-item>
    <v-card-text class="banner-card__summary">{{ item.summary }}</v-card-text>
  </v-card>
</template>

<style scoped>
.banner-card {
  height: 100%;
  overflow: hidden;
  border: var(--wiki-border-width) solid var(--wiki-color-border);
  background: var(--wiki-color-surface-raised);
}

.banner-card__classification {
  color: var(--wiki-color-ink-muted);
  font-size: var(--wiki-font-size-label);
  font-weight: 800;
  letter-spacing: var(--wiki-letter-spacing-label);
  text-transform: uppercase;
}

.banner-card__title {
  min-width: 0;
  flex: 1;
  padding-inline: 0;
  color: var(--wiki-color-brand-strong);
  font-family: var(--wiki-font-family-display);
  white-space: normal;
}

.banner-card__heading {
  display: flex;
  align-items: center;
  gap: var(--wiki-space-3);
}

.banner-card__fusion {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--wiki-space-1);
}

.banner-card__fusion-plus {
  color: var(--wiki-color-ink-muted);
  font-size: var(--wiki-font-size-small);
  font-weight: 800;
}

.banner-card__tower-icon {
  display: grid;
  width: var(--wiki-tower-combination-icon-size);
  height: var(--wiki-tower-combination-icon-size);
  overflow: hidden;
  place-items: center;
  border: var(--wiki-border-width) solid var(--wiki-color-border-strong);
  border-radius: var(--wiki-radius-small);
  background: radial-gradient(circle, var(--wiki-color-glow), var(--wiki-color-surface-soft));
}

.banner-card__tower-icon img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
  transform: scale(var(--wiki-tower-combination-image-scale));
}

.banner-card__summary {
  color: var(--wiki-color-ink-muted);
}
</style>
