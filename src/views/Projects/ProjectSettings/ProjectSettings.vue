<script setup>
import ProjectSettingsNav from "./ProjectSettingsNav.vue";
</script>

<template>
  <v-layout class="fill-height">
    <ProjectSettingsNav />
    <v-main>
      <router-view />
    </v-main>
  </v-layout>
</template>
