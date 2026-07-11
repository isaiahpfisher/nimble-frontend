<script setup>
import { onMounted } from "vue";
import { ref, toRaw } from "vue";
import { useRouter } from "vue-router";
import UserServices from "../../services/UserServices.js";
import SnackBar from "../../components/SnackBar.vue";

const router = useRouter();
const isCreateAccount = ref(false);
const snackbar = ref(null);
const user = ref({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
});

onMounted(async () => {
  localStorage.removeItem("user");
});

async function createAccount() {
  await UserServices.addUser(user.value)
    .then(() => {
      snackbar.value.show("Account created successfully!", "green");
      router.push({ name: "login" });
    })
    .catch((error) => {
      console.log(error);
      snackbar.value.show(error.message);
    });
}

async function login() {
  await UserServices.loginUser(user)
    .then((data) => {
      window.localStorage.setItem("user", JSON.stringify(data.data));
      snackbar.value.show("Login successful!", "green");
      router.push({ name: "home" });
    })
    .catch((error) => {
      console.log(error);
      snackbar.value.show(error.message);
    });
}

function openCreateAccount() {
  isCreateAccount.value = true;
}

function closeCreateAccount() {
  isCreateAccount.value = false;
}
</script>

<template>
  <v-container>
    <div id="body">
      <v-card class="rounded-lg elevation-5">
        <v-card-title class="headline mb-2">Login </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="user.email"
            label="Email"
            required
          ></v-text-field>

          <v-text-field
            v-model="user.password"
            label="Password"
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="flat" color="secondary" @click="openCreateAccount()"
            >Create Account</v-btn
          >
          <v-spacer></v-spacer>

          <v-btn variant="flat" color="primary" @click="login()">Login</v-btn>
        </v-card-actions>
      </v-card>

      <v-dialog persistent v-model="isCreateAccount" width="800">
        <v-card class="rounded-lg elevation-5">
          <v-card-title class="headline mb-2">Create Account </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="user.firstName"
              label="First Name"
              required
            ></v-text-field>

            <v-text-field
              v-model="user.lastName"
              label="Last Name"
              required
            ></v-text-field>

            <v-text-field
              v-model="user.email"
              label="Email"
              required
            ></v-text-field>

            <v-text-field
              v-model="user.password"
              label="Password"
              required
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              variant="flat"
              color="secondary"
              @click="closeCreateAccount()"
              >Close</v-btn
            >
            <v-btn variant="flat" color="primary" @click="createAccount()"
              >Create Account</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>

      <SnackBar ref="snackbar" />
    </div>
  </v-container>
</template>
