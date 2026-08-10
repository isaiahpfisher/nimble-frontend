<script setup>
import { onMounted, computed } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import SprintServices from "../../../services/SprintServices.js";
import BacklogServices from "../../../services/BacklogServices.js";
import StoryServices from "../../../services/StoryServices.js";
import SnackBar from "../../../components/SnackBar.vue";
import DOMPurify from "dompurify";

const priorityRank = {
  Blocker: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const route = useRoute();

const user = ref(null);
const projectId = ref(route.params.projectId);
const sprintId = ref(route.params.sprintId);
const sprint = ref(null);
const backlog = ref([]);
const backlogSearch = ref("");
const sprintSearch = ref("");
const snackbar = ref(null);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getSprint(sprintId.value);
  getBacklog(sprintId.value);
});

async function getSprint(id) {
  try {
    const response = await SprintServices.getSprint(id);
    sprint.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function getBacklog(id) {
  try {
    const response = await BacklogServices.getBacklogForProject(projectId.value);
    backlog.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

const renderContent = (content) => {
  return DOMPurify.sanitize(content ?? "");
};

const filteredBacklog = computed(() =>
  backlog.value
    .filter(
      (story) =>
        !backlogSearch.value.length ||
        story.title.toLowerCase().includes(backlogSearch.value.toLowerCase()) ||
        !backlogSearch.value.length ||
        story.description.toLowerCase().includes(backlogSearch.value.toLowerCase()),
    )
    .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]),
);

const filteredSprintStories = computed(() =>
  sprint.value?.story
    .filter(
      (story) =>
        !sprintSearch.value.length ||
        story.title.toLowerCase().includes(sprintSearch.value.toLowerCase()) ||
        !sprintSearch.value.length ||
        story.description.toLowerCase().includes(sprintSearch.value.toLowerCase()),
    )
    .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]),
);

const totalPoints = (stories) => (stories ?? []).reduce((acc, story) => acc + (story.estimate ?? 0), 0);

const backlogPoints = computed(() => totalPoints(filteredBacklog.value));

const sprintPoints = computed(() => totalPoints(filteredSprintStories.value));

async function addToSprint(story) {
  try {
    await BacklogServices.assignSprint(projectId.value, story.id, sprintId.value);
    sprint.value.story.unshift(story);
    backlog.value = backlog.value.filter((s) => s.id !== story.id);
    snackbar.value.show("Story added to sprint.");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function removeFromSprint(story) {
  try {
    await StoryServices.updateStory(projectId.value, story.id, { sprintId: null });
    sprint.value.story = sprint.value.story.filter((s) => s.id !== story.id);
    backlog.value.unshift(story);
    snackbar.value.show("Story removed from sprint.");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-container v-if="!sprint">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <v-row>
      <v-col>
        <v-card>
          <v-toolbar color="primary" density="compact" flat :extension-height="40">
            <v-toolbar-title>Backlog</v-toolbar-title>

            <v-text-field
              v-model="backlogSearch"
              class="me-2"
              density="compact"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              flat
              hide-details
              single-line
            ></v-text-field>

            <template v-slot:extension>
              <div class="mx-2 ga-2 d-flex">
                <v-chip size="small" variant="outlined">
                  {{ filteredBacklog.length }} {{ filteredBacklog.length === 1 ? "story" : "stories" }}
                </v-chip>

                <v-chip size="small" variant="flat" color="white" class="text-primary font-weight-bold">
                  {{ backlogPoints }} estimate pts
                </v-chip>
              </div>
            </template>
          </v-toolbar>

          <v-list>
            <v-hover v-for="story in filteredBacklog" :key="story.id" v-slot="{ isHovering, props }">
              <v-list-item class="py-3 cursor-pointer" link @click="() => addToSprint(story)">
                <v-list-item-title>{{ story.title }}</v-list-item-title>

                <v-list-item-subtitle
                  v-html="renderContent(story.description)"
                  class="text-body-2 text-gray"
                ></v-list-item-subtitle>

                <div class="d-flex flex-wrap ga-1 mt-2">
                  <v-chip size="small" variant="tonal" color="primary">Priority: {{ story.priority ?? "N/A" }}</v-chip>
                  <v-chip size="small" variant="tonal" color="primary">
                    Estimate: {{ story.estimate ?? "—" }}pts
                  </v-chip>
                </div>

                <template #append>
                  <v-icon color="primary" :class="isHovering ? 'opacity-40' : 'opacity-100'"
                    >mdi-arrow-right-circle-outline</v-icon
                  >
                </template>
              </v-list-item>
            </v-hover>

            <v-list-item v-if="!filteredBacklog.length">
              <v-list-item-title class="text-gray text-body-2">No stories in the backlog.</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col>
        <v-card>
          <v-toolbar color="primary" density="compact" flat :extension-height="40">
            <v-toolbar-title>{{ sprint.title }}</v-toolbar-title>
            <v-text-field
              v-model="sprintSearch"
              class="me-2"
              density="compact"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              flat
              hide-details
              single-line
            ></v-text-field>

            <template v-slot:extension>
              <div class="mx-2 ga-2 d-flex">
                <v-chip size="small" variant="outlined">
                  {{ filteredSprintStories.length }} {{ filteredSprintStories.length === 1 ? "story" : "stories" }}
                </v-chip>

                <v-chip size="small" variant="flat" color="white" class="text-primary font-weight-bold">
                  {{ sprintPoints }} estimate pts
                </v-chip>
              </div>
            </template>
          </v-toolbar>

          <v-list>
            <v-hover v-for="story in filteredSprintStories" :key="story.id" v-slot="{ isHovering, props }">
              <v-list-item class="py-3 cursor-pointer" link @click="() => removeFromSprint(story)">
                <v-list-item-title>{{ story.title }}</v-list-item-title>

                <v-list-item-subtitle
                  v-html="renderContent(story.description)"
                  class="text-body-2 text-gray"
                ></v-list-item-subtitle>

                <div class="d-flex flex-wrap ga-1 mt-2">
                  <v-chip size="small" variant="tonal" color="primary">Priority: {{ story.priority ?? "N/A" }}</v-chip>
                  <v-chip size="small" variant="tonal" color="primary">Estimate: {{ story.estimate }}pts</v-chip>
                </div>

                <template #prepend>
                  <v-icon color="primary" :class="isHovering ? 'opacity-40' : 'opacity-100'"
                    >mdi-arrow-left-circle-outline</v-icon
                  >
                </template>
              </v-list-item>
            </v-hover>

            <v-list-item v-if="!filteredSprintStories.length">
              <v-list-item-title class="text-gray text-body-2">No stories planned for this sprint.</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
