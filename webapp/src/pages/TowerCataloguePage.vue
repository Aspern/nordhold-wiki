<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import SearchField from "../components/SearchField.vue";
import TowerCard from "../components/TowerCard.vue";
import { createTowerCatalogueModel } from "../app/towerCatalogue.ts";
import { wikiRepository } from "../content/wikiRepository.ts";
import type { SupportedLocale } from "../types/content.ts";

const query = ref("");
const { locale, t } = useI18n();
const activeLocale = computed<SupportedLocale>(() => (locale.value === "de" ? "de" : "en"));
const catalogue = computed(() =>
  createTowerCatalogueModel(wikiRepository, activeLocale.value, query.value),
);
</script>

<template>
  <main class="wiki-page">
    <header class="wiki-page__intro">
      <h1 class="wiki-page__title">{{ t("catalogue.title") }}</h1>
      <p class="wiki-page__lead">{{ t("catalogue.introduction") }}</p>
    </header>

    <SearchField
      id="tower-search"
      v-model="query"
      :label="t('catalogue.searchLabel')"
      :clear-label="t('search.clear')"
    />
    <p class="wiki-result-meta" aria-live="polite">
      {{
        t("catalogue.resultCount", { count: catalogue.resultCount, total: catalogue.totalCount })
      }}
    </p>

    <div v-if="catalogue.items.length > 0" class="wiki-card-grid">
      <TowerCard
        v-for="item in catalogue.items"
        :key="item.id"
        :item="item"
        :action-label="t('catalogue.openTower')"
      />
    </div>
    <section v-else class="wiki-empty-state">
      <h2>{{ t("catalogue.noResultsTitle") }}</h2>
      <p>{{ t("catalogue.noResultsBody") }}</p>
      <v-btn color="primary" @click="query = ''">{{ t("search.clear") }}</v-btn>
    </section>
  </main>
</template>
