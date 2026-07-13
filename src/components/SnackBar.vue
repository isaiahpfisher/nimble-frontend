<script setup>
import { ref } from "vue";

const snackbar = ref({
  value: false,
  color: "",
  text: "",
});

function show(text, color = "error") {
  snackbar.value.text = text;
  snackbar.value.color = color;
  snackbar.value.value = true;
}

function close() {
  snackbar.value.value = false;
}

defineExpose({ show });
</script>

<template>
  <v-snackbar v-model="snackbar.value" rounded="pill" variant="tonal">
    {{ snackbar.text }}

    <template v-slot:actions>
      <v-btn :color="snackbar.color" variant="text" @click="close()">
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>
