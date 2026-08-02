<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import ProjectServices from "../../services/ProjectServices";
import SnackBar from "../../components/SnackBar.vue";
import StoryBoard from "../../components/StoryBoard.vue";
import StoryStateServices from "../../services/StoryStateServices";
import StoryServices from "../../services/StoryServices";
import { useRouter } from "vue-router";
import draggable from "vuedraggable";

const route = useRoute();
const router = useRouter();

const user = ref(null);
const projectId = ref(route.params.id);
const project = ref(null);
const sprintId = ref(null);
const snackbar = ref(null);
const storyStates = ref(null);
const stories = ref(null);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getProject(projectId.value);
  getStoryStates(projectId.value);
  getStories(projectId.value);
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

async function getStories(id) {
  try {
    const response = await StoryServices.getStoriesForProject(id);
    stories.value = response.data;
    console.log(stories.value);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function handleDrop(event, stateId) {
  console.log(event);
  if (!event.added) return;
  var story = event.added.element;
  story.stateId = stateId;

  try {
    await StoryServices.updateStory(projectId, story.id, story);
    snackbar.value.show("User Story updated.");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

function editStory(storyId) {
  router.push({ path: "/projects/" + projectId.value + "/stories/" + storyId });
}
</script>

<template>
  <v-container v-if="!project || !stories">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <h4 class="pl-0 text-h5 mb-6 font-weight-medium">{{ project.title }} - Storyboard</h4>
    <v-row>
      <v-col v-for="(storyState, i) in storyStates" :key="i">
        <v-card class="rounded" elevation-5>
          <v-card-title class="text-h6">{{ storyState.name }}</v-card-title>
          <draggable
            item-key="id"
            :list="stories.filter((element) => element.stateId == storyState.id)"
            group="stories"
            animation="200"
            @change="(event) => handleDrop(event, storyState.id)"
            ><template #item="{ element, index }">
              <v-list-item
                :key="element.id"
                :class="{
                  'border-b': index < storyStates.length - 1,
                }"
                :to="{
                  name: 'editStory',
                  params: { projectId: projectId, storyId: element.id },
                }"
              >
                <template v-slot:prepend>
                  <v-icon class="text-medium-emphasis cursor-grab" icon="mdi-drag"></v-icon>
                </template>

                <v-tooltip text="Tooltip">
                  <template v-slot:activator="{ props }">
                    {{ element.title }}
                  </template>
                </v-tooltip>
              </v-list-item>
            </template>
          </draggable>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
