<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import SprintServices from "../../../services/SprintServices.js";
import SnackBar from "../../../components/SnackBar.vue";

const route = useRoute();

const user = ref(null);
const projectId = ref(route.params.projectId);
const sprintId = ref(route.params.sprintId);
const sprint = ref(null);
const snackbar = ref(null);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getSprint(sprintId.value);
});

async function getSprint(id) {
  try {
    const response = await SprintServices.getSprint(id);
    sprint.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-container v-if="!sprint">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    Board - can we just reuse the storyboard component, but hardcode the sprint to this one?
  </v-container>

  <SnackBar ref="snackbar" />
</template>
