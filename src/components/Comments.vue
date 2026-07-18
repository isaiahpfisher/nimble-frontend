<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import CommentServices from "../services/CommentServices.js";
import { formatDate } from "../utils/date.js";

const props = defineProps({
  projectId: { type: Number, required: true },
  storyId: { type: Number, required: true },
  criterionId: { type: Number, required: false },
});

const emit = defineEmits(["error"]);

const router = useRouter();
const comments = ref([]);
const newComment = ref("");
const user = ref(null);

function initials(user) {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));

  if (!!props.criterionId) {
    await getCommentsForCriterion();
  } else {
    await getCommentsForStory();
  }
});

async function getCommentsForStory() {
  try {
    const response = await CommentServices.getCommentsForStory(
      props.projectId,
      props.storyId,
    );
    comments.value = response.data;
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

async function getCommentsForCriterion() {
  try {
    const response = await CommentServices.getCommentsForCriterion(
      props.projectId,
      props.storyId,
      props.criterionId,
    );
    console.log(response.data);
    comments.value = response.data;
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

async function addComment() {
  try {
    if (!newComment.value) return;

    let response;

    if (!!props.criterionId) {
      response = await CommentServices.createCommentForCriterion(
        props.projectId,
        props.storyId,
        props.criterionId,
        { content: newComment.value },
      );
    } else {
      response = await CommentServices.createCommentForStory(
        props.projectId,
        props.storyId,
        { content: newComment.value },
      );
    }
    comments.value.push(response.data);
    newComment.value = "";
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

async function deleteComment(commentId) {
  try {
    await CommentServices.deleteComment(commentId);
    comments.value = comments.value.filter((c) => c.id !== commentId);
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-skeleton-loader
    v-if="!comments || !user"
    color="secondary"
    type="card"
  ></v-skeleton-loader>
  <v-card
    :class="!criterionId ? 'rounded-lg elevation-5' : 'border-0 elevation-0'"
  >
    <v-toolbar
      flat
      density="compact"
      color="transparent"
      class="px-2"
      v-if="!criterionId"
    >
      <v-toolbar-title class="text-subtitle-1 font-weight-medium">
        Comments
      </v-toolbar-title>
    </v-toolbar>
    <v-list bg-color="transparent" v-if="comments.length" class="py-0">
      <template v-for="(comment, index) in comments" :key="comment.id">
        <v-list-item class="py-3">
          <template #prepend>
            <v-avatar color="accent" size="36">
              <span class="text-white text-caption font-weight-bold">
                {{ initials(comment.user) }}
              </span>
            </v-avatar>
          </template>
          <v-list-item-title class="d-flex align-center ga-2 overflow-visible">
            <span class="text-body-2 font-weight-medium">
              {{ comment.user.firstName }} {{ comment.user.lastName }}
            </span>
            <span class="text-medium-emphasis text-caption">
              {{ formatDate(comment.createdAt) }}
            </span>
            <v-spacer></v-spacer>
            <v-btn
              v-if="comment.user.id === user.id"
              icon="mdi-close"
              size="x-small"
              variant="text"
              class="my-n1"
              @click="deleteComment(comment.id)"
            ></v-btn>
          </v-list-item-title>
          <div class="text-body-2 mt-1">
            {{ comment.content }}
          </div>
        </v-list-item>
        <v-divider
          v-if="index !== comments.length - 1 && comments.length > 1"
        ></v-divider>
      </template>
    </v-list>
    <v-divider></v-divider>
    <div class="pa-3">
      <v-textarea
        v-model="newComment"
        label="Add a new comment (TODO: @mentions)"
        density="compact"
        rows="3"
        auto-grow
        hide-details
      ></v-textarea>
      <div class="d-flex mt-2">
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="addComment()"
          >Add Comment</v-btn
        >
      </div>
    </div>
  </v-card>
</template>
