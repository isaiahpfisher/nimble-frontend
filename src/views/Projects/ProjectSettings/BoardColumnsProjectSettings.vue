<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import ProjectServices from "../../../services/ProjectServices.js";
import StoryStateServices from "../../../services/StoryStateServices.js";
import SnackBar from "../../../components/SnackBar.vue";
import draggable from "vuedraggable";

const route = useRoute();

const user = ref(null);
const projectId = ref(route.params.id);
const project = ref(null);
const storyStates = ref([]);
const snackbar = ref(null);
const editingId = ref(null);
const editName = ref("");

const confirmDelete = ref(false);
const stateToDelete = ref(null);
const fallbackStateId = ref(null);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getProject(projectId.value);
  getStoryStates(projectId.value);
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

async function getStoryStates(id) {
  try {
    const response = await StoryStateServices.getStoryStatesForProject(id);
    storyStates.value = response.data;
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
    snackbar.value.show("Git branch settings updated successfully!");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
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
    const response = await StoryStateServices.createStoryState(
      projectId.value,
      {
        name: editName.value.trim(),
        order: Math.max(...storyStates.value.map((state) => state.order)) + 1,
      },
    );
    storyStates.value.push(response.data);
    snackbar.value.show("Story state created successfully!");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  } finally {
    cancelAdding();
  }
}

function startEditing(state) {
  editingId.value = state.id;
  editName.value = state.name;
}

function cancelEditing() {
  editingId.value = null;
  editName.value = "";
}

async function saveEditing(state) {
  if (editingId.value !== state.id) return;

  const name = editName.value.trim();

  if (!name || name === state.name) {
    cancelEditing();
    return;
  }

  try {
    const response = await StoryStateServices.updateStoryState(
      projectId.value,
      state.id,
      { name },
    );
    state.name = response.data.name;
    snackbar.value.show("Story state updated successfully!");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  } finally {
    cancelEditing();
  }
}

function confirmDeleteStoryState(state) {
  stateToDelete.value = state;
  fallbackStateId.value = null;
  confirmDelete.value = true;
}

function cancelDeleteStoryState() {
  confirmDelete.value = false;
  stateToDelete.value = null;
  fallbackStateId.value = null;
}

async function deleteStoryState(state) {
  try {
    await StoryStateServices.deleteStoryState(
      projectId.value,
      state.id,
      fallbackStateId.value,
    );
    storyStates.value = storyStates.value.filter((s) => s.id !== state.id);
    snackbar.value.show("Story state deleted successfully!");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  } finally {
    confirmDelete.value = false;
    stateToDelete.value = null;
    fallbackStateId.value = null;
  }
}

async function handleDrop(event) {
  if (!event.moved) return;

  const states = storyStates.value.map((s, i) => ({
    ...s,
    order: i + 1,
  }));

  try {
    await StoryStateServices.reorderStoryStates(projectId.value, states);
    snackbar.value.show("Order updated.");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  } finally {
    await getStoryStates(projectId.value);
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
      <h4 class="pl-0 text-h5 font-weight-medium">
        Story States / Board Columns
      </h4>
    </div>

    <v-card class="rounded-lg elevation-5 mb-6">
      <v-card-title class="text-h6">Git Branch Settings</v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <v-select
              v-model="project.branchCreationStateId"
              :items="storyStates"
              item-title="name"
              item-value="id"
              label="Choose a state"
              :hint="`A git branch will be created when a story is moved to ${storyStates.find((s) => s.id == project.branchCreationState)?.name ?? 'this state'}.`"
              persistent-hint
              clearable
            ></v-select>
          </v-col>
          <v-col>
            <v-select
              v-model="project.prReviewStateId"
              :items="storyStates"
              item-title="name"
              item-value="id"
              label="Choose a state"
              :hint="`Stories will be moved to ${storyStates.find((s) => s.id == project.prReviewState)?.name ?? 'this state'} when a PR is opened.`"
              persistent-hint
              clearable
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="updateProject()"
          >Update Git Settings</v-btn
        >
      </v-card-actions>
    </v-card>

    <v-card class="rounded-lg elevation-5">
      <v-card-title class="text-h6">Story States</v-card-title>
      <v-list lines="two">
        <draggable
          v-model="storyStates"
          item-key="id"
          animation="200"
          @change="handleDrop"
        >
          <template #item="{ element, index }">
            <v-list-item
              :key="element.id"
              class="cursor-grab"
              :class="{
                'border-b': index < storyStates.length - 1 || editingId === -1,
              }"
            >
              <template v-slot:prepend>
                <v-icon class="text-medium-emphasis" icon="mdi-drag"></v-icon>
              </template>

              <template v-slot:title>
                <v-text-field
                  v-if="editingId === element.id"
                  v-model="editName"
                  density="compact"
                  hide-details
                  autofocus
                  @blur="saveEditing(element)"
                  @keyup.enter="saveEditing(element)"
                  @keyup.esc="cancelEditing"
                ></v-text-field>
                <span v-else>{{ element.name }}</span>
              </template>

              <template v-slot:append>
                <v-btn
                  icon="mdi-pencil"
                  variant="tonal"
                  size="small"
                  @click="startEditing(element)"
                ></v-btn>
                <v-btn
                  class="ml-1"
                  icon="mdi-trash-can-outline"
                  variant="flat"
                  size="small"
                  color="error"
                  @click="confirmDeleteStoryState(element)"
                ></v-btn>
              </template>
            </v-list-item>
          </template>
        </draggable>
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
          >New Story State</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-container>

  <v-dialog v-model="confirmDelete" max-width="420">
    <v-card v-if="stateToDelete" class="rounded-lg">
      <v-card-title class="text-h6">Delete Story State</v-card-title>
      <v-card-text>
        <p class="mb-4">
          Are you sure you want to delete <b>{{ stateToDelete.name }}</b
          >? Any stories in this state will be reassigned.
        </p>
        <v-select
          v-model="fallbackStateId"
          :items="storyStates.filter((s) => s.id !== stateToDelete.id)"
          item-title="name"
          item-value="id"
          label="Reassign stories to"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="cancelDeleteStoryState">Cancel</v-btn>
        <v-btn
          variant="flat"
          color="error"
          :disabled="!fallbackStateId"
          @click="deleteStoryState(stateToDelete)"
          >Delete</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <SnackBar ref="snackbar" />
</template>
