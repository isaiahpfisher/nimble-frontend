<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import ProjectServices from "../../../services/ProjectServices.js";
import SnackBar from "../../../components/SnackBar.vue";

const route = useRoute();
const router = useRouter();

const user = ref(null);
const projectId = ref(route.params.id);
const project = ref(null);
const snackbar = ref(null);
const deleteDialog = ref(false);

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

async function updateProject() {
  try {
    const response = await ProjectServices.updateProject(
      projectId.value,
      project.value,
    );
    // gross hack to force the project list to show the updated project title
    // TODO: use a store (like Pinia) instead
    window.dispatchEvent(new Event("project-updated"));
    snackbar.value.show("Project updated successfully!");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function deleteProject() {
  try {
    const response = await ProjectServices.deleteProject(projectId.value);
    deleteDialog.value = false;
    router.push(route.meta.admin ? { name: "adminProjects" } : { name: "home" });
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
      {{ project.title }} Project Settings - General
    </h4>

    <v-card class="rounded-lg elevation-5">
      <v-card-text>
        <v-row>
          <v-col>
            <v-text-field v-model="project.title" label="Title"></v-text-field>
          </v-col>
          <v-col>
            <v-date-input
              v-model="project.deadline"
              label="Deadline"
            ></v-date-input>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-textarea
              v-model.number="project.description"
              label="Description"
            ></v-textarea>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="updateProject()"
          >Update Project Details</v-btn
        >
      </v-card-actions>
    </v-card>

    <v-alert
      class="mt-6"
      type="error"
      variant="flat"
      title="Danger Zone"
      text="Deleting this project is permanent and cannot be undone. As Boromir said, 'It is said that few come out who once go in; and of that few none have escaped unscathed.'"
    >
      <v-divider></v-divider>
      <v-btn variant="tonal" class="mt-2" @click="deleteDialog = true"
        >Permanently Delete Project</v-btn
      >
    </v-alert>

    <v-dialog v-model="deleteDialog" max-width="480">
      <v-card class="rounded-lg">
        <v-card-title class="text-h6">Delete Project</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ project.title }}</strong
          >? This action cannot be undone. All associated data will also be
          deleted.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn variant="elevated" color="primary" @click="deleteProject()"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
