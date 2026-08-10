<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import ProjectServices from "../../../services/ProjectServices.js";
import SnackBar from "../../../components/SnackBar.vue";
import RepositoryServices from "../../../services/RepositoryServices.js";

const route = useRoute();

const user = ref(null);
const projectId = ref(route.params.id);
const project = ref(null);
const snackbar = ref(null);
const repositories = ref([]);
const githubId = ref("");
const githubToken = ref("");
const owner = ref("");
const repositoryName = ref("");
const editingRepositoryId = ref(null);
const isEditing = ref(false);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  await getProject(projectId.value);
  await getRepositories(projectId.value);
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

async function getRepositories(projectId) {
  try {
    const response = await RepositoryServices.getAllForProject(projectId);
    repositories.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function createRepository() {
  if (!githubId.value || !repositoryName.value) {
    snackbar.value.show("Repository ID and name are required.");
    return;
  }
  try {
    const repository = {
      githubId: githubId.value,
      name: repositoryName.value,
      githubToken: githubToken.value,
      owner: owner.value,
    };

    if (isEditing.value) {
      await RepositoryServices.update(
        editingRepositoryId.value,
        repository
      );

      snackbar.value.show("Repository updated successfully.","green");
    } else {
      await RepositoryServices.create(projectId.value, repository);

      snackbar.value.show("Repository connected successfully.","green");
    }

    githubId.value = "";
    githubToken.value = "";
    repositoryName.value = "";
    owner.value = "";
    editingRepositoryId.value = null;
    isEditing.value = false;

    await getRepositories(projectId.value);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

function editRepository(repository) {
  editingRepositoryId.value = repository.id;
  githubId.value = repository.githubId;
  githubToken.value = repository.githubToken;
  repositoryName.value = repository.name;
  owner.value = repository.owner
  isEditing.value = true;
}

async function deleteRepository(id) {
  try {
    await RepositoryServices.delete(id);

    await getRepositories(projectId.value);

    snackbar.value.show("Repository deleted successfully.","green");
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
      {{ project.title }} Project Settings - Repositories
    </h4>
    <v-card class="mb-4">
      <v-card-title>Connect Repository</v-card-title>

      <v-card-text>
        <v-text-field
          v-model="githubId"
          label="GitHub Repository ID"
          hint="Enter the numeric ID from GitHub API"
          persistent-hint
          required
        ></v-text-field>

        <v-text-field
          v-model="repositoryName"
          label="Repository Name"
          required
        ></v-text-field>

        <v-text-field
          v-model="githubToken"
          label="Github Token"
        ></v-text-field>

        <v-text-field
          v-model="owner"
          label="Owner"
        ></v-text-field>

        <v-btn
          color="primary"
          @click="createRepository"
        >
          Connect Repository
        </v-btn>
      </v-card-text>
    </v-card>
    <v-card class="mt-4">
      <v-card-title>Connected Repositories</v-card-title>

      <v-list v-if="repositories.length">
        <v-list-item
          v-for="repository in repositories"
          :key="repository.id"
        >
          <v-list-item-title>
            {{ repository.name }}
          </v-list-item-title>

          <v-list-item-subtitle>
            GitHub ID: {{ repository.githubId }}
          </v-list-item-subtitle>

          <template v-slot:append>
              <v-btn
                size="small"
                color="primary"
                class="mr-2"
                @click="editRepository(repository)"
              >
                Edit
              </v-btn>

              <v-btn
                size="small"
                color="error"
                @click="deleteRepository(repository.id)"
              >
                Delete
              </v-btn>
          </template>
        </v-list-item>
      </v-list>

      <v-card-text v-else>
        No repositories connected to this project.
      </v-card-text>
    </v-card>

    

  </v-container>

  <SnackBar ref="snackbar" />
</template>
