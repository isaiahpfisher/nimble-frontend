<script setup>
import { computed } from "vue";
import { format, formatDistanceToNow } from "date-fns";

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
});

const metadata = computed(() => props.log.metadata ?? {});

const author = computed(() => {
  return props.log.user
    ? `${props.log.user.firstName} ${props.log.user.lastName}`
    : metadata.value.user ?? "Unknown user";
});

const initials = computed(() => {
  if (!props.log.user) return "U";

  return (
    props.log.user.firstName?.[0] +
    props.log.user.lastName?.[0]
  ).toUpperCase();
});


const summary = computed(() => {
  switch (props.log.action) {

    case "CREATE_USER":
      return "created this user";

    case "LOGIN":
      return "logged in";

    case "CREATE_PROJECT":
      return "created this project";

    case "ADD_PROJECT_MEMBER":
      return "added a project member";

    case "REMOVE_PROJECT_MEMBER":
      return "removed a project member";

    case "UPDATE_PROJECT_MEMBER":
      return "updated project member";

    case "ASSIGN_STORY_TO_SPRINT":
      return "assigned story to sprint";

    case "CREATE_REPOSITORY":
      return "connected this repository";

    case "UPDATE_REPOSITORY":
      return "updated this repository";

    case "DELETE_REPOSITORY":
      return "deleted this repository";

    default:
      return props.log.action
        .toLowerCase()
        .replaceAll("_", " ");
  }
});

</script>


<template>
  <div class="d-flex ga-3 px-4 py-3">
    <v-avatar color="accent" size="32">
      <span class="text-white text-caption font-weight-bold">
        {{ initials }}
      </span>
    </v-avatar>

    <div class="d-flex flex-column flex-grow-1">
      <div class="d-flex align-center">
        <span
          class="font-weight-medium"
          style="width: 200px;"
        >
          {{ author }}
        </span>

        <span
          class="text-medium-emphasis"
          style="width: 280px;"
        >
          {{ summary }}
        </span>

        <span
          class="text-caption text-disabled ml-auto"
        >
          {{ formatDistanceToNow(log.createdAt, { addSuffix: true }) }}
        </span>
      </div>
    </div>
  </div>
</template>