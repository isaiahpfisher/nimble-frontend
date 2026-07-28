<script setup>
import { ref } from "vue";
import Comments from "./Comments.vue";
import Activity from "./Activity.vue";

const emit = defineEmits(["error"]);
const tab = ref("comments");

const props = defineProps({
  projectId: { type: Number, required: true },
  storyId: { type: Number, required: true },
});

async function getCommentsForStory() {
  try {
    const response = await CommentServices.getCommentsForStory(props.projectId, props.storyId);
    comments.value = response.data;
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

async function getActivityForStory() {
  try {
    // const response = await ActivityServices.getActivityForStory(props.projectId, props.storyId);
    activity.value = [];
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

const tabs = [
  {
    icon: "mdi-comment-text-outline",
    text: "Comments",
    value: "comments",
  },
  {
    icon: "mdi-history",
    text: "Activity",
    value: "activity",
  },
];
</script>

<template>
  <v-card class="overflow-visible rounded-lg elevation-5">
    <v-tabs v-model="tab" :items="tabs" slider-color="primary">
      <template v-slot:tab="{ item }">
        <v-tab :prepend-icon="item.icon" :text="item.text" :value="item.value" class="text-none"></v-tab>
      </template>

      <template v-slot:item="{ item }">
        <v-tabs-window-item :value="item.value">
          <Comments
            v-if="item.value === 'comments'"
            embedded
            :project-id="projectId"
            :story-id="storyId"
            @error="(message) => emit('error', message)"
          />
          <Activity v-else :project-id="projectId" :story-id="storyId" @error="(message) => emit('error', message)" />
        </v-tabs-window-item>
      </template>
    </v-tabs>
  </v-card>
</template>
