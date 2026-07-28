<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import ProjectServices from "../../../services/ProjectServices.js";
import StoryTypeServices from "../../../services/StoryTypeServices.js";
import SnackBar from "../../../components/SnackBar.vue";

const route = useRoute();

const user = ref(null);
const projectId = ref(route.params.id);
const project = ref(null);
const storyTypes = ref([]);
const snackbar = ref(null);
const editingId = ref(null);
const editName = ref("");

const confirmDelete = ref(false);
const typeToDelete = ref(null);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getProject(projectId.value);
  getStoryTypes(projectId.value);
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

async function getStoryTypes(id) {
  try {
    const response = await StoryTypeServices.getStoryTypesForProject(id);
    storyTypes.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

function getNumberOfStoriesLabel(type) {
  if (!type?.story?.length) return "";
  return `${type.story.length} user ${
    type.story.length === 1 ? "story" : "stories"
  }`;
}

function startAdding() {
  editingId.value = -1;
  editName.value = "";
}

function cancelAdding() {
  editingId.value = null;
  editName.value = "";
}

async function saveAdding() {
  if (!editName.value.trim()) {
    cancelAdding();
    return;
  }

  try {
    const response = await StoryTypeServices.createStoryType(projectId.value, {
      name: editName.value.trim(),
    });
    storyTypes.value.push(response.data);
    await getStoryTypes(projectId.value);
    snackbar.value.show("Story type created successfully!");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  } finally {
    cancelAdding();
    getStoryTypes(projectId.value);
  }
}

function startEditing(type) {
  editingId.value = type.id;
  editName.value = type.name;
}

function cancelEditing() {
  editingId.value = null;
  editName.value = "";
}

async function saveEditing(type) {
  if (editingId.value !== type.id) return;

  const name = editName.value.trim();

  if (!name || name === type.name) {
    cancelEditing();
    return;
  }

  try {
    const response = await StoryTypeServices.updateStoryType(
      projectId.value,
      type.id,
      { name },
    );
    type.name = response.data.name;
    snackbar.value.show("Story type updated successfully!");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  } finally {
    cancelEditing();
  }
}

function confirmDeleteStoryType(type) {
  typeToDelete.value = type;
  confirmDelete.value = true;
}

function cancelDeleteStoryType() {
  confirmDelete.value = false;
  typeToDelete.value = null;
}

async function deleteStoryType(type) {
  try {
    await StoryTypeServices.deleteStoryType(projectId.value, type.id);
    storyTypes.value = storyTypes.value.filter((t) => t.id !== type.id);
    snackbar.value.show("Story type deleted successfully!");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  } finally {
    confirmDelete.value = false;
    typeToDelete.value = null;
  }
}
</script>

<template>
  <v-container v-if="!project || !storyTypes">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <div class="mb-6">
      <div class="text-overline text-medium-emphasis mb-1">
        {{ project.title }} · Project Settings
      </div>
      <h4 class="pl-0 text-h5 font-weight-medium">Story Types</h4>
    </div>
    <v-card class="rounded-lg elevation-5">
      <v-list lines="two">
        <v-list-item
          v-for="(type, index) in storyTypes"
          :key="type.id"
          :subtitle="getNumberOfStoriesLabel(type)"
          :class="{
            'border-b': index < storyTypes.length - 1 || editingId === -1,
          }"
        >
          <template v-slot:prepend>
            <v-btn
              icon="mdi-pencil"
              variant="tonal"
              size="small"
              class="mr-4"
              @click="startEditing(type)"
            ></v-btn>
          </template>

          <template v-slot:title>
            <v-text-field
              v-if="editingId === type.id"
              v-model="editName"
              density="compact"
              hide-details
              autofocus
              @blur="saveEditing(type)"
              @keyup.enter="saveEditing(type)"
              @keyup.esc="cancelEditing"
            ></v-text-field>
            <span v-else>{{ type.name }}</span>
          </template>

          <template v-slot:append>
            <v-btn
              class="ml-1"
              icon="mdi-trash-can-outline"
              variant="flat"
              size="small"
              color="error"
              @click="confirmDeleteStoryType(type)"
            ></v-btn>
          </template>
        </v-list-item>
        <v-list-item v-if="editingId === -1">
          <template v-slot:prepend>
            <v-btn
              class="mr-4"
              icon="mdi-plus"
              variant="flat"
              color="secondary"
              size="small"
              @click="saveAdding"
            ></v-btn>
          </template>

          <template v-slot:title>
            <v-text-field
              v-model="editName"
              density="compact"
              hide-details
              autofocus
              @blur="saveAdding"
              @keyup.enter="saveAdding"
              @keyup.esc="cancelAdding"
            ></v-text-field>
          </template>
        </v-list-item>
      </v-list>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="startAdding"
          >New Story Type</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-container>

  <v-dialog v-model="confirmDelete" max-width="420">
    <v-card v-if="typeToDelete" class="rounded-lg">
      <v-card-title class="text-h6">Delete Story Type</v-card-title>
      <v-card-text>
        Are you sure you want to delete <b>{{ typeToDelete.name }}</b
        >?
        {{
          typeToDelete.story.length
            ? `${getNumberOfStoriesLabel(typeToDelete)} use this type and will not have any type after this.`
            : ""
        }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="cancelDeleteStoryType">Cancel</v-btn>
        <v-btn
          variant="flat"
          color="error"
          @click="deleteStoryType(typeToDelete)"
          >Delete</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <SnackBar ref="snackbar" />
</template>
