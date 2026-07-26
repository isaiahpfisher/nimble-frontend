<script setup>
import { onMounted, ref } from "vue";
import { QuillEditor, Quill } from "@vueup/vue-quill";
import MarkdownShortcuts from "quill-markdown-shortcuts";
import MagicUrl from "quill-magic-url";
import DOMPurify from "dompurify";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import ProjectServices from "../../services/ProjectServices.js";
import StoryServices from "../../services/StoryServices.js";
import SnackBar from "../../components/SnackBar.vue";
import { useRouter, useRoute } from "vue-router";

Quill.register(
  {
    "modules/markdownShortcuts": MarkdownShortcuts,
    "modules/magicUrl": MagicUrl,
  },
  true,
);

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    ["link"],
    [{ list: "ordered" }, { list: "bullet" }],
  ],
  markdownShortcuts: {},
  magicUrl: true,
};

const router = useRouter();
const projectId = Number(useRoute().params.id);

const user = ref(null);
const project = ref(null);
const story = ref({});
const snackbar = ref(null);

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
    const newStory = await StoryServices.createStory(projectId, {
      ...story.value,
      description: DOMPurify.sanitize(story.value.description ?? ""),
    });
    router.push({
      name: "editStory",
      params: { projectId, storyId: newStory.data.id },
    });
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
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
            <div class="mb-6">
              <QuillEditor
                v-model:content="story.description"
                content-type="html"
                :options="{
                  placeholder: 'Description',
                  modules: quillModules,
                }"
              />
            </div>
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
            <v-col class="px-2">
  <v-autocomplete
    v-model="story.sprintId"
    :items="project.sprint"
    item-title="title"
    item-value="id"
    label="Sprint"
  ></v-autocomplete>
</v-col>
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
