<script setup>
import { onMounted, nextTick, ref } from "vue";
import ProjectServices from "../../services/ProjectServices.js";
import StoryServices from "../../services/StoryServices.js";
import SnackBar from "../../components/SnackBar.vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const projectId = Number(useRoute().params.id);

const user = ref(null);
const project = ref(null);
const story = ref({ acceptanceCriteria: [] });
const snackbar = ref(null);
const criterionInputs = ref([]);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  await getProject(projectId);
});

async function getProject(id) {
  try {
    const response = await ProjectServices.getProject(id);
    project.value = response.data;
    story.value = {
      ...story.value,
      stateId: project.value.storyState?.[0]?.id,
    };
  } catch (error) {
    console.log(error);
    snackbar.value.show(error.message);
  }
}

async function createStory() {
  try {
    const newStory = await StoryServices.createStory(projectId, story.value);
    router.push({
      name: "editStory",
      params: { projectId, storyId: newStory.data.id },
    });
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

function addCriterion() {
  if (!story.value.acceptanceCriteria) {
    story.value.acceptanceCriteria = [];
  }
  story.value.acceptanceCriteria.push({
    title: "",
    description: "",
    status: "Pending",
  });

  nextTick(() => {
    const last = criterionInputs.value[criterionInputs.value.length - 1];
    last?.focus();
  });
}

function deleteCriterion(index) {
  story.value.acceptanceCriteria.splice(index, 1);
}
</script>

<template>
  <v-container v-if="!project">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <h4 class="pl-0 text-h5 mb-6 font-weight-medium">Create Story</h4>

    <v-card class="rounded-lg elevation-5">
      <v-card-text>
        <v-row no-gutters>
          <v-col class="px-2">
            <v-text-field v-model="story.title" label="Title"></v-text-field>
          </v-col>
          <v-col class="px-2">
            <v-autocomplete
              v-model="story.stateId"
              item-title="name"
              item-value="id"
              :items="project.storyState"
              label="State"
            ></v-autocomplete>
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
        <v-row no-gutters>
          <v-col class="px-2">
            <v-select
              label="Type"
              item-title="name"
              item-value="id"
              v-model="story.typeId"
              :items="project.storyType"
            ></v-select>
          </v-col>
          <v-col>
            <v-select
              label="Priority"
              v-model="story.priority"
              :items="['Low', 'Medium', 'High', 'Blocker']"
            ></v-select>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col class="px-2">
            <v-autocomplete
              v-model="story.estimate"
              :items="[0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]"
              label="Estimate Points (Fibonacci)"
            ></v-autocomplete>
          </v-col>
          <v-col class="px-2">
            <v-autocomplete
              v-model="story.sprintId"
              :items="project.sprint"
              item-title="name"
              item-value="id"
              label="Sprint"
            ></v-autocomplete>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col class="px-2">
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
            ></v-autocomplete>
          </v-col>
          <v-col class="px-2">
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
            ></v-autocomplete>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col class="px-2">
            <v-autocomplete
              v-model="story.repositoryId"
              item-title="name"
              item-value="id"
              :items="project.repository"
              label="Repository"
            ></v-autocomplete>
          </v-col>
        </v-row>

        <v-toolbar flat density="compact" color="transparent" class="px-2">
          <v-toolbar-title class="text-subtitle-1 font-weight-medium">
            Acceptance Criteria
          </v-toolbar-title>

          <v-btn
            prepend-icon="mdi-plus"
            rounded="lg"
            text="Add"
            border
            @click="addCriterion()"
          ></v-btn>
        </v-toolbar>

        <v-list bg-color="transparent">
          <v-list-item
            v-if="!story.acceptanceCriteria || !story.acceptanceCriteria.length"
            title="No acceptance criteria yet. Click Add to create one."
            class="text-medium-emphasis text-center"
          ></v-list-item>

          <v-list-item
            v-for="(criterion, index) in story.acceptanceCriteria"
            :key="index"
            :class="
              index !== story.acceptanceCriteria.length - 1
                ? 'border-b-sm py-2'
                : ''
            "
          >
            <v-text-field
              ref="criterionInputs"
              v-model="criterion.title"
              placeholder="Acceptance criterion"
              variant="plain"
              density="compact"
              hide-details
            ></v-text-field>
            <v-textarea
              v-model="criterion.description"
              placeholder="Add a description (optional)"
              variant="plain"
              density="compact"
              rows="1"
              auto-grow
              hide-details
            ></v-textarea>

            <template v-slot:append>
              <v-btn
                icon="mdi-close"
                size="small"
                variant="text"
                @click="deleteCriterion(index)"
              ></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="createStory()"
          >Create Story</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
