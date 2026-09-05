<script setup lang="ts">
import { computed } from "vue";

import type { BannerClassification, CssVisual } from "../types/content.ts";

const props = defineProps<{
  visual: CssVisual;
  classification: BannerClassification;
  alt: string;
}>();

const visualStyle = computed(() => ({
  "--banner-angle": `${String((props.visual.seed * 47) % 360)}deg`,
  "--banner-offset": `${String(18 + ((props.visual.seed * 13) % 64))}%`,
}));
</script>

<template>
  <div
    class="banner-visual"
    :class="[`banner-visual--${classification}`, `banner-visual--${visual.motif}`]"
    :style="visualStyle"
    role="img"
    :aria-label="alt"
  >
    <span class="banner-visual__field"></span>
    <span class="banner-visual__sigil"></span>
    <span class="banner-visual__spark banner-visual__spark--first"></span>
    <span class="banner-visual__spark banner-visual__spark--second"></span>
  </div>
</template>

<style scoped>
.banner-visual {
  --banner-accent: var(--wiki-color-brand);

  position: relative;
  height: var(--wiki-banner-visual-height);
  overflow: hidden;
  border-bottom: var(--wiki-border-width) solid var(--wiki-color-border);
  background: var(--wiki-banner-background);
  isolation: isolate;
}

.banner-visual--tower-specific {
  --banner-accent: var(--wiki-color-tower-specific);
}

.banner-visual--generalist {
  --banner-accent: var(--wiki-color-generalist);
}

.banner-visual--unique {
  --banner-accent: var(--wiki-color-unique);
}

.banner-visual--fusion {
  --banner-accent: var(--wiki-color-fusion);
}

.banner-visual__field {
  position: absolute;
  inset: -35%;
  background: conic-gradient(
    from var(--banner-angle),
    transparent,
    var(--banner-accent),
    transparent,
    var(--banner-accent),
    transparent
  );
  opacity: 0.26;
  transform: translateX(calc(var(--banner-offset) - 50%));
}

.banner-visual__sigil {
  position: absolute;
  inset: 20% 31%;
  border: var(--wiki-border-accent-width) solid var(--banner-accent);
  box-shadow:
    0 0 var(--wiki-space-4) var(--banner-accent),
    inset 0 0 var(--wiki-space-4) var(--banner-accent);
  transform: rotate(var(--banner-angle));
}

.banner-visual--crest .banner-visual__sigil,
.banner-visual--crown .banner-visual__sigil {
  clip-path: polygon(50% 0, 100% 25%, 84% 100%, 16% 100%, 0 25%);
}

.banner-visual--rune .banner-visual__sigil,
.banner-visual--blade .banner-visual__sigil {
  inset: 14% 44%;
  transform: rotate(calc(var(--banner-angle) + 35deg)) skewY(-18deg);
}

.banner-visual--orbit .banner-visual__sigil,
.banner-visual--vortex .banner-visual__sigil {
  border-radius: 50%;
}

.banner-visual--burst .banner-visual__sigil {
  clip-path: polygon(50% 0, 61% 34%, 100% 50%, 64% 62%, 50% 100%, 37% 64%, 0 50%, 35% 37%);
}

.banner-visual--weave .banner-visual__sigil {
  border-radius: 14% 50%;
}

.banner-visual__spark {
  position: absolute;
  width: var(--wiki-space-2);
  height: var(--wiki-space-2);
  border-radius: 50%;
  background: var(--banner-accent);
  box-shadow: 0 0 var(--wiki-space-3) var(--banner-accent);
}

.banner-visual__spark--first {
  top: 22%;
  left: var(--banner-offset);
}

.banner-visual__spark--second {
  right: calc(100% - var(--banner-offset));
  bottom: 18%;
}
</style>
