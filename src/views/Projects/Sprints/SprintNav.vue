<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import SprintServices from "../../../services/SprintServices.js";

const route = useRoute();
const projectId = ref(route.params.projectId);
const sprintId = ref(route.params.sprintId);
const sprint = ref(null);

onMounted(async () => {
  getSprint(sprintId.value);
});

async function getSprint(id) {
  try {
    const response = await SprintServices.getSprint(id);
    sprint.value = response.data;
  } catch (error) {
    console.error(error);
  }
}

const tabs = [
  { label: "Board", to: "sprintBoard", icon: "mdi-view-column" },
  { label: "Plan", to: "sprintPlan", icon: "mdi-clipboard-text-clock" },
  { label: "Retro", to: "sprintRetro", icon: "mdi-account-group" },
  { label: "Burndown", to: "sprintBurndown", icon: "mdi-chart-line" },
];
</script>

<template>
  <v-container v-if="!sprint">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <v-card>
      <v-toolbar color="secondary">
        <v-toolbar-title>{{ sprint.title }}</v-toolbar-title>

        <template v-slot:extension>
          <v-tabs align-tabs="title">
            <v-tab
              v-for="tab in tabs"
              :key="tab.label"
              :text="tab.label"
              :to="{ name: tab.to, params: { projectId, sprintId } }"
              :prepend-icon="tab.icon"
            ></v-tab>
          </v-tabs>
        </template>
      </v-toolbar>

      <router-view />
    </v-card>
  </v-container>
</template>
