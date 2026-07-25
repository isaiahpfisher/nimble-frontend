<script setup>
import { computed, ref } from "vue";
import {
  initials,
  fieldLabel,
  changeValue,
  ACTION_META,
  SUBJECT_TYPE,
  RELATION_DIRECTION,
  ACTIVITY_ACTION,
} from "../utils/activity.js";
import { format, formatDistanceToNow } from "date-fns";
import DOMPurify from "dompurify";

const props = defineProps({
  activity: { type: Object, required: true },
  projectId: { type: [Number, String], required: true },
});

const metadata = computed(() => props.activity.metadata ?? {});

const author = computed(() =>
  props.activity.user
    ? `${props.activity.user.firstName} ${props.activity.user.lastName}`
    : (metadata.value.user ?? "Unknown user"),
);

const action = computed(() => ACTION_META[props.activity.action] ?? ACTION_META[ACTIVITY_ACTION.UPDATED]);

const summary = computed(() => {
  const created = props.activity.action === ACTIVITY_ACTION.CREATED;
  const deleted = props.activity.action === ACTIVITY_ACTION.DELETED;

  if (props.activity.subjectType === SUBJECT_TYPE.STORY) {
    return created ? "created this story" : deleted ? "deleted this story" : "updated this story";
  }

  if (props.activity.subjectType === SUBJECT_TYPE.ACCEPTANCE_CRITERIA) {
    return `${created ? "added" : deleted ? "deleted" : "updated"} acceptance criteria`;
  }

  if (props.activity.subjectType === SUBJECT_TYPE.COMMENT) {
    const onCriteria = metadata.value.subjectType !== SUBJECT_TYPE.STORY;
    const verb = created ? "commented" : "deleted a comment";
    return onCriteria ? `${verb} on acceptance criteria` : verb;
  }

  if (props.activity.subjectType === SUBJECT_TYPE.RELATION) {
    const incoming = metadata.value.direction === RELATION_DIRECTION.INCOMING;
    if (created) {
      return incoming ? "linked this story to" : "added a relation to";
    }
    return incoming ? "unlinked this story from" : "removed the relation to";
  }

  return props.activity.action;
});

const subject = computed(() => {
  if (props.activity.subjectType === SUBJECT_TYPE.ACCEPTANCE_CRITERIA) {
    return {
      text: metadata.value.title,
      icon: "mdi-check-circle-outline",
    };
  }

  if (props.activity.subjectType === SUBJECT_TYPE.COMMENT) {
    return metadata.value.subjectType === SUBJECT_TYPE.STORY
      ? null
      : {
          text: metadata.value.subjectLabel,
          icon: "mdi-check-circle-outline",
        };
  }

  if (props.activity.subjectType === SUBJECT_TYPE.RELATION) {
    return {
      text: metadata.value.other?.title,
      icon: "mdi-link-variant",
      to: {
        name: "editStory",
        params: {
          projectId: props.projectId,
          storyId: metadata.value.other?.id,
        },
      },
    };
  }

  return null;
});

const comment = computed(() =>
  props.activity.subjectType === SUBJECT_TYPE.COMMENT ? DOMPurify.sanitize(metadata.value.content ?? "") : "",
);

const changes = computed(() => props.activity.change ?? []);

const expanded = ref(false);

const detailLabel = computed(() => {
  if (comment.value) {
    return "comment";
  }
  return changes.value.length === 1 ? "1 change" : `${changes.value.length} changes`;
});
</script>

<template>
  <div class="d-flex ga-3 px-4 py-3">
    <v-avatar color="accent" size="28">
      <span class="text-white text-caption font-weight-bold">
        {{ initials(activity.user, metadata.user) }}
      </span>
    </v-avatar>

    <div class="d-flex flex-column flex-grow-1" style="min-width: 0">
      <div class="d-flex align-center ga-2 flex-wrap" style="min-height: 28px">
        <v-icon :icon="action.icon" :color="action.color" size="18"></v-icon>
        <span class="text-body-2 font-weight-medium">{{ author }}</span>
        <span class="text-body-2 text-medium-emphasis">{{ summary }}</span>

        <v-chip v-if="subject?.text" :to="subject.to" :prepend-icon="subject.icon" size="small" label variant="tonal">
          {{ subject.text }}
        </v-chip>

        <v-btn
          v-if="comment || changes.length"
          :text="detailLabel"
          :append-icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          variant="text"
          size="x-small"
          color="medium-emphasis"
          @click="expanded = !expanded"
        ></v-btn>

        <v-tooltip :text="format(activity.createdAt, 'PPpp')">
          <template v-slot:activator="{ props }">
            <span v-bind="props" class="text-caption text-disabled ml-auto">
              {{ formatDistanceToNow(activity.createdAt, { addSuffix: true }) }}
            </span>
          </template>
        </v-tooltip>
      </div>

      <v-expand-transition>
        <div v-if="comment && expanded" class="mb-2">
          <div
            class="text-body-2 mt-2 pa-3 pb-1 rounded-lg bg-secondary comment-content ql-editor"
            v-html="comment"
          ></div>
        </div>
      </v-expand-transition>

      <v-expand-transition>
        <div v-if="changes.length && expanded" class="d-flex flex-wrap ga-2 mt-2">
          <div v-for="change in changes" :key="change.id" class="d-flex align-center">
            <v-chip size="small" label variant="tonal" style="max-width: 400px">
              <span class="mr-1" style="font-weight: 500"> {{ fieldLabel(change.attribute) }}: </span>
              <span class="text-decoration-line-through mr-1">
                {{ changeValue(change.oldValue) }}
              </span>
              <v-icon icon="mdi-arrow-right" size="10" color="medium-emphasis mr-1"></v-icon>
              {{ changeValue(change.newValue) }}
            </v-chip>
          </div>
        </div>
      </v-expand-transition>
    </div>
  </div>
</template>

<style scoped>
/* wanted to avoid custom css blocks, but seems like the best way to style mention blocks */
.comment-content.ql-editor {
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
