<script setup>
import { onMounted } from "vue";
import { computed, ref } from "vue";
import BacklogServices from "../../services/BacklogServices.js";
import ProjectServices from "../../services/ProjectServices.js";
import SprintServices from "../../services/SprintServices.js";
import SnackBar from "../../components/SnackBar.vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const projectId = Number(route.params.id);

const project = ref(null);
const stories = ref(null);
const sprints = ref([]);
const snackbar = ref(null);
const search = ref("");

const priorityFilter = ref([]);
const stateFilter = ref([]);
const typeFilter = ref([]);
const assigneeFilter = ref([]);

const assignSprintDialog = ref(false);
const selectedStory = ref(null);
const selectedSprint = ref(null);
const assigning = ref(false);

const priorityRank = {
  Blocker: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function sortByPriority(a, b) {
  return (priorityRank[a] ?? 0) - (priorityRank[b] ?? 0);
}

function removeDuplicatesAndSort(array) {
  const unique = [];

  array.forEach((item) => {
    if (!!item.value && !unique.some((existing) => existing.value === item.value)) {
      unique.push(item);
    }
  });

  return unique.sort((a, b) => a.label.localeCompare(b.label));
}

// Priorities read as a scale, so they are listed strongest first rather than
// alphabetically like the other filters.
const priorityOptions = computed(() =>
  removeDuplicatesAndSort(
    stories.value?.map((story) => ({
      value: story.priority,
      label: story.priority,
    })),
  ).sort((a, b) => sortByPriority(b.value, a.value)),
);

const stateOptions = computed(() =>
  removeDuplicatesAndSort(
    stories.value?.map((story) => ({
      value: story.state?.id,
      label: story.state?.name,
    })),
  ),
);

const typeOptions = computed(() =>
  removeDuplicatesAndSort(
    stories.value?.map((story) => ({
      value: story.type?.id,
      label: story.type?.name,
    })),
  ),
);

const assigneeOptions = computed(() =>
  removeDuplicatesAndSort(
    stories.value?.map((story) => ({
      value: story.assignee?.id,
      label: `${story.assignee?.firstName} ${story.assignee?.lastName}`,
    })),
  ),
);

const filteredStories = computed(() =>
  (stories.value ?? []).filter(
    (story) =>
      (!priorityFilter.value.length || priorityFilter.value.includes(story.priority)) &&
      (!stateFilter.value.length || stateFilter.value.includes(story.state?.id)) &&
      (!typeFilter.value.length || typeFilter.value.includes(story.type?.id)) &&
      (!assigneeFilter.value.length || assigneeFilter.value.includes(story.assignee?.id)),
  ),
);

const headers = [
  { title: "Priority", key: "priority", sort: sortByPriority },
  { title: "Title", key: "title" },
  { title: "State", key: "state.name" },
  { title: "Type", key: "type.name" },
  {
    title: "Assignee",
    key: "assignee",
    value: (item) => (item.assignee ? `${item.assignee.firstName} ${item.assignee.lastName}` : "Unassigned"),
  },
  { title: "", key: "actions", sortable: false, align: "end" },
];

onMounted(async () => {
  await getProject(projectId);
  await getBacklogForProject(projectId);
  await getSprints(projectId);
});

async function getProject(projectId) {
  try {
    const response = await ProjectServices.getProject(projectId);
    project.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function getBacklogForProject(projectId) {
  try {
    const response = await BacklogServices.getBacklogForProject(projectId);
    stories.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function getSprints(projectId) {
  try {
    const response = await SprintServices.getSprintsForProject(projectId);
    sprints.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

function openAssignSprint(story) {
  selectedStory.value = story;
  selectedSprint.value = null;
  assignSprintDialog.value = true;
}

async function assignSprint() {
  if (!selectedStory.value || !selectedSprint.value) {
    return;
  }

  assigning.value = true;

  try {
    await BacklogServices.assignSprint(projectId, selectedStory.value.id, selectedSprint.value);

    stories.value = stories.value.filter((story) => story.id !== selectedStory.value.id);

    snackbar.value.show(`${selectedStory.value.title} assigned to sprint`, "success");

    assignSprintDialog.value = false;
    selectedStory.value = null;
    selectedSprint.value = null;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  } finally {
    assigning.value = false;
  }
}

function goToSprintPage() {
  assignSprintDialog.value = false;

  router.push({
    name: "projectSprints",
    params: {
      id: projectId,
    },
  });
}
</script>

<template>
  <v-container v-if="!stories">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>

  <v-container v-else>
    <v-card variant="flat" border rounded="lg">
      <v-data-table
        v-model:search="search"
        :filter-keys="['title', 'description']"
        :items="filteredStories"
        :headers="headers"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title> {{ project?.title }} — Backlog </v-toolbar-title>

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

            <span class="text-medium-emphasis me-4">
              {{ filteredStories.length }}
              {{ filteredStories.length === 1 ? "story" : "stories" }}
            </span>
          </v-toolbar>

          <v-toolbar flat>
            <v-row class="px-4" dense>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="priorityFilter"
                  :items="priorityOptions"
                  item-title="label"
                  item-value="value"
                  label="Priority"
                  density="compact"
                  variant="solo-filled"
                  flat
                  hide-details
                  multiple
                  clearable
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="stateFilter"
                  :items="stateOptions"
                  item-title="label"
                  item-value="value"
                  label="State"
                  density="compact"
                  variant="solo-filled"
                  flat
                  hide-details
                  multiple
                  clearable
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="typeFilter"
                  :items="typeOptions"
                  item-title="label"
                  item-value="value"
                  label="Type"
                  density="compact"
                  variant="solo-filled"
                  flat
                  hide-details
                  multiple
                  clearable
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="assigneeFilter"
                  :items="assigneeOptions"
                  item-title="label"
                  item-value="value"
                  label="Assignee"
                  density="compact"
                  variant="solo-filled"
                  flat
                  hide-details
                  multiple
                  clearable
                ></v-select>
              </v-col>
            </v-row>
          </v-toolbar>
        </template>

        <template v-slot:item.priority="{ item }">
          <v-chip size="small" variant="tonal">
            {{ item.priority ?? "N/A" }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn color="primary" size="small" variant="text" @click="openAssignSprint(item)"> Assign to Sprint </v-btn>

          <v-btn
            color="primary"
            size="small"
            variant="text"
            prepend-icon="mdi-pencil"
            :to="{
              name: 'editStory',
              params: { projectId: projectId, storyId: item.id },
            }"
          >
            Edit
          </v-btn>
        </template>

        <template v-slot:no-data>
          <div class="empty-state">
            <div class="text-h6">No stories in backlog</div>
            <div class="text-medium-emphasis">There are no not-started stories in the backlog.</div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="assignSprintDialog" max-width="500">
      <v-card rounded="lg">
        <v-card-title>Assign Story to Sprint</v-card-title>

        <v-card-text>
          <div v-if="selectedStory" class="mb-4">
            <div class="text-caption text-medium-emphasis">Story</div>
            <div class="text-body-1 font-weight-medium">
              {{ selectedStory.title }}
            </div>
          </div>

          <v-select
            v-model="selectedSprint"
            :items="sprints"
            item-title="title"
            item-value="id"
            label="Select Sprint"
            variant="outlined"
            clearable
          ></v-select>

          <v-btn variant="text" @click="goToSprintPage"> Create New Sprint </v-btn>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn variant="text" @click="assignSprintDialog = false"> Cancel </v-btn>

          <v-btn color="primary" variant="flat" :disabled="!selectedSprint" :loading="assigning" @click="assignSprint">
            Assign
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>

  <SnackBar ref="snackbar" />
</template>

<style scoped>
.empty-state {
  padding: 48px 16px;
  text-align: center;
}
</style>
