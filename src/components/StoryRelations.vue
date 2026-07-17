<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import RelationServices from "../services/RelationServices.js";

const props = defineProps({
  projectId: { type: [String, Number], required: true },
  storyId: { type: Number, required: true },
  story: { type: Object, required: true },
  projectStories: { type: Array, default: () => [] },
});

const emit = defineEmits(["changed", "error"]);

const router = useRouter();
const dialog = ref(false);
const draftRelation = ref(null);

// there are four types of relations, but each has two sides or directions
// those are modeled by "forward" and "inverse" properties
// it's confusing :(
const relationTypes = {
  BLOCKS: {
    forward: "blocks", // relation from story one's point of view
    inverse: "is blocked by", // relation from story two's point of view
    color: "error",
    icon: "mdi-block-helper",
  },
  RELATES_TO: {
    forward: "relates to",
    inverse: "relates to",
    color: "blue",
    icon: "mdi-link-variant",
  },
  DUPLICATES: {
    forward: "is duplicate of",
    inverse: "is duplicate of",
    color: "yellow",
    icon: "mdi-content-duplicate",
  },
  PARENT_OF: {
    forward: "is parent of",
    inverse: "is child of",
    color: "purple",
    icon: "mdi-file-tree",
  },
};

const relationOptions = computed(() => {
  const options = [];
  const entries = Object.entries(relationTypes); // [type, properties]
  entries.forEach(([type, meta]) => {
    const forward = { title: meta.forward, value: `${type}:forward` };
    const inverse = { title: meta.inverse, value: `${type}:inverse` };
    if (meta.forward === meta.inverse) {
      options.push(forward);
    } else {
      options.push(forward);
      options.push(inverse);
    }
  });

  return options;
});

// merge incoming and outgoing relations into one list
const relations = computed(() => {
  const format = (relation, otherStory, isInverse) => ({
    id: relation.id,
    label: isInverse
      ? relationTypes[relation.type]?.inverse
      : relationTypes[relation.type]?.forward,
    color: relationTypes[relation.type]?.color,
    icon: relationTypes[relation.type]?.icon,
    otherStory,
  });

  const result = [];

  if (props.story.relationOne) {
    props.story.relationOne.forEach((r) => {
      result.push(format(r, r.storyTwo, false));
    });
  }

  if (props.story.relationTwo) {
    props.story.relationTwo.forEach((r) => {
      result.push(format(r, r.storyOne, true));
    });
  }

  return result;
});

const relationCandidates = computed(() => {
  const alreadyLinked = relations.value.map((r) => r.otherStory.id);

  return props.projectStories
    .filter((s) => s.id !== props.story.id && !alreadyLinked.includes(s.id))
    .map((s) => ({ id: s.id, label: `${s.title}` }));
});

function addRelation() {
  draftRelation.value = { option: "RELATES_TO:forward", otherId: null };
  dialog.value = true;
}

async function saveRelation() {
  const { option, otherId } = draftRelation.value;
  if (!otherId || !option) return;

  const [type, direction] = option.split(":");
  const relationInfo =
    direction === "inverse"
      ? { type, storyOneId: otherId, storyTwoId: props.story.id }
      : { type, storyOneId: props.story.id, storyTwoId: otherId };

  try {
    await RelationServices.createRelation(
      props.projectId,
      props.storyId,
      relationInfo,
    );
    dialog.value = false;
    draftRelation.value = null;
    emit("changed");
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

async function removeRelation(relationId) {
  try {
    await RelationServices.deleteRelation(
      props.projectId,
      props.storyId,
      relationId,
    );
    emit("changed");
  } catch (error) {
    console.error(error);
    emit("error", error.response?.data?.message ?? error.message);
  }
}

function openRelatedStory(id) {
  router.push({
    name: "editStory",
    params: { projectId: props.projectId, storyId: id },
  });
}
</script>

<template>
  <v-card class="rounded-lg elevation-5">
    <v-toolbar flat density="compact" color="transparent" class="px-2">
      <v-toolbar-title class="text-subtitle-1 font-weight-medium">
        Relations
      </v-toolbar-title>
      <v-btn
        prepend-icon="mdi-plus"
        rounded="lg"
        text="Add Relation"
        border
        @click="addRelation()"
      ></v-btn>
    </v-toolbar>

    <v-list bg-color="transparent">
      <v-list-item
        v-if="!relations.length"
        title="No relations yet. Click Add to link another story."
        class="text-medium-emphasis text-center"
      ></v-list-item>

      <v-list-item
        v-for="(relation, index) in relations"
        :key="relation.id"
        :class="index !== relations.length - 1 ? 'border-b-sm' : ''"
        :to="{
          name: 'editStory',
          params: {
            projectId: props.projectId,
            storyId: relation.otherStory.id,
          },
        }"
      >
        <template v-slot:prepend>
          <v-chip
            :color="relation.color"
            :prepend-icon="relation.icon"
            size="small"
            label
            class="mr-3"
          >
            {{ relation.label }}
          </v-chip>
        </template>

        <v-list-item-title>
          {{ relation.otherStory.title }}
        </v-list-item-title>

        <template v-slot:append>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="medium-emphasis"
            @click.stop="removeRelation(relation.id)"
          ></v-btn>
        </template>
      </v-list-item>
    </v-list>
  </v-card>

  <v-dialog v-model="dialog" max-width="520">
    <v-card v-if="draftRelation" class="rounded-lg">
      <v-card-title class="text-h6">Add Relation</v-card-title>
      <v-card-text>
        <v-select
          v-model="draftRelation.option"
          :items="relationOptions"
          label="Relation"
          density="compact"
        ></v-select>
        <v-autocomplete
          v-model="draftRelation.otherId"
          :items="relationCandidates"
          item-title="label"
          item-value="id"
          label="Story"
          density="compact"
        ></v-autocomplete>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-btn
          variant="flat"
          color="primary"
          :disabled="!draftRelation.otherId"
          @click="saveRelation()"
          >Add</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
