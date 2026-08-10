<script setup>
import { onMounted, ref, watch } from "vue";
import { QuillEditor, Quill } from "@vueup/vue-quill";
import MarkdownShortcuts from "quill-markdown-shortcuts";
import MagicUrl from "quill-magic-url";
import DOMPurify from "dompurify";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import ProjectServices from "../../services/ProjectServices.js";
import StoryServices from "../../services/StoryServices.js";
import AssistantServices from "../../services/AssistantServices.js";
import SnackBar from "../../components/SnackBar.vue";
import StoryRelations from "../../components/StoryRelations.vue";
import StoryAcceptanceCriteria from "../../components/StoryAcceptanceCriteria.vue";
import { useRouter, useRoute } from "vue-router";
import StoryFeed from "../../components/StoryFeed.vue";

const router = useRouter();
const route = useRoute();
const { projectId } = route.params;
const storyId = Number(route.params.storyId);

const user = ref(null);
const project = ref(null);
const story = ref({ acceptanceCriteria: [] });
const snackbar = ref(null);

const confirmDelete = ref(false);

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
  const { acceptanceCriteria, relationOne, relationTwo, ...newStoryInfo } = story.value;

  newStoryInfo.description = DOMPurify.sanitize(newStoryInfo.description ?? "");

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

const rewrite = ref(null);
const rewriteOpen = ref(false);
const rewriting = ref(false);

async function rewriteDescription() {
  rewriteOpen.value = true;
  rewriting.value = true;
  rewrite.value = null;

  try {
    const { data } = await AssistantServices.generate(
      "story_description",
      {},
      { projectId: Number(projectId), storyId },
    );

    rewrite.value = data.result;
  } catch (error) {
    console.error(error);
    rewriteOpen.value = false;
    snackbar.value.show(error.response?.data?.message ?? error.message);
  } finally {
    rewriting.value = false;
  }
}

function useRewrite() {
  story.value.description = `<p>${rewrite.value.description}</p>`;
  rewriteOpen.value = false;
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
      <v-btn variant="flat" color="primary" @click="updateStory()">Update Story</v-btn>
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
                <v-text-field v-model="story.title" label="Title (required)"></v-text-field>
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
                  <div class="d-flex align-center mt-2">
                    <p class="text-caption text-medium-emphasis">Required</p>
                    <v-spacer></v-spacer>
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="primary"
                      prepend-icon="mdi-auto-fix"
                      data-test="rewrite-description"
                      :loading="rewriting"
                      @click="rewriteDescription()"
                    >
                      Rewrite
                    </v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <div class="mt-4">
          <StoryRelations :project-id="projectId" :story-id="storyId" @error="(message) => snackbar.show(message)" />
        </div>

        <div class="mt-4">
          <StoryAcceptanceCriteria
            :project-id="projectId"
            :story-id="storyId"
            @error="(message) => snackbar.show(message)"
          />
        </div>

        <div class="mt-4">
          <StoryFeed
            :project-id="Number(projectId)"
            :story-id="Number(storyId)"
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
              label="State (required)"
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
              item-title="title"
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

  <v-dialog v-model="rewriteOpen" max-width="720">
    <v-card class="rounded-lg" data-test="rewrite">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon color="primary" size="small">mdi-auto-fix</v-icon>
        <span class="text-h6">Rewrite as a user story</span>
      </v-card-title>

      <v-card-text v-if="rewriting" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" class="mb-4" />
        <p class="text-body-2 text-medium-emphasis">Rewriting...</p>
      </v-card-text>

      <v-card-text v-else-if="rewrite">
        <div v-if="rewrite.original" class="mb-4">
          <p class="text-caption text-medium-emphasis mb-1">Now</p>
          <p class="text-body-2" style="white-space: pre-wrap">{{ rewrite.original }}</p>
        </div>

        <v-divider v-if="rewrite.original" class="mb-4"></v-divider>

        <p class="text-caption text-medium-emphasis mb-1">Rewritten</p>
        <p class="text-body-1" data-test="rewritten">{{ rewrite.description }}</p>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="rewriteOpen = false">Keep mine</v-btn>
        <v-btn v-if="rewrite" variant="flat" color="primary" data-test="accept-rewrite" @click="useRewrite()">
          Use this
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="confirmDelete" max-width="420">
    <v-card class="rounded-lg">
      <v-card-title class="text-h6">Delete Story</v-card-title>
      <v-card-text> Are you sure you want to delete "{{ story.title }}"? This action cannot be undone. </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="confirmDelete = false">Cancel</v-btn>
        <v-btn variant="flat" color="error" @click="deleteStory()">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <SnackBar ref="snackbar" />
</template>
