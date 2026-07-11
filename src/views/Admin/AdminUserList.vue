<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import ProjectServices from "../../services/ProjectServices";
import SnackBar from "../../components/SnackBar.vue";
import UserServices from "../../services/UserServices";
import { useRouter } from "vue-router";

const user = ref(null);
const users = ref(null);
const snackbar = ref(null);
const search = ref("");

const headers = [
  { title: "First Name", key: "firstName" },
  { title: "Last Name", key: "lastName" },
  { title: "Email", key: "email" },
  { title: "Admin", key: "isAdmin" },
  { title: "", key: "actions", sortable: false, align: "end" },
];

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getUsers();
});

async function getUsers() {
  try {
    const response = await UserServices.getUsers();
    users.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-container v-if="!users">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <v-card variant="flat" border rounded="lg">
      <v-data-table
        v-model:search="search"
        :filter-keys="['firstName', 'lastName', 'email']"
        :items="users"
        :headers="headers"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title> Users </v-toolbar-title>

            <v-text-field
              v-model="search"
              class="me-2"
              density="compact"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              variant="solo-filled"
              flat
              hide-details
              single-line
            ></v-text-field>

            <v-btn
              class="me-2"
              prepend-icon="mdi-plus"
              rounded="lg"
              text="New User"
              border
              :to="{ name: 'adminCreateUser' }"
            ></v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item.isAdmin="{ value }">
          <v-chip
            :color="value ? 'success' : 'grey'"
            size="small"
            variant="tonal"
            label
          >
            <v-icon start :icon="value ? 'mdi-shield-crown' : 'mdi-account'" />
            {{ value ? "Admin" : "User" }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            color="primary"
            size="small"
            variant="text"
            prepend-icon="mdi-pencil"
            :to="{ name: 'adminEditUser', params: { id: item.id } }"
          >
            Edit
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
