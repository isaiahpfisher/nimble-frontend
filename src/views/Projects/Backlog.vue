<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import BacklogServices from "../../services/BacklogServices.js";
import SprintServices from "../../services/SprintServices.js";
import SnackBar from "../../components/SnackBar.vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const projectId = Number(route.params.id);

const stories = ref(null);
const sprints = ref([]);
const snackbar = ref(null);

const assignSprintDialog = ref(false);
const selectedStory = ref(null);
const selectedSprint = ref(null);
const assigning = ref(false);

onMounted(async () => {
  await getBacklogForProject(projectId);
  await getSprints(projectId);
});

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
      <v-toolbar flat>
        <v-toolbar-title> Backlog </v-toolbar-title>

        <v-spacer></v-spacer>

        <span class="text-medium-emphasis me-4">
          {{ stories.length }}
          {{ stories.length === 1 ? "story" : "stories" }}
        </span>
      </v-toolbar>

      <v-divider></v-divider>

      <div class="backlog-table">
        <div class="backlog-header">
          <div>Priority</div>
          <div>Title</div>
          <div>Type</div>
          <div>Assignee</div>
          <div class="action-column">Action</div>
        </div>

        <div v-for="element in stories" :key="element.id" class="backlog-row">
          <div>
            <v-chip size="small" variant="tonal">
              {{ element.priority }}
            </v-chip>
          </div>

          <div class="text-truncate">
            {{ element.title }}
          </div>

          <div>
            {{ element.type?.name }}
          </div>

          <div>
            {{ element.assignee ? `${element.assignee.firstName} ${element.assignee.lastName}` : "Unassigned" }}
          </div>

          <div class="action-column">
            <v-btn color="primary" size="small" variant="text" class="px-0" @click="openAssignSprint(element)">
              Assign to Sprint
            </v-btn>
          </div>
        </div>

        <div v-if="stories.length === 0" class="empty-state">
          <div class="text-h6">No stories in backlog</div>
          <div class="text-medium-emphasis">There are no not-started stories in the backlog.</div>
        </div>
      </div>
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
.backlog-header,
.backlog-row {
  display: grid;
  grid-template-columns:
    90px
    minmax(200px, 340px)
    100px
    170px
    170px;

  align-items: center;
  min-height: 56px;
  padding: 0 16px;
  gap: 8px;
  min-width: 850px;
}

.backlog-header {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.backlog-row:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.action-column {
  text-align: left;
}

.empty-state {
  padding: 48px 16px;
  text-align: center;
}
</style>
