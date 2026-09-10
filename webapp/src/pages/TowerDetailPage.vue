<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import BannerGroup from "../components/BannerGroup.vue";
import NotFoundPage from "./NotFoundPage.vue";
import SearchField from "../components/SearchField.vue";
import { createTowerDetailModel } from "../app/bannerEligibility.ts";
import { filterEligibleBannerGroups } from "../app/bannerSearch.ts";
import { towerImageUrl } from "../assets/towerImages.ts";
import { wikiRepository } from "../content/wikiRepository.ts";
import type { BannerClassification, SupportedLocale } from "../types/content.ts";

const route = useRoute();
const query = ref("");
const { locale, t } = useI18n();
const activeLocale = computed<SupportedLocale>(() => (locale.value === "de" ? "de" : "en"));
const detail = computed(() =>
  createTowerDetailModel(wikiRepository, route.params.towerId, activeLocale.value),
);
const bannerSearch = computed(() =>
  detail.value.kind === "found"
    ? filterEligibleBannerGroups(detail.value.groups, query.value, activeLocale.value)
    : undefined,
);

watch(
  () => route.params.towerId,
  () => {
    query.value = "";
  },
);

function classificationLabel(classification: BannerClassification): string {
  return t(`classification.${classification}`);
}
</script>

<template>
  <NotFoundPage v-if="detail.kind === 'not-found'" />
  <main v-else class="wiki-page">
    <v-btn class="detail-return" variant="text" :to="{ name: 'tower-catalogue' }">
      <span class="detail-return__arrow" aria-hidden="true">←</span>
      {{ t("navigation.backToTowers") }}
    </v-btn>

    <header class="detail-hero">
      <div class="detail-hero__visual">
        <img :src="towerImageUrl(detail.tower.id)" :alt="detail.tower.visualAlt" />
      </div>
      <div>
        <div class="detail-hero__eyebrow">{{ t("detail.eyebrow") }}</div>
        <h1 class="wiki-page__title">{{ detail.tower.name }}</h1>
        <p class="wiki-page__lead">{{ detail.tower.summary }}</p>
      </div>
    </header>

    <section class="detail-search" :aria-label="t('detail.bannerSection')">
      <h2>{{ t("detail.bannerSection") }}</h2>
      <SearchField
        id="banner-search"
        v-model="query"
        :label="t('detail.searchLabel')"
        :clear-label="t('search.clear')"
      />
      <div class="detail-rarity-key" :aria-label="t('rarity.key')">
        <span class="detail-rarity-key__title">{{ t("rarity.key") }}:</span>
        <span class="detail-rarity-key__item">
          <span
            class="detail-rarity-key__swatch detail-rarity-key__swatch--common"
            aria-hidden="true"
          ></span>
          {{ t("rarity.common") }}
        </span>
        <span class="detail-rarity-key__item">
          <span
            class="detail-rarity-key__swatch detail-rarity-key__swatch--rare"
            aria-hidden="true"
          ></span>
          {{ t("rarity.rare") }}
        </span>
        <span class="detail-rarity-key__item">
          <span
            class="detail-rarity-key__swatch detail-rarity-key__swatch--legendary"
            aria-hidden="true"
          ></span>
          {{ t("rarity.legendary") }}
        </span>
      </div>
      <p v-if="bannerSearch" class="wiki-result-meta" aria-live="polite">
        {{
          t("detail.resultCount", {
            count: bannerSearch.resultCount,
            total: bannerSearch.totalCount,
          })
        }}
      </p>
    </section>

    <template v-if="bannerSearch">
      <section v-if="bannerSearch.hasNoResults" class="wiki-empty-state">
        <h2>{{ t("detail.noResultsTitle") }}</h2>
        <p>{{ t("detail.noResultsBody") }}</p>
        <v-btn color="primary" @click="query = ''">{{ t("search.clear") }}</v-btn>
      </section>
      <template v-else>
        <BannerGroup
          v-for="group in bannerSearch.groups"
          :key="group.classification"
          :group="group"
          :title="classificationLabel(group.classification)"
          :empty-label="t('detail.emptyGroup')"
          :count-label="t('detail.categoryCount', { count: group.items.length })"
          :fusion-combination-label="t('detail.fusionCombination')"
        />
      </template>
    </template>
  </main>
</template>

<style scoped>
.detail-return {
  margin-bottom: var(--wiki-space-6);
}

.detail-return__arrow {
  margin-right: var(--wiki-space-2);
  font-size: var(--wiki-font-size-section);
  line-height: 1;
}

.detail-hero {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--wiki-space-8);
  padding: var(--wiki-space-8);
  border: var(--wiki-border-width) solid var(--wiki-color-border-strong);
  border-radius: var(--wiki-radius-large);
  background: var(--wiki-banner-background);
  box-shadow: var(--wiki-elevation-card);
}

.detail-hero__visual {
  display: grid;
  width: var(--wiki-tower-detail-image-size);
  height: var(--wiki-tower-detail-image-size);
  place-items: center;
}

.detail-hero__visual img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
  filter: drop-shadow(0 var(--wiki-space-2) var(--wiki-space-2) var(--wiki-color-shadow));
  transform: scale(1.7);
}

.detail-hero__eyebrow {
  color: var(--wiki-color-brand);
  font-size: var(--wiki-font-size-label);
  font-weight: 800;
  letter-spacing: var(--wiki-letter-spacing-label);
  text-transform: uppercase;
}

.detail-search {
  margin-top: var(--wiki-space-12);
}

.detail-search h2 {
  margin-bottom: var(--wiki-space-4);
  font-family: var(--wiki-font-family-display);
  font-size: var(--wiki-font-size-section);
}

.detail-rarity-key {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--wiki-space-2) var(--wiki-space-4);
  margin-top: var(--wiki-space-3);
  color: var(--wiki-color-ink-muted);
  font-size: var(--wiki-font-size-small);
}

.detail-rarity-key__title {
  color: var(--wiki-color-ink);
  font-weight: 800;
}

.detail-rarity-key__item {
  display: inline-flex;
  align-items: center;
  gap: var(--wiki-space-1);
}

.detail-rarity-key__swatch {
  width: var(--wiki-space-3);
  height: var(--wiki-space-3);
  border: var(--wiki-border-width) solid var(--wiki-color-border);
  border-radius: 50%;
  background: currentColor;
}

.detail-rarity-key__swatch--common {
  color: var(--wiki-color-rarity-common);
}

.detail-rarity-key__swatch--rare {
  color: var(--wiki-color-rarity-rare);
}

.detail-rarity-key__swatch--legendary {
  color: var(--wiki-color-rarity-legendary);
}
</style>
