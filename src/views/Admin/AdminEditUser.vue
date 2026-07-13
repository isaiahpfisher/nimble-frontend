<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import UserServices from "../../services/UserServices.js";
import SnackBar from "../../components/SnackBar.vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

const id = ref(route.params.id);
const user = ref({});
const snackbar = ref(null);

onMounted(async () => {
  await getUser(id.value);
});

async function getUser(id) {
  try {
    const response = await UserServices.getUser(id);
    user.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function updateUser() {
  try {
    await UserServices.updateUser(user.value.id, user.value);
    snackbar.value.show("User updated successfully!", "green");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function deleteUser(user) {
  try {
    await UserServices.deleteUser(user);
    router.push({ name: "adminUsers" });
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-container v-if="!user">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <h4 class="pl-0 text-h5 mb-6 font-weight-medium">Edit User</h4>

    <v-card class="rounded-lg elevation-5">
      <v-card-text>
        <v-row>
          <v-col>
            <v-text-field
              v-model="user.firstName"
              label="First Name"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="user.lastName"
              label="Last Name"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field v-model="user.email" label="Email"></v-text-field>
          </v-col>
          <v-col>
            <v-select
              v-model="user.isAdmin"
              label="Role"
              :items="[
                { title: 'User', value: false },
                { title: 'Admin', value: true },
              ]"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="pt-0">
        <v-btn
          variant="flat"
          color="outlined"
          @click="deleteUser(user)"
          prepend-icon="mdi-trash-can-outline"
          >Delete User</v-btn
        >
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="updateUser()"
          >Update User</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
