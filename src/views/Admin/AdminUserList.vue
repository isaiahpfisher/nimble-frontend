<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import ProjectServices from "../../services/ProjectServices";
import SnackBar from "../../components/SnackBar.vue";

const user = ref(null);
const users = ref(null);
const snackbar = ref(null);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  users.value = [];
  users;
});
</script>

<template>
  <v-container v-if="!users">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <h4 class="pl-0 text-h5 mb-6 font-weight-medium">Users</h4>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
