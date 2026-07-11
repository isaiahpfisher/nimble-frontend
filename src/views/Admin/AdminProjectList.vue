<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import ProjectServices from "../../services/ProjectServices.js";
import SnackBar from "../../components/SnackBar.vue";
import StackedAvatars from "../../components/StackedAvatars.vue";
import { formatDate } from "../../utils/date.js";

const user = ref(null);
const projects = ref(null);
const snackbar = ref(null);
const search = ref("");

const headers = [
  { title: "Title", key: "title" },
  { title: "Description", key: "description" },
  { title: "Deadline", key: "deadline" },
  { title: "Team Members", key: "projectMembers" },
  { title: "", key: "actions", sortable: false, align: "end" },
];

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getProjects();
});

async function getProjects() {
  try {
    const response = await ProjectServices.getProjects();
    projects.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-container v-if="!projects">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <v-card variant="flat" border rounded="lg">
      <v-data-table
        v-model:search="search"
        :filter-keys="['title', 'description']"
        :items="projects"
        :headers="headers"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title> Projects </v-toolbar-title>

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
              text="New Project"
              border
              :to="{ name: 'adminCreateProject' }"
            ></v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item.description="{ item }">
          <div class="text-truncate" style="max-width: 300px">
            {{ item.description }}
          </div>
        </template>

        <template v-slot:item.deadline="{ item }">
          {{ formatDate(item.deadline) }}
        </template>

        <template v-slot:item.projectMembers="{ item }">
          <StackedAvatars :members="item.projectMembers" />
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            color="primary"
            size="small"
            variant="text"
            prepend-icon="mdi-cog"
            :to="{ name: 'adminProjectGeneral', params: { id: item.id } }"
          >
            Manage
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
