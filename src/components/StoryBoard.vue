<script setup>
import { ref, onMounted } from "vue";
import StoryStateServices from "../services/StoryStateServices";

const props = defineProps({
  projectId: { type: Number, required: true },
  sprintId: { type: Number, required: true}
});

//maybe I'll return to this code later

const project = ref(null);
const sprints = ref(null);
const storyStates = ref(null);

async function getStoryStates(id) {
  try {
    const response = await StoryStateServices.getStoryStatesForProject(id);
    storyStates.value = response.data;
    console.log(props.projectId);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

onMounted(async () => {
  //user.value = JSON.parse(localStorage.getItem("user"));
  getStoryStates(props.projectId);
});

</script>

<template>
<h1>Hello this is storyboard!</h1>
<a></a>
<v-col 
v-for="(storyState, i) in storyStates"

:key="i"
cols="20"
md="6">
<v-card class="rounded">
    <v-card-title class="text-h6">Story States</v-card-title>
      <v-list lines="two">
        <draggable
          v-model="storyStates"
          item-key="id"
          animation="200"
          @change="handleDrop"
        >
          <template #item="{ element, index }">
            <v-list-item
              :key="element.id"
              class="cursor-grab"
              :class="{
                'border-b': index < storyStates.length - 1 || editingId === -1,
              }"
            >
              <template v-slot:prepend>
                <v-icon class="text-medium-emphasis" icon="mdi-drag"></v-icon>
              </template>

              <template v-slot:title>
                <v-text-field
                  v-if="editingId === element.id"
                  v-model="editName"
                  density="compact"
                  hide-details
                  autofocus
                  @blur="saveEditing(element)"
                  @keyup.enter="saveEditing(element)"
                  @keyup.esc="cancelEditing"
                ></v-text-field>
                <span v-else>{{ element.name }}</span>
              </template>

              <template v-slot:append>
                <v-btn
                  icon="mdi-pencil"
                  variant="tonal"
                  size="small"
                  @click="startEditing(element)"
                ></v-btn>
                <v-btn
                  class="ml-1"
                  icon="mdi-trash-can-outline"
                  variant="flat"
                  size="small"
                  color="error"
                  @click="confirmDeleteStoryState(element)"
                ></v-btn>
              </template>
            </v-list-item>
          </template>
        </draggable>
        <v-list-item v-if="editingId === -1">
          <template v-slot:prepend>
            <v-btn
              class="mr-4"
              icon="mdi-plus"
              variant="flat"
              color="secondary"
              size="small"
              @click="saveAdding"
            ></v-btn>
          </template>

          <template v-slot:title>
            <v-text-field
              v-model="editName"
              density="compact"
              hide-details
              autofocus
              @blur="saveAdding"
              @keyup.enter="saveAdding"
              @keyup.esc="cancelAdding"
            ></v-text-field>
          </template>
        </v-list-item>
      </v-list>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="startAdding"
          >New Story State</v-btn
        >
      </v-card-actions>
    </v-card>
    </v-col>
</template>
