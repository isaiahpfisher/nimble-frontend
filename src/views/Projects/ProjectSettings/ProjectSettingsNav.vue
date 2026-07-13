<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const projectId = ref(route.params.id);

const settingPages = ref([
  { title: "General", icon: "mdi-cog", name: "generalProjectSettings" },
  {
    title: "Board Columns",
    icon: "mdi-view-column",
    name: "boardColumnsProjectSettings",
  },
  {
    title: "Story Types",
    icon: "mdi-tag-multiple",
    name: "storyTypesProjectSettings",
  },
  { title: "Repositories", icon: "mdi-git", name: "reposProjectSettings" },
  {
    title: "Members",
    icon: "mdi-account-group",
    name: "membersProjectSettings",
  },
]);
</script>

<template>
  <v-navigation-drawer floating permanent color="secondary">
    <v-list density="compact" nav>
      <v-list-item
        v-for="settingPage in settingPages"
        :key="settingPage.name"
        :prepend-icon="settingPage.icon"
        :title="settingPage.title"
        :value="settingPage.name"
        :active="route.name === settingPage.name"
        :to="{ name: settingPage.name, params: { id: projectId } }"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
