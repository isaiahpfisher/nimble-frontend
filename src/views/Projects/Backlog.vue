<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import draggable from "vuedraggable";

const route = useRoute();
const router = useRouter();

const projectId = Number(route.params.id);

const assignSprintDialog = ref(false);
const selectedStory = ref(null);
const selectedSprint = ref(null);

const stories = ref([
  {
    id: 1,
    title: "Fix login security",
    priority: "Blocker",
    state: {
      id: 1,
      name: "Not Started",
    },
    type: {
      id: 1,
      name: "Bug",
    },
    assignee: {
      id: 1,
      firstName: "Bob",
      lastName: "Builder",
    },
    sprint: null,
    rank: 1,
  },
  {
    id: 2,
    title: "Add password reset",
    priority: "High",
    state: {
      id: 2,
      name: "Ready",
    },
    type: {
      id: 2,
      name: "Feature",
    },
    assignee: {
      id: 2,
      firstName: "Erin",
      lastName: "Engineer",
    },
    sprint: null,
    rank: 2,
  },
  {
    id: 3,
    title: "Improve dashboard",
    priority: "High",
    state: {
      id: 2,
      name: "Ready",
    },
    type: {
      id: 2,
      name: "Feature",
    },
    assignee: {
      id: 3,
      firstName: "Dave",
      lastName: "Designer",
    },
    sprint: null,
    rank: 3,
  },
  {
    id: 4,
    title: "Add dark mode",
    priority: "Medium",
    state: {
      id: 1,
      name: "Not Started",
    },
    type: {
      id: 2,
      name: "Feature",
    },
    assignee: {
      id: 1,
      firstName: "Bob",
      lastName: "Builder",
    },
    sprint: null,
    rank: 4,
  },
]);

const sprints = ref([
  {
    id: 1,
    name: "Sprint 1",
  },
  {
    id: 2,
    name: "Sprint 2",
  },
  {
    id: 3,
    name: "Sprint 3",
  },
]);

const backlogStories = computed(() =>
  stories.value.filter((story) => !story.sprint),
);

function updateRanks() {
  backlogStories.value.forEach((story, index) => {
    story.rank = index + 1;
  });
}

function openAssignSprint(story) {
  selectedStory.value = story;
  selectedSprint.value = null;
  assignSprintDialog.value = true;
}

function assignSprint() {
  if (!selectedStory.value || !selectedSprint.value) {
    return;
  }

  const sprint = sprints.value.find(
    (item) => item.id === selectedSprint.value,
  );

  if (!sprint) {
    return;
  }

  selectedStory.value.sprint = sprint;

  assignSprintDialog.value = false;
  selectedStory.value = null;
  selectedSprint.value = null;
}

function goToSprintPage() {
  assignSprintDialog.value = false;

  router.push({
    name: "sprints",
    params: {
      id: projectId,
    },
  });
}
</script>

<template>
  <v-container>
    <v-card variant="flat" border rounded="lg">
      <!-- Page Header -->
      <v-toolbar flat>
        <v-toolbar-title>
          Backlog
        </v-toolbar-title>

        <v-spacer></v-spacer>

        <span class="text-medium-emphasis me-4">
          {{ backlogStories.length }}
          {{ backlogStories.length === 1 ? "story" : "stories" }}
        </span>
      </v-toolbar>

      <v-divider></v-divider>

      <!-- Backlog Table -->
      <div class="backlog-table">
        <!-- Table Header -->
        <div class="backlog-header">
          <div class="rank-column">
            Rank
          </div>

          <div>
            Priority
          </div>

          <div>
            Title
          </div>

          <div>
            State
          </div>

          <div>
            Type
          </div>

          <div>
            Assignee
          </div>

          <div class="action-column">
            Action
          </div>
        </div>

        <!-- Draggable Stories -->
        <draggable
          :list="backlogStories"
          item-key="id"
          handle=".drag-handle"
          ghost-class="ghost"
          @end="updateRanks"
        >
          <template #item="{ element }">
            <div class="backlog-row">
              <!-- Rank -->
              <div class="rank-column">
                <span class="drag-handle">
                  ≡
                </span>

                <span>
                  {{ element.rank }}
                </span>
              </div>

              <!-- Priority -->
              <div>
                <v-chip
                  size="small"
                  variant="tonal"
                >
                  {{ element.priority }}
                </v-chip>
              </div>

              <!-- Title -->
              <div class="text-truncate">
                {{ element.title }}
              </div>

              <!-- State -->
              <div>
                {{ element.state?.name }}
              </div>

              <!-- Type -->
              <div>
                {{ element.type?.name }}
              </div>

              <!-- Assignee -->
              <div>
                {{
                  element.assignee
                    ? `${element.assignee.firstName} ${element.assignee.lastName}`
                    : "Unassigned"
                }}
              </div>

              <!-- Action -->
              <div class="action-column">
                <v-btn
                  color="primary"
                  size="small"
                  variant="text"
                  @click="openAssignSprint(element)"
                >
                  Assign to Sprint
                </v-btn>
              </div>
            </div>
          </template>
        </draggable>

        <!-- Empty State -->
        <div
          v-if="backlogStories.length === 0"
          class="empty-state"
        >
          <div class="text-h6">
            No stories in backlog
          </div>

          <div class="text-medium-emphasis">
            There are no stories in the backlog.
          </div>
        </div>
      </div>
    </v-card>

    <!-- Assign Sprint Dialog -->
    <v-dialog
      v-model="assignSprintDialog"
      max-width="500"
    >
      <v-card rounded="lg">
        <v-card-title>
          Assign Story to Sprint
        </v-card-title>

        <v-card-text>
          <div
            v-if="selectedStory"
            class="mb-4"
          >
            <div class="text-caption text-medium-emphasis">
              Story
            </div>

            <div class="text-body-1 font-weight-medium">
              {{ selectedStory.title }}
            </div>
          </div>

          <v-select
            v-model="selectedSprint"
            :items="sprints"
            item-title="name"
            item-value="id"
            label="Select Sprint"
            variant="outlined"
            clearable
          ></v-select>

          <v-btn
            variant="text"
            @click="goToSprintPage"
          >
            Create New Sprint
          </v-btn>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            variant="text"
            @click="assignSprintDialog = false"
          >
            Cancel
          </v-btn>

          <v-btn
            color="primary"
            variant="flat"
            :disabled="!selectedSprint"
            @click="assignSprint"
          >
            Assign
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.backlog-header,
.backlog-row {
  display: grid;
  grid-template-columns:
    65px
    100px
    minmax(160px, 1fr)
    100px
    100px
    150px
    150px;

  align-items: center;
  min-height: 56px;
  padding: 0 16px;
  gap: 8px;
  min-width: 850px;
}
</style>