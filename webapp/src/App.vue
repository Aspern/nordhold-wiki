<script setup lang="ts">
import WikiHeader from "./components/WikiHeader.vue";
</script>

<template>
  <v-app>
    <WikiHeader />
    <v-main class="app-main">
      <RouterView />
    </v-main>
  </v-app>
</template>

<style scoped>
.app-main {
  min-height: 100vh;
  background: var(--wiki-page-background);
}
</style>
