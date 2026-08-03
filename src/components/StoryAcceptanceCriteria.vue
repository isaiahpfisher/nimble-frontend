<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AcceptanceCriteriaServices from "../services/AcceptanceCriteriaServices.js";
import StoryServices from "../services/StoryServices.js";
import AssistantServices from "../services/AssistantServices.js";
import Comments from "./Comments.vue";

const props = defineProps({
  projectId: { type: [String, Number], required: true },
  storyId: { type: Number, required: true },
});

const emit = defineEmits(["error"]);

const route = useRoute();
const router = useRouter();

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
  openFromQuery();
});

function openFromQuery() {
  const id = route.query.ac ? Number(route.query.ac) : null;

  if (id === null) {
    resetDrawer();
    return;
  }
  if (editingId.value === id) return;

  const criterion = criteria.value.find((c) => c.id === id);
  if (criterion) {
    editingId.value = criterion.id;
    draftCriterion.value = { ...criterion };
    drawer.value = true;
  }
}

async function getCriteria() {
  try {
    const response = await StoryServices.getStory(props.projectId, props.storyId);
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
      await AcceptanceCriteriaServices.createCriterion(props.projectId, props.storyId, draftCriterion.value);
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
    await AcceptanceCriteriaServices.deleteCriterion(props.projectId, props.storyId, editingId.value);
    closeDrawer();
    await getCriteria();
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

const suggestions = ref([]);
const suggestOpen = ref(false);
const generating = ref(false);
const savingSuggestions = ref(false);

const chosen = computed(() => suggestions.value.filter((row) => row.keep));

async function generateCriteria() {
  suggestOpen.value = true;
  generating.value = true;
  suggestions.value = [];

  try {
    const { data } = await AssistantServices.generate(
      "acceptance_criteria",
      {},
      { projectId: Number(props.projectId), storyId: props.storyId },
    );

    suggestions.value = (data.result.criteria ?? []).map((criterion) => ({ ...criterion, keep: true }));
  } catch (error) {
    console.error(error);
    suggestOpen.value = false;
    emit("error", error.response?.data?.message ?? error.message);
  } finally {
    generating.value = false;
  }
}

async function saveSuggestions() {
  savingSuggestions.value = true;
  const failures = [];

  for (const criterion of chosen.value) {
    try {
      await AcceptanceCriteriaServices.createCriterion(props.projectId, props.storyId, {
        title: criterion.title,
        description: criterion.description,
        status: "Pending",
      });
    } catch (error) {
      console.error(error);
      failures.push(criterion.title);
    }
  }

  await getCriteria();

  savingSuggestions.value = false;
  suggestOpen.value = false;
  suggestions.value = [];

  if (failures.length) emit("error", `Could not add: ${failures.join(", ")}.`);
}

function closeDrawer() {
  resetDrawer();
  if (route.query.ac) {
    const { ac, ...query } = route.query;
    router.replace({ query });
  }
}

function resetDrawer() {
  drawer.value = false;
  editingId.value = null;
  draftCriterion.value = null;
}
</script>

<template>
  <v-card class="rounded-lg elevation-5">
    <v-toolbar flat density="compact" color="transparent" class="px-2">
      <v-toolbar-title class="text-subtitle-1 font-weight-medium"> Acceptance Criteria </v-toolbar-title>
      <v-btn
        prepend-icon="mdi-auto-fix"
        rounded="lg"
        text="Generate"
        color="primary"
        variant="flat"
        class="mr-2"
        data-test="generate-criteria"
        :loading="generating"
        @click="generateCriteria()"
      ></v-btn>
      <v-btn prepend-icon="mdi-plus" rounded="lg" text="Add Criterion" border @click="addCriterion()"></v-btn>
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
        @click.stop="openCriterion(criterion)"
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
          <v-icon size="small" color="medium-emphasis"> mdi-chevron-right </v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-card>

  <v-dialog v-model="suggestOpen" max-width="760" scrollable>
    <v-card class="rounded-lg" data-test="suggested-criteria">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon color="primary" size="small">mdi-auto-fix</v-icon>
        <span class="text-h6">Suggested acceptance criteria</span>
      </v-card-title>

      <v-card-text v-if="generating" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" class="mb-4" />
        <p class="text-body-2 text-medium-emphasis">Reading the story and writing criteria...</p>
      </v-card-text>

      <v-card-text v-else-if="!suggestions.length">
        <p class="text-body-2">Nothing to add — the story already looks covered by the criteria on it.</p>
      </v-card-text>

      <v-card-text v-else>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Untick anything you do not want, and edit the wording before adding.
        </p>

        <v-card v-for="(criterion, index) in suggestions" :key="index" variant="outlined" class="mb-3">
          <v-card-text class="d-flex ga-3">
            <v-checkbox-btn v-model="criterion.keep" color="primary" class="flex-0-0" />
            <div class="flex-grow-1">
              <v-text-field
                v-model="criterion.title"
                label="Title"
                density="compact"
                variant="underlined"
                hide-details
                class="mb-2"
              ></v-text-field>
              <v-textarea
                v-model="criterion.description"
                label="Given / When / Then"
                density="compact"
                variant="underlined"
                rows="2"
                auto-grow
                hide-details
              ></v-textarea>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" :disabled="savingSuggestions" @click="suggestOpen = false">Cancel</v-btn>
        <v-btn
          v-if="suggestions.length"
          variant="flat"
          color="primary"
          data-test="accept-criteria"
          :disabled="!chosen.length"
          :loading="savingSuggestions"
          @click="saveSuggestions()"
        >
          Add {{ chosen.length }} {{ chosen.length === 1 ? "criterion" : "criteria" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

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
        <v-select v-model="draftCriterion.status" :items="['Pending', 'Passed', 'Failed']" label="Status"></v-select>

        <v-text-field v-model="draftCriterion.title" label="Title"></v-text-field>

        <v-textarea v-model="draftCriterion.description" label="Description" rows="4" auto-grow></v-textarea>

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
