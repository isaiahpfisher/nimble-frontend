<script setup>
import { onMounted, ref, watch } from "vue";
import ProjectServices from "../../services/ProjectServices.js";
import StoryServices from "../../services/StoryServices.js";
import SnackBar from "../../components/SnackBar.vue";
import StoryRelations from "../../components/StoryRelations.vue";
import StoryAcceptanceCriteria from "../../components/StoryAcceptanceCriteria.vue";
import { useRouter, useRoute } from "vue-router";
import Comments from "../../components/Comments.vue";

const router = useRouter();
const route = useRoute();
const { projectId } = route.params;
const storyId = Number(route.params.storyId);

const user = ref(null);
const project = ref(null);
const story = ref({ acceptanceCriteria: [] });
const projectStories = ref([]);
const snackbar = ref(null);

const confirmDelete = ref(false);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  await getStory(projectId, storyId);
  await getProject(projectId);
  await getProjectStories(projectId);
});

watch(storyId, async (id) => {
  await getStory(projectId, id);
  await getProjectStories(projectId);
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

async function getProjectStories(id) {
  try {
    const response = await StoryServices.getStoriesForProject(id);
    projectStories.value = response.data;
  } catch (error) {
    console.log(error);
    snackbar.value.show(error.message);
  }
}

async function updateStory() {
  const { acceptanceCriteria, relationOne, relationTwo, ...newStoryInfo } =
    story.value;

  try {
    await StoryServices.updateStory(projectId, storyId, newStoryInfo);
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
                  auto-grow
                  rows="3"
                  label="Description (TODO: support rich text if time permits)"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <div class="mt-4">
          <StoryRelations
            :project-id="projectId"
            :story-id="storyId"
            :story="story"
            :project-stories="projectStories"
            @changed="getStory(projectId, storyId)"
            @error="(message) => snackbar.show(message)"
          />
        </div>

        <div class="mt-4">
          <StoryAcceptanceCriteria
            :project-id="projectId"
            :story-id="storyId"
            :criteria="story.acceptanceCriteria ?? []"
            @changed="getStory(projectId, storyId)"
            @error="(message) => snackbar.show(message)"
          />
        </div>

        <div class="mt-4">
          <Comments
            :project-id="projectId"
            :story-id="storyId"
            @error="(message) => snackbar.show(message)"
          />
        </div>
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
