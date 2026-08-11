<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

import RetroServices from "../../../services/RetroServices.js";

const route = useRoute();

const projectId = Number(route.params.projectId || route.params.id || 1);
const sprintId = Number(route.params.sprintId || route.params.sprint || 4);

const retrospectives = ref([]);
const users = ref([]);
const currentUserId = ref(null);

const showDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);

const retro = ref({
  id: null,
  title: "",
  summary: "",
  sprintId: sprintId,
  createdById: null,
});


// =========================
// Load retrospectives
// =========================

async function loadRetrospectives() {
  try {
    const response = await RetroServices.getRetrosBySprintId(
      projectId,
      sprintId
    );

    retrospectives.value = Array.isArray(response.data)
      ? response.data
      : [];
  } catch (error) {
    console.error("Error loading retrospectives:", error);

    retrospectives.value = [];
  }
}


// =========================
// Load users
// =========================

function displayName(user) {
  return (
    user?.name ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email ||
    `User ${user?.id}`
  );
}

async function loadUsers() {
  try {
    const response = await RetroServices.getUsers();
    const fetchedUsers = Array.isArray(response.data)
      ? response.data
      : [];

    users.value = fetchedUsers.map((user) => ({
      id: user.id,
      name: displayName(user),
    }));
  } catch (error) {
    console.error("Error loading users:", error);

    users.value = [];
  }

  // Default "Created By" to whoever is signed in, when we can tell.
  try {
    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    if (currentUser?.id) {
      currentUserId.value = currentUser.id;
      retro.value.createdById = currentUser.id;
    }
  } catch (error) {
    console.error("Error loading current user:", error);
  }
}


// =========================
// Add retrospective
// =========================

function openAddRetro() {
  isEditing.value = false;

  retro.value = {
    id: null,
    title: "",
    summary: "",
    sprintId: sprintId,
    createdById: currentUserId.value,
  };

  showDialog.value = true;
}


// =========================
// Edit retrospective
// =========================

function openEditRetro(item) {
  isEditing.value = true;

  retro.value = {
    id: item.id,
    title: item.title || "",
    summary: item.summary || "",
    sprintId: Number(
      item.sprintId ||
        item.sprint?.id ||
        sprintId
    ),
    createdById:
      item.createdById ||
      item.createdBy?.id ||
      null,
  };

  showDialog.value = true;
}


// =========================
// Close dialog
// =========================

function closeDialog() {
  if (saving.value) {
    return;
  }

  showDialog.value = false;
}


// =========================
// Save retrospective
// =========================

async function saveRetro() {
  if (saving.value) {
    return;
  }

  if (!retro.value.title || !retro.value.title.trim()) {
    alert("Title is required.");
    return;
  }

  if (!retro.value.sprintId) {
    alert("A valid sprint is required.");
    return;
  }

  saving.value = true;

  try {
    if (isEditing.value) {
      await RetroServices.updateRetro(
        retro.value.id,
        {
          title: retro.value.title.trim(),
          summary: retro.value.summary || "",
          createdById: retro.value.createdById,
        }
      );
    } else {
      await RetroServices.createRetro({
        title: retro.value.title.trim(),
        summary: retro.value.summary || "",
        sprintId: sprintId,
        createdById: retro.value.createdById,
      });
    }

    showDialog.value = false;

    await loadRetrospectives();
  } catch (error) {
    console.error("Error saving retrospective:", error);

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to save retrospective.";

    alert(message);
  } finally {
    saving.value = false;
  }
}


// =========================
// Delete retrospective
// =========================

async function deleteRetro(item = null) {
  const target = item || retro.value;

  if (!target?.id) {
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete this retrospective?"
  );

  if (!confirmed) {
    return;
  }

  saving.value = true;

  try {
    await RetroServices.deleteRetro(target.id);

    showDialog.value = false;

    await loadRetrospectives();
  } catch (error) {
    console.error("Error deleting retrospective:", error);

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete retrospective.";

    alert(message);
  } finally {
    saving.value = false;
  }
}



function getProjectName(item) {
  return (
    item?.sprint?.project?.title ||
    item?.project?.title ||
    "Nimble"
  );
}

function getSprintName(item) {
  return (
    item?.sprint?.name ||
    `Sprint ${item?.sprintId || sprintId}`
  );
}

function getUserName(user) {
  if (!user) {
    return "";
  }

  if (typeof user === "string") {
    return user;
  }

  if (typeof user === "number") {
    const foundUser = users.value.find(
      (item) => Number(item.id) === Number(user)
    );

    return foundUser?.name || "";
  }

  return displayName(user);
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString();
}



onMounted(async () => {
  await loadUsers();
  await loadRetrospectives();
});
</script>


<template>
  <v-card
    class="mt-4"
    elevation="2"
  >
    <!-- Retro header -->
    <v-card-title
      class="d-flex align-center justify-space-between pa-4"
    >
      <span class="text-h5">
        Retrospectives
      </span>

      <v-btn
        color="primary"
        variant="text"
        @click="openAddRetro"
      >
        ADD RETROSPECTIVE
      </v-btn>
    </v-card-title>

    <v-divider />

    <!-- Retrospective table -->
    <v-table>
      <thead>
        <tr>
          <th class="text-left">
            Title
          </th>

          <th class="text-left">
            Project
          </th>

          <th class="text-left">
            Sprint
          </th>

          <th class="text-left">
            Created By
          </th>

          <th class="text-left">
            Created
          </th>

          <th class="text-right">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        <!-- Existing retrospectives -->
        <tr
          v-for="item in retrospectives"
          :key="item.id"
        >
          <td>
            <v-btn
              variant="text"
              color="primary"
              class="text-none px-0"
              @click="openEditRetro(item)"
            >
              {{ item.title }}
            </v-btn>
          </td>

          <td>
            {{ getProjectName(item) }}
          </td>

          <td>
            {{ getSprintName(item) }}
          </td>

          <td>
            {{ getUserName(item.createdBy || item.createdById) || "—" }}
          </td>

          <td>
            {{
              formatDate(
                item.createdAt ||
                item.created ||
                item.date
              )
            }}
          </td>

          <td class="text-right">
            <v-btn
              variant="text"
              color="primary"
              size="small"
              @click="openEditRetro(item)"
            >
              EDIT
            </v-btn>

            <v-btn
              variant="text"
              color="error"
              size="small"
              @click="deleteRetro(item)"
            >
              DELETE
            </v-btn>
          </td>
        </tr>

        <!-- Empty state -->
        <tr v-if="retrospectives.length === 0">
          <td
            colspan="6"
            class="text-center"
          >
            <div class="py-10">
              <div class="text-h6 mb-2">
                No retrospectives
              </div>

              <div
                class="text-body-2 text-medium-emphasis mb-5"
              >
                There are no retrospectives for this sprint yet.
              </div>

              <v-btn
                color="primary"
                @click="openAddRetro"
              >
                ADD RETROSPECTIVE
              </v-btn>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-divider />

    <!-- Pagination -->
    <div
      class="d-flex align-center justify-end pa-3"
    >
      <span class="text-body-2 mr-4">
        Items per page:
      </span>

      <v-select
        :items="[10, 25, 50]"
        model-value="10"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 100px"
      />

      <span class="text-body-2 ml-6">
        {{
          retrospectives.length === 0
            ? "0-0 of 0"
            : `1-${retrospectives.length} of ${retrospectives.length}`
        }}
      </span>

      <v-btn
        icon="mdi-page-first"
        variant="text"
        disabled
      />

      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        disabled
      />

      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        disabled
      />

      <v-btn
        icon="mdi-page-last"
        variant="text"
        disabled
      />
    </div>
  </v-card>


  <!-- Retrospective dialog -->
  <v-dialog
    v-model="showDialog"
    max-width="1100"
    scrollable
  >
    <v-card>

      <!-- Dialog header -->
      <v-card-title
        class="d-flex align-center justify-space-between pa-5"
      >
        <span class="text-h5">
          {{
            isEditing
              ? retro.title
              : "Add Retrospective"
          }}
        </span>

        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-divider />

      <!-- Dialog content -->
      <v-card-text class="pa-6">
        <v-row>

          <!-- Left -->
          <v-col
            cols="12"
            md="8"
          >

            <!-- Title -->
            <v-text-field
              v-model="retro.title"
              label="Title"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            />

            <!-- Summary -->
            <v-textarea
              v-model="retro.summary"
              label="Summary"
              variant="outlined"
              rows="14"
              auto-grow
            />

          </v-col>


          <!-- Right -->
          <v-col
            cols="12"
            md="4"
          >

            <!-- Project -->
            <v-text-field
              model-value="Nimble"
              label="Project"
              variant="outlined"
              density="comfortable"
              readonly
              class="mb-4"
            />

            <!-- Sprint -->
            <v-text-field
              :model-value="`Sprint ${sprintId}`"
              label="Sprint"
              variant="outlined"
              density="comfortable"
              readonly
              class="mb-4"
            />

            <!-- Created By -->
            <v-select
              v-model="retro.createdById"
              :items="users"
              item-title="name"
              item-value="id"
              label="Created By"
              variant="outlined"
              density="comfortable"
              clearable
            />

          </v-col>

        </v-row>
      </v-card-text>

      <v-divider />

      <!-- Dialog footer -->
      <v-card-actions class="pa-4">

        <v-btn
          v-if="isEditing"
          color="error"
          variant="text"
          @click="deleteRetro()"
        >
          DELETE
        </v-btn>

        <v-spacer />

        <v-btn
          variant="text"
          @click="closeDialog"
          :disabled="saving"
        >
          CANCEL
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          @click="saveRetro"
        >
          SAVE
        </v-btn>

      </v-card-actions>

    </v-card>
  </v-dialog>
</template>