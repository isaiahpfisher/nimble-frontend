<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { QuillEditor, Quill } from "@vueup/vue-quill";
import { Mention, MentionBlot } from "quill-mention";
import MarkdownShortcuts from "quill-markdown-shortcuts";
import MagicUrl from "quill-magic-url";
import DOMPurify from "dompurify";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import "quill-mention/dist/quill.mention.css";
import CommentServices from "../services/CommentServices.js";
import ProjectServices from "../services/ProjectServices.js";
import { formatDate } from "../utils/date.js";

Quill.register(
  {
    "blots/mention": MentionBlot,
    "modules/mention": Mention,
    "modules/markdownShortcuts": MarkdownShortcuts,
    "modules/magicUrl": MagicUrl,
  },
  true,
);

const props = defineProps({
  projectId: { type: Number, required: true },
  storyId: { type: Number, required: true },
  criterionId: { type: Number, required: false },
  embedded: { type: Boolean, default: false },
});

const emit = defineEmits(["error"]);

const router = useRouter();
const comments = ref([]);
const newComment = ref("");
const user = ref(null);

const mentionMembers = ref([]);
const editorKey = ref(0); // weird hack to fix editor not clearing after submitting comments

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    ["link"],
    [{ list: "ordered" }, { list: "bullet" }],
  ],
  markdownShortcuts: {},
  magicUrl: true,
  mention: {
    allowedChars: /^[A-Za-z0-9_\-\s]*$/,
    mentionDenotationChars: ["@"],
    dataAttributes: ["id", "value"],
    positioningStrategy: "fixed",
    source(searchTerm, renderList) {
      const term = searchTerm.toLowerCase();
      const matches = mentionMembers.value.filter((m) => m.value.toLowerCase().includes(term));
      renderList(matches, searchTerm);
    },
  },
};

function onEditorReady(quill) {
  quill.root.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        addComment();
      }
    },
    true,
  );
}

function renderContent(content) {
  return DOMPurify.sanitize(content ?? "");
}

const isCommentEmpty = computed(() => {
  const text = renderContent(newComment.value)
    .replace(/<[^>]*>/g, "")
    .trim();
  return text.length === 0;
});

function initials(user) {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));

  await getProjectMembers();

  if (!!props.criterionId) {
    await getCommentsForCriterion();
  } else {
    await getCommentsForStory();
  }
});

async function getProjectMembers() {
  try {
    const response = await ProjectServices.getProject(props.projectId);
    mentionMembers.value = (response.data.projectMembers ?? [])
      .filter((m) => !!m.user && m.user.id != user.value?.id)
      .map((m) => ({
        id: m.user.id,
        value: `${m.user.firstName} ${m.user.lastName}`,
      }));
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

async function getCommentsForStory() {
  try {
    const response = await CommentServices.getCommentsForStory(props.projectId, props.storyId);
    comments.value = response.data;
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

async function getCommentsForCriterion() {
  try {
    const response = await CommentServices.getCommentsForCriterion(props.projectId, props.storyId, props.criterionId);
    comments.value = response.data;
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

async function addComment() {
  try {
    if (isCommentEmpty.value) return;

    const content = renderContent(newComment.value);
    let response;

    if (!!props.criterionId) {
      response = await CommentServices.createCommentForCriterion(props.projectId, props.storyId, props.criterionId, {
        content,
      });
    } else {
      response = await CommentServices.createCommentForStory(props.projectId, props.storyId, { content });
    }
    comments.value.push(response.data);
    newComment.value = "";
    editorKey.value++; // change key to force editor to remount
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
  <v-skeleton-loader v-if="!comments || !user" color="secondary" type="card"></v-skeleton-loader>
  <v-card v-else class="overflow-visible border-0 elevation-0">
    <v-toolbar flat density="compact" color="transparent" class="px-2" v-if="!!props.criterionId">
      <v-toolbar-title class="text-subtitle-1 font-weight-medium"> Comments </v-toolbar-title>
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
          <div class="text-body-2 mt-1 comment-content ql-editor" v-html="renderContent(comment.content)"></div>
        </v-list-item>
        <v-divider v-if="index !== comments.length - 1 && comments.length > 1"></v-divider>
      </template>
    </v-list>
    <v-divider></v-divider>
    <div class="pa-3">
      <QuillEditor
        :key="editorKey"
        v-model:content="newComment"
        content-type="html"
        @ready="onEditorReady"
        :options="{
          placeholder: 'Add a comment — type @ to mention someone',
          modules: quillModules,
        }"
      />
      <div class="d-flex mt-2">
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" :disabled="isCommentEmpty" @click="addComment()">Add Comment</v-btn>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
/* wanted to avoid custom css blocks, but seems like the best way to style mention blocks */
.comment-content.ql-editor {
  padding: 0;
  min-height: 0;
  overflow: visible;
}
.comment-content :deep(p) {
  margin: 0;
}

:deep(.ql-picker-options) {
  z-index: 10;
}
/* customize heading sizes */
:deep(.ql-editor h1) {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0.2em 0;
}
:deep(.ql-editor h2) {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0.2em 0;
}
:deep(.ql-editor h3) {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0.2em 0;
}
.comment-content :deep(.mention) {
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
  color: rgb(var(--v-theme-primary)) !important;
  border-radius: 6px !important;
  padding: 1px 2px !important;
  font-weight: 500 !important;
}
</style>
