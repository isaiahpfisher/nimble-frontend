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
    <h4 class="pl-0 text-h5 mb-6 font-weight-medium">
      {{ project.title }} Project Settings - Members
    </h4>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
