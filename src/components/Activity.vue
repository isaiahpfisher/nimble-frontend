<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ActivityServices from "../services/ActivityServices.js";
import ActivityItem from "./ActivityItem.vue";
import { SUBJECT_TYPE_OPTIONS } from "../utils/activity.js";

const props = defineProps({
  projectId: { type: Number, required: true },
  storyId: { type: Number, required: true },
});

const emit = defineEmits(["error"]);

const router = useRouter();
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

    const haystack = `${JSON.stringify(activity)} ${activityToString(activity) ?? ""}`.toLowerCase();
    return haystack.includes(query);
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
    <v-row class="pa-3 ga-2" no-gutters>
      <v-col>
        <v-text-field
          v-model="search"
          label="Search activity"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="min-width: 200px"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row class="pa-3 ga-2" no-gutters>
      <v-col>
        <v-select
          v-model="filteredUsers"
          :items="usersWithActivity"
          label="User"
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
          label="Type"
          density="compact"
          variant="outlined"
          hide-details
          multiple
          clearable
        ></v-select>
      </v-col>
    </v-row>
    <v-list bg-color="transparent" v-if="filteredActivities.length" class="py-0">
      <template v-for="activity in filteredActivities" :key="activity.id">
        <ActivityItem :activity="activity" @error="(message) => emit('error', message)" />
      </template>
    </v-list>
    <div v-else class="text-medium-emphasis text-body-2 pa-4 text-center">No activity found.</div>
  </v-card>
</template>
