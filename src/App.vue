<script setup>
import AppShell from "./components/AppShell.vue";
</script>

<template>
  <v-app :style="{ background: '#F4F4F4' }">
    <AppShell :key="$route.fullPath" />
    <v-main>
      <router-view :key="$route.params.id ?? $route.fullPath" />
    </v-main>
  </v-app>
</template>
