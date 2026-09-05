<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <main class="wiki-page">
    <section class="wiki-empty-state">
      <h1>{{ t("notFound.title") }}</h1>
      <p>{{ t("notFound.body") }}</p>
      <v-btn color="primary" :to="{ name: 'tower-catalogue' }">
        {{ t("navigation.backToTowers") }}
      </v-btn>
    </section>
  </main>
</template>
