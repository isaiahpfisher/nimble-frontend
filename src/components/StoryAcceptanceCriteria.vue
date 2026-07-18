<script setup>
import { onMounted, ref } from "vue";
import AcceptanceCriteriaServices from "../services/AcceptanceCriteriaServices.js";
import StoryServices from "../services/StoryServices.js";
import Comments from "./Comments.vue";

const props = defineProps({
  projectId: { type: [String, Number], required: true },
  storyId: { type: Number, required: true },
});

const emit = defineEmits(["error"]);

const criteria = ref([]);
const drawer = ref(false);
const draftCriterion = ref(null);
const editingId = ref(null);

const statusLookup = {
  Passed: { color: "success", icon: "mdi-check" },
  Failed: { color: "error", icon: "mdi-close" },
  Pending: { color: "blue", icon: "mdi-circle-small" },
};

onMounted(async () => {
  await getCriteria();
});

async function getCriteria() {
  try {
    const response = await StoryServices.getStory(
      props.projectId,
      props.storyId,
    );
    criteria.value = response.data.acceptanceCriteria ?? [];
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

function addCriterion() {
  editingId.value = null;
  draftCriterion.value = {
    title: "",
    description: "",
    status: "Pending",
  };
  drawer.value = true;
}

function openCriterion(criterion) {
  editingId.value = criterion.id;
  draftCriterion.value = { ...criterion };
  drawer.value = true;
}

async function saveCriterion() {
  try {
    if (editingId.value === null) {
      await AcceptanceCriteriaServices.createCriterion(
        props.projectId,
        props.storyId,
        draftCriterion.value,
      );
    } else {
      await AcceptanceCriteriaServices.updateCriterion(
        props.projectId,
        props.storyId,
        editingId.value,
        draftCriterion.value,
      );
    }
    closeDrawer();
    await getCriteria();
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

async function deleteCriterion() {
  if (editingId.value === null) return;

  try {
    await AcceptanceCriteriaServices.deleteCriterion(
      props.projectId,
      props.storyId,
      editingId.value,
    );
    closeDrawer();
    await getCriteria();
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

function closeDrawer() {
  drawer.value = false;
  editingId.value = null;
  draftCriterion.value = null;
}
</script>

<template>
  <v-card class="rounded-lg elevation-5">
    <v-toolbar flat density="compact" color="transparent" class="px-2">
      <v-toolbar-title class="text-subtitle-1 font-weight-medium">
        Acceptance Criteria
      </v-toolbar-title>
      <v-btn
        prepend-icon="mdi-plus"
        rounded="lg"
        text="Add Criterion"
        border
        @click="addCriterion()"
      ></v-btn>
    </v-toolbar>

    <v-list bg-color="transparent">
      <v-list-item
        v-if="!criteria.length"
        title="No acceptance criteria yet. Click Add to create one."
        class="text-medium-emphasis text-center"
      ></v-list-item>

      <v-list-item
        v-for="(criterion, index) in criteria"
        :key="criterion.id"
        :class="index !== criteria.length - 1 ? 'border-b-sm' : ''"
        @click="openCriterion(criterion)"
      >
        <template v-slot:prepend>
          <v-chip
            :color="statusLookup[criterion.status]?.color"
            :prepend-icon="statusLookup[criterion.status]?.icon"
            size="small"
            label
            class="mr-3"
          >
            {{ criterion.status }}
          </v-chip>
        </template>

        <v-list-item-title>
          {{ criterion.title || "Untitled criterion" }}
        </v-list-item-title>

        <template v-slot:append>
          <v-icon size="small" color="medium-emphasis">
            mdi-chevron-right
          </v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-card>

  <v-navigation-drawer
    v-model="drawer"
    location="right"
    temporary
    width="420"
    @update:model-value="(val) => !val && closeDrawer()"
  >
    <template v-if="draftCriterion">
      <v-toolbar flat density="comfortable" color="transparent">
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          {{ editingId === null ? "New Criterion" : draftCriterion.title }}
        </v-toolbar-title>
        <v-btn icon="mdi-close" variant="text" @click="closeDrawer()"></v-btn>
      </v-toolbar>
      <v-divider></v-divider>

      <div class="pa-4">
        <v-select
          v-model="draftCriterion.status"
          :items="['Pending', 'Passed', 'Failed']"
          label="Status"
        ></v-select>

        <v-text-field
          v-model="draftCriterion.title"
          label="Title"
        ></v-text-field>

        <v-textarea
          v-model="draftCriterion.description"
          label="Description"
          rows="4"
          auto-grow
        ></v-textarea>

        <div class="d-flex ga-2">
          <v-btn
            v-if="editingId !== null"
            variant="text"
            color="error"
            prepend-icon="mdi-delete"
            @click="deleteCriterion()"
            >Delete
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDrawer()">Cancel</v-btn>
          <v-btn variant="flat" color="primary" @click="saveCriterion()">
            {{ editingId === null ? "Add" : "Save" }}
          </v-btn>
        </div>
      </div>
      <v-divider class="mt-4"></v-divider>
      <Comments
        v-if="editingId !== null"
        :project-id="projectId"
        :story-id="storyId"
        :criterion-id="editingId"
        @error="(message) => emit('error', message)"
      />
    </template>
  </v-navigation-drawer>
</template>
