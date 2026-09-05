<script setup lang="ts">
defineProps<{
  id: string;
  label: string;
  modelValue: string;
  clearLabel: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <v-text-field
    :id="id"
    :label="label"
    :model-value="modelValue"
    clearable
    hide-details
    type="search"
    @click:clear="emit('update:modelValue', '')"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  >
    <template #append-inner>
      <span v-if="modelValue.length > 0" class="wiki-visually-hidden">{{ clearLabel }}</span>
    </template>
  </v-text-field>
</template>
