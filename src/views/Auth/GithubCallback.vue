<template>
  <v-container class="d-flex justify-center align-center" style="height: 100vh;">
    <v-progress-circular v-if="loading" indeterminate color="primary" />
    <p v-if="error" class="text-error">{{ error }}</p>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  const code = route.query.code;

  if (!code) {
    error.value = "No authorization code received from GitHub.";
    loading.value = false;
    return;
  }

  try {
    const res = await fetch("http://localhost:3200/nimbleapi/github/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      throw new Error("GitHub login failed.");
    }

    const data = await res.json();

   
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));

    router.push("/"); 
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>