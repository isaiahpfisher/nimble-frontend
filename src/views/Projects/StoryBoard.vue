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
//import draggable from "vuedraggable";

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

/*
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
*/

function editStory(storyId){
  router.push({path: '/projects/'+projectId.value+'/stories/'+storyId});
}

</script>

<template>
  <v-container v-if="!project">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <h4 class="pl-0 text-h5 mb-6 font-weight-medium">
      {{ project.title }} - Story Board
    </h4>
<v-row>
  <v-col 
  v-for="(storyState, i) in storyStates"
  :key="i"
  cols="auto"
  md="3">
  <v-card class="rounded" elevation-5>
      <v-card-title class="text-h6">{{ storyState.name }}</v-card-title>
          <draggable
            v-model="element"
            item-key="id"
            animation="200"
            @change="handleDrop"
          ><template v-for="(element, index) in stories">
              <v-list-item 
                v-if ="element.stateId == storyState.id"
                :key="element.id"
                class="cursor-grab"
                :class="{
                  'border-b': index < storyStates.length - 1 || editingId === -1,
                }"
              >
                <template v-slot:prepend>
                  <v-icon class="text-medium-emphasis" icon="mdi-drag"></v-icon>
                </template>

                <template v-slot:title white-space:pre-wrap>
                  {{ element.title }}
                </template>

                <template v-slot:append>
                  <v-btn
                    icon="mdi-pencil"
                    variant="tonal"
                    size="small"
                    @click="editStory(element.id)"
                  ></v-btn>
                </template>
              </v-list-item>
            </template>
          </draggable>
      </v-card>
  </v-col>
  </v-row>
    </v-container>

  <SnackBar ref="snackbar" />
</template>

