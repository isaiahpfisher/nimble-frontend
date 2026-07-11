<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import UserServices from "../../services/UserServices.js";
import SnackBar from "../../components/SnackBar.vue";
import { useRouter } from "vue-router";

const router = useRouter();

const user = ref({});
const snackbar = ref(null);

async function addUser() {
  try {
    const newUser = await UserServices.addUser(user.value);
    router.push({ name: "adminEditUser", params: { id: newUser.data.id } });
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-container>
    <h4 class="pl-0 text-h5 mb-6 font-weight-medium">Create User</h4>

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
            <v-text-field
              v-model="user.password"
              label="Password"
              type="password"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="addUser()"
          >Create User</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
