<script setup>
import AppShell from "./components/AppShell.vue";
</script>

<template>
  <v-app :style="{ background: '#F4F4F4' }">
    <AppShell :key="$route.path" />
    <v-main>
      <router-view :key="$route.params.id ?? $route.path" />
    </v-main>
  </v-app>
</template>
