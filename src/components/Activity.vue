<script setup>
import { computed, onMounted, ref } from "vue";
import ActivityServices from "../services/ActivityServices.js";
import ActivityItem from "./ActivityItem.vue";
import { SUBJECT_TYPE_OPTIONS } from "../utils/activity.js";

const props = defineProps({
  projectId: { type: Number, required: true },
  storyId: { type: Number, required: true },
});

const emit = defineEmits(["error"]);

const activities = ref([]);
const search = ref("");
const subjectTypes = ref([]);
const filteredUsers = ref([]);

onMounted(async () => {
  await getActivityForStory();
});

const usersWithActivity = computed(() => {
  const users = new Set();
  activities.value.forEach((activity) => {
    if (activity.user) {
      users.add(`${activity.user.firstName} ${activity.user.lastName}`);
    } else if (activity.metadata.user) {
      users.add(activity.metadata.user);
    }
  });
  return Array.from(users);
});

const filteredActivities = computed(() => {
  const query = (search.value ?? "").trim().toLowerCase();
  const types = subjectTypes.value ?? [];

  return activities.value.filter((activity) => {
    if (types.length && !types.includes(activity.subjectType)) {
      return false;
    }

    const username = activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : activity.metadata.user;
    if (filteredUsers.value.length && !filteredUsers.value.includes(username)) {
      return false;
    }

    if (!query) {
      return true;
    }

    return JSON.stringify(activity).toLowerCase().includes(query);
  });
});

async function getActivityForStory() {
  try {
    const response = await ActivityServices.getActivityForStory(props.projectId, props.storyId);
    activities.value = response.data;
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-skeleton-loader v-if="!activities" color="secondary" type="card"></v-skeleton-loader>
  <v-card v-else class="overflow-visible rounded-lg elevation-5">
    <v-row class="pa-4" dense>
      <v-col>
        <v-text-field
          v-model="search"
          placeholder="Search activity"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          clearable
        ></v-text-field>
      </v-col>
      <v-col>
        <v-select
          v-model="filteredUsers"
          :items="usersWithActivity"
          placeholder="All users"
          density="compact"
          variant="outlined"
          hide-details
          multiple
          clearable
        ></v-select>
      </v-col>
      <v-col>
        <v-select
          v-model="subjectTypes"
          :items="SUBJECT_TYPE_OPTIONS"
          placeholder="All types"
          density="compact"
          variant="outlined"
          hide-details
          multiple
          clearable
        ></v-select>
      </v-col>
    </v-row>

    <template v-if="filteredActivities.length">
      <template v-for="activity in filteredActivities" :key="activity.id">
        <v-divider></v-divider>
        <ActivityItem :activity="activity" :project-id="projectId" @error="(message) => emit('error', message)" />
      </template>
    </template>

    <div v-else class="pb-8 py-2 text-center">No activity found.</div>
  </v-card>
</template>
