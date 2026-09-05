<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { createHeaderModel } from "../app/headerModel.ts";
import { releaseMetadata } from "../generated/release.ts";
import type { SupportedLocale } from "../types/content.ts";

const { locale, t } = useI18n();
const activeLocale = computed<SupportedLocale>(() => (locale.value === "de" ? "de" : "en"));
const header = computed(() =>
  createHeaderModel(releaseMetadata, activeLocale.value, {
    title: t("app.title"),
    attribution: t("header.attribution"),
    version: t("header.version"),
    published: t("header.published"),
  }),
);
</script>

<template>
  <v-app-bar class="wiki-header" elevation="0">
    <div class="wiki-header__inner">
      <RouterLink class="wiki-header__brand" :to="{ name: 'tower-catalogue' }">
        <span class="wiki-header__mark" aria-hidden="true"></span>
        <span>
          <strong>{{ header.title }}</strong>
          <small>{{ header.attribution }}</small>
        </span>
      </RouterLink>
      <div class="wiki-header__release">
        <span>{{ header.version }}</span>
        <span>{{ header.published }}</span>
      </div>
    </div>
  </v-app-bar>
</template>

<style scoped>
.wiki-header {
  min-height: var(--wiki-header-min-height);
  border-bottom: var(--wiki-border-width) solid var(--wiki-color-border-strong);
  background: var(--wiki-color-overlay);
  backdrop-filter: blur(var(--wiki-space-3));
}

.wiki-header__inner {
  display: flex;
  width: min(calc(100% - (2 * var(--wiki-space-4))), var(--wiki-content-width));
  min-height: var(--wiki-header-min-height);
  align-items: center;
  justify-content: space-between;
  gap: var(--wiki-space-6);
  margin-inline: auto;
}

.wiki-header__brand {
  display: flex;
  align-items: center;
  gap: var(--wiki-space-3);
  color: var(--wiki-color-ink);
  text-decoration: none;
}

.wiki-header__brand strong,
.wiki-header__brand small {
  display: block;
}

.wiki-header__brand strong {
  color: var(--wiki-color-brand-strong);
  font-family: var(--wiki-font-family-display);
  font-size: var(--wiki-font-size-section);
}

.wiki-header__brand small {
  color: var(--wiki-color-ink-muted);
  font-size: var(--wiki-font-size-label);
}

.wiki-header__mark {
  width: var(--wiki-space-8);
  height: var(--wiki-space-8);
  border: var(--wiki-border-accent-width) solid var(--wiki-color-brand);
  clip-path: polygon(50% 0, 100% 25%, 82% 100%, 18% 100%, 0 25%);
  transform: rotate(45deg);
}

.wiki-header__release {
  display: grid;
  gap: var(--wiki-space-1);
  color: var(--wiki-color-ink-muted);
  font-size: var(--wiki-font-size-small);
  text-align: right;
}
</style>
