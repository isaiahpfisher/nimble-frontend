<script setup>
import { useRouter } from "vue-router";
import { formatDate } from "../utils/date.js";
import ActivityServices from "../services/ActivityServices.js";
import { initials, SUBJECT_TYPE, RELATION_DIRECTION, ACTIVITY_ACTION } from "../utils/activity.js";
import { format, formatDistanceToNow } from "date-fns";
import DOMPurify from "dompurify";

const props = defineProps({
  activity: { type: Object, required: true },
});

const emit = defineEmits(["error"]);

function renderContent(content) {
  return DOMPurify.sanitize(content ?? "");
}

const router = useRouter();
</script>

<template>
  <v-list-item class="py-3">
    <template #prepend>
      <v-avatar color="accent" size="36">
        <span class="text-white text-caption font-weight-bold">
          {{ initials(activity.user, activity.metadata.user) }}
        </span>
      </v-avatar>
    </template>
    <v-list-item-title class="d-flex align-center ga-2 overflow-visible">
      <span class="text-body-2 font-weight-medium">
        {{ activity.user ? activity.user.firstName + " " + activity.user.lastName : activity.metadata.user }}
      </span>
      <span class="text-medium-emphasis text-caption">
        <v-tooltip :text="format(activity.createdAt, 'PPpp')">
          <template v-slot:activator="{ props }">
            <span v-bind="props">{{ formatDistanceToNow(activity.createdAt, { addSuffix: true }) }}</span>
          </template>
        </v-tooltip>
      </span>
    </v-list-item-title>
    <div class="text-body-2 mt-1">
      <template v-if="activity.action === ACTIVITY_ACTION.CREATED">
        <span v-if="activity.subjectType === SUBJECT_TYPE.STORY">Created this story</span>

        <span v-else-if="activity.subjectType === SUBJECT_TYPE.ACCEPTANCE_CRITERIA">
          Added acceptance criteria "{{ activity.metadata.title }}" with status of "{{ activity.metadata.status }}."
        </span>

        <span v-else-if="activity.subjectType === SUBJECT_TYPE.COMMENT">
          <i class="text-medium-emphasis text-caption">
            {{
              activity.metadata.subjectType === SUBJECT_TYPE.STORY
                ? "Commented"
                : `Commented on acceptance criteria "${activity.metadata.subjectLabel}"`
            }}:
          </i>
          <div
            class="text-body-2 mt-1 comment-content ql-editor"
            v-html="renderContent(activity.metadata.content)"
          ></div>
        </span>

        <span v-else-if="activity.subjectType === SUBJECT_TYPE.RELATION">
          {{
            activity.metadata.direction === RELATION_DIRECTION.OUTGOING
              ? "Added a relation to story"
              : "Linked this story to"
          }}
          "{{ activity.metadata.other.title }}"
        </span>
      </template>

      <template v-else-if="activity.action === ACTIVITY_ACTION.DELETED">
        <span v-if="activity.subjectType === SUBJECT_TYPE.STORY">Deleted this story</span>

        <span v-else-if="activity.subjectType === SUBJECT_TYPE.ACCEPTANCE_CRITERIA">
          Deleted acceptance criteria "{{ activity.metadata.title }}"
        </span>

        <span v-else-if="activity.subjectType === SUBJECT_TYPE.COMMENT">
          <i class="text-medium-emphasis text-caption">
            {{
              activity.metadata.subjectType === SUBJECT_TYPE.STORY
                ? "Deleted comment"
                : `Deleted comment on acceptance criteria "${activity.metadata.subjectLabel}"`
            }}:
          </i>
          <div
            class="text-body-2 mt-1 comment-content ql-editor"
            v-html="renderContent(activity.metadata.content)"
          ></div>
        </span>

        <span v-else-if="activity.subjectType === SUBJECT_TYPE.RELATION">
          {{
            activity.metadata.direction === RELATION_DIRECTION.OUTGOING
              ? "Removed a relation to story"
              : "Unlinked this story from"
          }}
          "{{ activity.metadata.other.title }}"
        </span>
      </template>

      <template v-else-if="activity.action === ACTIVITY_ACTION.UPDATED">
        <span v-if="activity.subjectType === SUBJECT_TYPE.STORY">Updated this story</span>

        <span v-else-if="activity.subjectType === SUBJECT_TYPE.ACCEPTANCE_CRITERIA">
          Updated acceptance criteria "{{ activity.metadata.title }}"
        </span>
      </template>
    </div>
  </v-list-item>
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
