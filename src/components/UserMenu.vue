<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import UserServices from "../services/UserServices";
import SnackBar from "./SnackBar.vue";

const router = useRouter();
const snackbar = ref(null);
const user = ref(null);

const fullName = computed(() =>
  user.value ? `${user.value.firstName} ${user.value.lastName}` : "",
);
const initials = computed(() =>
  user.value ? `${user.value.firstName[0]}${user.value.lastName[0]}` : "",
);

onMounted(() => {
  user.value = JSON.parse(localStorage.getItem("user"));
});

function logout() {
  UserServices.logoutUser()
    .then((data) => console.log(data))
    .catch((error) => {
      console.log(error);
      snackbar.value.show(error.message);
    });
  localStorage.removeItem("user");
  user.value = null;
  router.push({ name: "login" });
}
</script>

<template>
  <v-list nav>
    <v-menu location="top end" min-width="200" rounded>
      <template v-slot:activator="{ props }">
        <v-list-item v-bind="props" class="px-2">
          <div class="d-flex align-center">
            <v-avatar color="accent" size="40">
              <span class="text-white font-weight-bold">{{ initials }}</span>
            </v-avatar>
            <div class="ml-3">
              <div class="text-body-2">{{ fullName }}</div>
              <div class="text-caption">{{ user?.email }}</div>
            </div>
          </div>
        </v-list-item>
      </template>
      <v-card>
        <v-card-text class="text-center">
          <v-avatar color="accent">
            <span class="text-white text-h5">{{ initials }}</span>
          </v-avatar>
          <h3>{{ fullName }}</h3>
          <p class="text-caption mt-1">{{ user?.email }}</p>
          <v-divider class="my-3"></v-divider>
          <v-btn rounded variant="text" @click="logout()">Logout</v-btn>
        </v-card-text>
      </v-card>
    </v-menu>
  </v-list>

  <SnackBar ref="snackbar" />
</template>
