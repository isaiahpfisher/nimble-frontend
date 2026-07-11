<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import AdminProjectSettingsNav from "./AdminProjectSettingsNav.vue";
import ProjectServices from "../../services/ProjectServices.js";

const route = useRoute();
const project = ref(null);

onMounted(() => getProject(route.params.id));

async function getProject(id) {
  try {
    const response = await ProjectServices.getProject(id);
    project.value = response.data;
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <v-layout class="fill-height">
    <AdminProjectSettingsNav :project="project" />
    <v-main>
      <v-breadcrumbs
        :items="[
          { title: 'Admin', disabled: true },
          { title: 'Projects', to: { name: 'adminProjects' } },
          { title: project?.title ?? '…', disabled: true },
        ]"
      ></v-breadcrumbs>
      <router-view />
    </v-main>
  </v-layout>
</template>
