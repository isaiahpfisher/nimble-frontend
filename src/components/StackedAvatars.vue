<script setup>
import { computed } from "vue";

const props = defineProps({
  members: {
    type: Array,
    default: () => [],
  },
  max: {
    type: Number,
    default: 4,
  },
  size: {
    type: Number,
    default: 32,
  },
});

function fullName(user) {
  return `${user.firstName} ${user.lastName}`;
}

function initials(user) {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}

const visible = computed(() =>
  props.members.slice(0, props.max).map((member) => member.user),
);
const overflow = computed(() => Math.max(props.members.length - props.max, 0));
</script>

<template>
  <div class="d-flex align-center">
    <v-avatar
      v-for="(user, index) in visible"
      :key="index"
      color="accent"
      :size="size"
      :style="{
        marginLeft: index === 0 ? '0' : `-${size / 4}px`,
        zIndex: index,
        border: '2px solid rgb(var(--v-theme-surface))',
      }"
    >
      <span class="text-white text-caption font-weight-bold">
        {{ initials(user) }}
      </span>
      <v-tooltip activator="parent" location="top">
        {{ fullName(user) }}
      </v-tooltip>
    </v-avatar>

    <v-avatar
      v-if="overflow > 0"
      color="blue"
      :size="size"
      :style="{
        marginLeft: `-${size / 4}px`,
        zIndex: visible.length,
        border: '2px solid rgb(var(--v-theme-surface))',
      }"
    >
      <span class="text-white text-caption font-weight-bold">
        +{{ overflow }}
      </span>
    </v-avatar>
  </div>
</template>
