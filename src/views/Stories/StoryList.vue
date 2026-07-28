<script setup>
import { onMounted } from "vue";
import { computed, ref } from "vue";
import StoryServices from "../../services/StoryServices.js";
import SnackBar from "../../components/SnackBar.vue";
import StackedAvatars from "../../components/StackedAvatars.vue";
import { formatDate } from "../../utils/date.js";
import { useRoute } from "vue-router";

const projectId = Number(useRoute().params.id);

const user = ref(null);
const stories = ref(null);
const snackbar = ref(null);
const search = ref("");

const stateFilter = ref([]);
const typeFilter = ref([]);
const sprintFilter = ref([]);
const assigneeFilter = ref([]);

function removeDuplicatesAndSort(array) {
  const unique = [];

  array.forEach((item) => {
    if (
      !!item.value &&
      !unique.some((existing) => existing.value === item.value)
    ) {
      unique.push(item);
    }
  });

  return unique.sort((a, b) => a.label.localeCompare(b.label));
}

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

const sprintOptions = computed(() =>
  removeDuplicatesAndSort(
    stories.value?.map((story) => ({
      value: story.sprint?.id,
      label: story.sprint?.title,
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
      (!stateFilter.value.length ||
        stateFilter.value.includes(story.state?.id)) &&
      (!typeFilter.value.length || typeFilter.value.includes(story.type?.id)) &&
      (!sprintFilter.value.length ||
        sprintFilter.value.includes(story.sprint?.id)) &&
      (!assigneeFilter.value.length ||
        assigneeFilter.value.includes(story.assignee?.id)),
  ),
);

const headers = [
  { title: "State", key: "state.name" },
  { title: "Title", key: "title" },
  {
    title: "Assignee",
    key: "assignee",
    value: (item) =>
      item.assignee
        ? `${item.assignee.firstName} ${item.assignee.lastName}`
        : "",
  },
  { title: "Sprint", key: "sprint.title" },
  { title: "Type", key: "type.name" },
  { title: "Priority", key: "priority" },
  { title: "", key: "actions", sortable: false, align: "end" },
];

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getStoriesForProject(projectId);
});

async function getStoriesForProject(projectId) {
  try {
    const response = await StoryServices.getStoriesForProject(projectId);
    stories.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
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
            <v-toolbar-title> Stories </v-toolbar-title>

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

            <v-btn
              class="me-2"
              prepend-icon="mdi-plus"
              rounded="lg"
              text="New Story"
              border
              :to="{ name: 'createStory', params: { id: projectId } }"
            ></v-btn>
          </v-toolbar>

          <v-toolbar flat>
            <v-row class="px-4" dense>
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
                  v-model="sprintFilter"
                  :items="sprintOptions"
                  item-title="label"
                  item-value="value"
                  label="Sprint"
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

        <template v-slot:item.description="{ item }">
          <div class="text-truncate" style="max-width: 300px">
            {{ item.description }}
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
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
      </v-data-table>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>