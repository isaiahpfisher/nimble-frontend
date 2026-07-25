<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ProjectServices from "../../../services/ProjectServices.js";
import SprintServices from "../../../services/SprintServices.js";
import SnackBar from "../../../components/SnackBar.vue";

const route = useRoute();
const projectId = route.params.id;

const user = ref(null);
const project = ref(null);
const sprints = ref([]);
const snackbar = ref(null);

const showDialog = ref(false);
const editingSprint = ref(null);

const showStartPicker = ref(false);
const showEndPicker = ref(false);

// Delete confirmation dialog
const deleteDialog = ref(false);
const sprintToDelete = ref(null);

const statusOptions = ["Planned", "Active", "Completed"];
const recurrenceOptions = ["Weekly", "Biweekly", "Monthly"];

const newSprint = ref({
  id: null,
  projectId: projectId,
  title: "",
  goal: "",
  startDate: null,
  endDate: null,
  status: "Planned",
  isRecurring: false,
  recurrencePattern: "Weekly",
  recurrenceCount: 4,
});

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  await getProject();
  await getSprints();
});

async function getProject() {
  await ProjectServices.getProject(projectId)
    .then((response) => {
      project.value = response.data;
    })
    .catch((error) => {
      console.log(error);
      snackbar.value?.show(
        error.response?.data?.message ||
          error.message ||
          "Something went wrong",
      );
    });
}

async function getSprints() {
  await SprintServices.getSprintsForProject(projectId)
    .then((response) => {
      sprints.value = response.data;
    })
    .catch((error) => {
      console.log(error);
      snackbar.value?.show(
        error.response?.data?.message ||
          error.message ||
          "Something went wrong",
      );
    });
}

function openCreate() {
  newSprint.value = {
    id: null,
    projectId: projectId,
    title: "",
    goal: "",
    startDate: null,
    endDate: null,
    status: "Planned",
    isRecurring: false,
    recurrencePattern: "Weekly",
    recurrenceCount: 4,
  };

  editingSprint.value = null;
  showDialog.value = true;
}

function openEdit(sprint) {
  newSprint.value = { ...sprint };
  editingSprint.value = sprint;
  showDialog.value = true;
}

function closeDialog() {
  showDialog.value = false;
  editingSprint.value = null;
}

async function saveSprint() {
  newSprint.value.projectId = projectId;

  if (editingSprint.value !== null) {
    await SprintServices.updateSprint(newSprint.value.id, newSprint.value)
      .then(() => {
        snackbar.value?.show(`${newSprint.value.title} updated`, "success");

        closeDialog();
        getSprints();
      })
      .catch((error) => {
        console.log(error);
        snackbar.value?.show(
          error.response?.data?.message ||
            error.message ||
            "Something went wrong",
        );
      });
  } else if (newSprint.value.isRecurring) {
    await SprintServices.createRecurringSprints(newSprint.value)
      .then((response) => {
        const count = response.data?.length || newSprint.value.recurrenceCount;

        snackbar.value?.show(`${count} recurring sprints scheduled`, "success");

        closeDialog();
        getSprints();
      })
      .catch((error) => {
        console.log(error);
        snackbar.value?.show(
          error.response?.data?.message ||
            error.message ||
            "Something went wrong",
        );
      });
  } else {
    await SprintServices.createSprint(newSprint.value)
      .then(() => {
        snackbar.value?.show(`${newSprint.value.title} created`, "success");

        closeDialog();
        getSprints();
      })
      .catch((error) => {
        console.log(error);
        snackbar.value?.show(
          error.response?.data?.message ||
            error.message ||
            "Something went wrong",
        );
      });
  }
}

// Open the delete confirmation dialog
function confirmDelete(sprint) {
  sprintToDelete.value = sprint;
  deleteDialog.value = true;
}

// Close the delete confirmation dialog
function closeDeleteDialog() {
  deleteDialog.value = false;
  sprintToDelete.value = null;
}

// Delete the selected sprint
async function deleteSprint() {
  if (!sprintToDelete.value) {
    return;
  }

  const sprint = sprintToDelete.value;

  await SprintServices.deleteSprint(sprint.id)
    .then(() => {
      snackbar.value?.show(`${sprint.title} deleted`, "success");

      closeDeleteDialog();
      getSprints();
    })
    .catch((error) => {
      console.log(error);

      snackbar.value?.show(
        error.response?.data?.message ||
          error.message ||
          "Something went wrong",
      );
    });
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : "";
}

function setStartDate(date) {
  newSprint.value.startDate = date;
  showStartPicker.value = false;
}

function setEndDate(date) {
  newSprint.value.endDate = date;
  showEndPicker.value = false;
}

function getStatusColor(status) {
  if (status === "Active") {
    return "blue";
  } else if (status === "Completed") {
    return "primary";
  } else if (status === "Planned") {
    return "black";
  }

  return "grey";
}
</script>

<template>
  <v-container v-if="!project">
    <v-skeleton-loader color="secondary" type="card" />
  </v-container>

  <v-container v-else>
    <!-- Page Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <h4 class="text-h5 font-weight-medium">{{ project.title }} — Sprints</h4>

      <v-btn color="accent" @click="openCreate()"> + New Sprint </v-btn>
    </div>

    <!-- Sprints Table -->
    <v-table class="rounded-lg elevation-5">
      <thead>
        <tr>
          <th class="text-left">Title</th>
          <th class="text-left">Start</th>
          <th class="text-left">End</th>
          <th class="text-left">Status</th>
          <th class="text-left">Recurring</th>
          <th class="text-left">Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="sprint in sprints" :key="sprint.id">
          <td>
            {{ sprint.title }}
          </td>

          <td>
            {{ formatDate(sprint.startDate) }}
          </td>

          <td>
            {{ formatDate(sprint.endDate) }}
          </td>

          <td>
            <v-chip size="small" :color="getStatusColor(sprint.status)">
              {{ sprint.status }}
            </v-chip>
          </td>

          <td>
            {{ sprint.isRecurring ? "Yes" : "No" }}
          </td>

          <td>
            <!-- Open Button -->
            <v-btn
              size="small"
              variant="text"
              :to="{
                name: 'sprintBoard',
                params: { projectId: projectId, sprintId: sprint.id },
              }"
            >
              Open
            </v-btn>

            <!-- Edit Button -->
            <v-btn size="small" variant="text" @click="openEdit(sprint)">
              Edit
            </v-btn>

            <!-- Delete Button -->
            <v-btn
              size="small"
              variant="text"
              color="primary"
              @click="confirmDelete(sprint)"
            >
              Delete
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Create / Edit Sprint Dialog -->
    <v-dialog persistent v-model="showDialog" width="800">
      <v-card class="rounded-lg elevation-5">
        <v-card-title class="headline mb-2">
          {{ editingSprint !== null ? "Edit Sprint" : "Create Sprint" }}
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="7">
              <v-text-field v-model="newSprint.title" label="Title" required />
            </v-col>

            <v-col cols="5">
              <v-select
                v-model="newSprint.status"
                :items="statusOptions"
                label="Status"
                required
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="6">
              <v-menu
                v-model="showStartPicker"
                :close-on-content-click="false"
                location="bottom"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="formatDate(newSprint.startDate)"
                    label="Start Date"
                    prepend-icon="mdi-calendar"
                    readonly
                  />
                </template>

                <v-date-picker
                  :model-value="newSprint.startDate"
                  @update:model-value="setStartDate"
                />
              </v-menu>
            </v-col>

            <v-col cols="6">
              <v-menu
                v-model="showEndPicker"
                :close-on-content-click="false"
                location="bottom"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="formatDate(newSprint.endDate)"
                    label="Deadline"
                    prepend-icon="mdi-calendar"
                    readonly
                  />
                </template>

                <v-date-picker
                  :model-value="newSprint.endDate"
                  @update:model-value="setEndDate"
                />
              </v-menu>
            </v-col>
          </v-row>

          <v-textarea v-model="newSprint.goal" rows="4" label="Description" />

          <v-switch
            v-model="newSprint.isRecurring"
            :disabled="editingSprint !== null"
            hide-details
            inset
            color="accent"
            :label="`Recurring: ${newSprint.isRecurring ? 'Yes' : 'No'}`"
          />

          <v-row v-if="newSprint.isRecurring" class="mt-2">
            <v-col cols="6">
              <v-select
                v-model="newSprint.recurrencePattern"
                :items="recurrenceOptions"
                label="Repeats"
                required
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model.number="newSprint.recurrenceCount"
                label="Number of sprints"
                type="number"
                min="2"
                required
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn variant="flat" color="secondary" @click="closeDialog()">
            Close
          </v-btn>

          <v-btn variant="flat" color="primary" @click="saveSprint()">
            {{
              editingSprint !== null
                ? "Update Sprint"
                : newSprint.isRecurring
                  ? "Schedule Recurring"
                  : "Create Sprint"
            }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card class="rounded-lg">
        <v-card-title class="text-h6"> Confirm Delete </v-card-title>

        <v-card-text>
          Are you sure you want to delete
          <strong> "{{ sprintToDelete?.title }}" </strong>
          ?
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn variant="text" @click="closeDeleteDialog()"> Cancel </v-btn>

          <v-btn color="primary" variant="flat" @click="deleteSprint()">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
