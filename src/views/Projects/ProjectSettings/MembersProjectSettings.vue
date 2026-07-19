<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import ProjectServices from "../../../services/ProjectServices.js";
import SnackBar from "../../../components/SnackBar.vue";

const route = useRoute();

const user = ref(null);
const projectId = ref(route.params.id);
const project = ref(null);
const snackbar = ref(null);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getProject(projectId.value);
});

async function getProject(id) {
  try {
    const response = await ProjectServices.getProject(id);
    project.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-container v-if="!project">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <div class="mb-6">
      <div class="text-overline text-medium-emphasis mb-1">
        {{ project.title }} · Project Settings
      </div>
      <h4 class="pl-0 text-h5 font-weight-medium">Team Members</h4>
    </div>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
