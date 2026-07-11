<script setup>
import { useRoute } from "vue-router";
import UserMenu from "../../components/UserMenu.vue";

// The parent layout already fetches the project — reuse it, don't refetch.
defineProps({
  project: { type: Object, default: null },
});

const route = useRoute();

const settingPages = [
  { title: "General", icon: "mdi-cog", name: "adminProjectGeneral" },
  {
    title: "Board Columns",
    icon: "mdi-view-column",
    name: "adminProjectBoardColumns",
  },
  {
    title: "Story Types",
    icon: "mdi-tag-multiple",
    name: "adminProjectStoryTypes",
  },
  { title: "Repositories", icon: "mdi-git", name: "adminProjectRepos" },
  { title: "Members", icon: "mdi-account-group", name: "adminProjectMembers" },
];

const adminItems = [
  { title: "Projects", icon: "mdi-cube-outline", name: "adminProjects" },
  { title: "Users", icon: "mdi-account-group", name: "adminUsers" },
];
</script>

<template>
  <v-navigation-drawer floating permanent color="secondary" width="280">
    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-arrow-left"
        title="All Projects"
        :to="{ name: 'adminProjects' }"
      ></v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        v-for="settingPage in settingPages"
        :key="settingPage.name"
        :prepend-icon="settingPage.icon"
        :title="settingPage.title"
        :value="settingPage.name"
        :active="route.name === settingPage.name"
        :to="{ name: settingPage.name, params: { id: route.params.id } }"
      ></v-list-item>
    </v-list>

    <template v-slot:append>
      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-list-item
          v-for="item in adminItems"
          :key="item.name"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="{ name: item.name }"
        ></v-list-item>
      </v-list>

      <v-divider></v-divider>
      <UserMenu />
    </template>
  </v-navigation-drawer>
</template>
