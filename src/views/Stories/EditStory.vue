<script setup>
import { onMounted, ref } from "vue";
import ProjectServices from "../../services/ProjectServices.js";
import StoryServices from "../../services/StoryServices.js";
import SnackBar from "../../components/SnackBar.vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const { projectId, storyId } = useRoute().params;

const user = ref(null);
const project = ref(null);
const story = ref({ acceptanceCriteria: [] });
const snackbar = ref(null);

const drawer = ref(false);
const editingIndex = ref(null);
const draftCriterion = ref(null);
const confirmDelete = ref(false);

const statusLookup = {
  Passed: { color: "success", icon: "mdi-check" },
  Failed: { color: "error", icon: "mdi-close" },
  Pending: { color: "blue", icon: "mdi-circle-small" },
};

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  await getStory(projectId, storyId);
  await getProject(projectId);
});

async function getStory(projectId, storyId) {
  try {
    const response = await StoryServices.getStory(projectId, storyId);
    story.value = response.data;
  } catch (error) {
    console.log(error);
    snackbar.value.show(error.message);
  }
}

async function getProject(id) {
  try {
    const response = await ProjectServices.getProject(id);
    project.value = response.data;
  } catch (error) {
    console.log(error);
    snackbar.value.show(error.message);
  }
}

async function updateStory() {
  try {
    await StoryServices.updateStory(projectId, storyId, story.value);
    snackbar.value.show("Story updated successfully");
    await getStory(projectId, storyId);
    await getProject(projectId);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function deleteStory() {
  try {
    await StoryServices.deleteStory(projectId, storyId);
    router.push({ name: "projectBoard", params: { id: projectId } });
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

function addCriterion() {
  editingIndex.value = null;
  draftCriterion.value = {
    title: "",
    description: "",
    status: "Pending",
  };
  drawer.value = true;
}

function openCriterion(index) {
  editingIndex.value = index;
  draftCriterion.value = { ...story.value.acceptanceCriteria[index] };
  drawer.value = true;
}

function saveCriterion() {
  if (!story.value.acceptanceCriteria) {
    story.value.acceptanceCriteria = [];
  }
  if (editingIndex.value === null) {
    story.value.acceptanceCriteria.push(draftCriterion.value);
  } else {
    story.value.acceptanceCriteria[editingIndex.value] = draftCriterion.value;
  }
  closeDrawer();
}

function deleteCriterion() {
  if (editingIndex.value !== null) {
    story.value.acceptanceCriteria.splice(editingIndex.value, 1);
  }
  closeDrawer();
}

function closeDrawer() {
  drawer.value = false;
  editingIndex.value = null;
  draftCriterion.value = null;
}
</script>

<template>
  <v-container v-if="!project || !story">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <v-toolbar flat density="comfortable" color="transparent">
      <v-toolbar-title class="text-h5 font-weight-medium">
        {{ story.title }}
      </v-toolbar-title>
      <v-btn variant="flat" color="primary" @click="updateStory()"
        >Update Story</v-btn
      >
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-delete"
            title="Delete Story"
            base-color="error"
            @click="confirmDelete = true"
          ></v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>

    <v-row>
      <v-col cols="9">
        <v-card class="rounded-lg elevation-5">
          <v-card-text>
            <v-row no-gutters>
              <v-col class="px-2">
                <v-text-field
                  v-model="story.title"
                  label="Title"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row no-gutters>
              <v-col class="px-2">
                <v-textarea
                  v-model="story.description"
                  label="Description (TODO: support rich text if time permits)"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="rounded-lg elevation-5 mt-4">
          <v-toolbar flat density="compact" color="transparent" class="px-2">
            <v-toolbar-title class="text-subtitle-1 font-weight-medium">
              Acceptance Criteria
            </v-toolbar-title>
            <v-btn
              prepend-icon="mdi-plus"
              rounded="lg"
              text="Add Criterion"
              border
              @click="addCriterion()"
            ></v-btn>
          </v-toolbar>

          <v-list bg-color="transparent">
            <v-list-item
              v-if="
                !story.acceptanceCriteria || !story.acceptanceCriteria.length
              "
              title="No acceptance criteria yet. Click Add to create one."
              class="text-medium-emphasis text-center"
            ></v-list-item>

            <v-list-item
              v-for="(criterion, index) in story.acceptanceCriteria"
              :key="index"
              :class="
                index !== story.acceptanceCriteria.length - 1
                  ? 'border-b-sm'
                  : ''
              "
              @click="openCriterion(index)"
            >
              <template v-slot:prepend>
                <v-chip
                  :color="statusLookup[criterion.status]?.color"
                  :prepend-icon="statusLookup[criterion.status]?.icon"
                  size="small"
                  label
                  class="mr-3"
                >
                  {{ criterion.status }}
                </v-chip>
              </template>

              <v-list-item-title>
                {{ criterion.title || "Untitled criterion" }}
              </v-list-item-title>

              <template v-slot:append>
                <v-icon size="small" color="medium-emphasis">
                  mdi-chevron-right
                </v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="3">
        <v-card class="rounded-lg elevation-5">
          <v-card-text>
            <v-autocomplete
              v-model="story.stateId"
              item-title="name"
              item-value="id"
              :items="project.storyState"
              label="State"
              density="compact"
            ></v-autocomplete>
            <v-select
              label="Type"
              item-title="name"
              item-value="id"
              v-model="story.typeId"
              :items="project.storyType"
              density="compact"
            ></v-select>
            <v-select
              label="Priority"
              v-model="story.priority"
              :items="['Low', 'Medium', 'High', 'Blocker']"
              density="compact"
            ></v-select>
            <v-autocomplete
              v-model="story.estimate"
              :items="[0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]"
              label="Estimate Points (Fibonacci)"
              density="compact"
            ></v-autocomplete>
            <v-autocomplete
              v-model="story.assigneeId"
              item-title="label"
              item-value="id"
              :items="
                project.projectMembers.map((m) => ({
                  id: m.user.id,
                  label: `${m.user.firstName} ${m.user.lastName}`,
                }))
              "
              label="Assignee"
              density="compact"
            ></v-autocomplete>
            <v-autocomplete
              v-model="story.reviewerId"
              item-title="label"
              item-value="id"
              :items="
                project.projectMembers.map((m) => ({
                  id: m.user.id,
                  label: `${m.user.firstName} ${m.user.lastName}`,
                }))
              "
              label="Reviewer"
              density="compact"
            ></v-autocomplete>
            <v-autocomplete
              v-model="story.reporterId"
              item-title="label"
              item-value="id"
              :items="
                project.projectMembers.map((m) => ({
                  id: m.user.id,
                  label: `${m.user.firstName} ${m.user.lastName}`,
                }))
              "
              label="Reporter"
              density="compact"
            ></v-autocomplete>
            <v-autocomplete
              v-model="story.sprintId"
              :items="project.sprint"
              item-title="name"
              item-value="id"
              label="Sprint"
              density="compact"
            ></v-autocomplete>
            <v-autocomplete
              v-model="story.repositoryId"
              item-title="name"
              item-value="id"
              :items="project.repository"
              label="Repository"
              density="compact"
            ></v-autocomplete>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-navigation-drawer
    v-model="drawer"
    location="right"
    temporary
    width="420"
    @update:model-value="(val) => !val && closeDrawer()"
  >
    <template v-if="draftCriterion">
      <v-toolbar flat density="comfortable" color="transparent">
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          {{ editingIndex === null ? "New Criterion" : draftCriterion.title }}
        </v-toolbar-title>
        <v-btn icon="mdi-close" variant="text" @click="closeDrawer()"></v-btn>
      </v-toolbar>
      <v-divider></v-divider>

      <div class="pa-4">
        <v-select
          v-model="draftCriterion.status"
          :items="['Pending', 'Passed', 'Failed']"
          label="Status"
        ></v-select>

        <v-text-field
          v-model="draftCriterion.title"
          label="Title"
        ></v-text-field>

        <v-textarea
          v-model="draftCriterion.description"
          label="Description"
          rows="4"
          auto-grow
        ></v-textarea>

        <div class="d-flex ga-2">
          <v-btn
            v-if="editingIndex !== null"
            variant="text"
            color="error"
            prepend-icon="mdi-delete"
            @click="deleteCriterion()"
            >Delete
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDrawer()">Cancel</v-btn>
          <v-btn variant="flat" color="primary" @click="saveCriterion()">
            {{ editingIndex === null ? "Add" : "Save" }}
          </v-btn>
        </div>
      </div>
    </template>
  </v-navigation-drawer>

  <v-dialog v-model="confirmDelete" max-width="420">
    <v-card class="rounded-lg">
      <v-card-title class="text-h6">Delete Story</v-card-title>
      <v-card-text>
        Are you sure you want to delete "{{ story.title }}"? This action cannot
        be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="confirmDelete = false">Cancel</v-btn>
        <v-btn variant="flat" color="error" @click="deleteStory()"
          >Delete</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <SnackBar ref="snackbar" />
</template>
