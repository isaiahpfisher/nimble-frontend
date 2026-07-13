<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import ProjectServices from "../../services/ProjectServices.js";
import UserServices from "../../services/UserServices.js";
import SnackBar from "../../components/SnackBar.vue";
import { useRouter } from "vue-router";

const router = useRouter();

const user = ref(null);
const project = ref({});
const users = ref([]);
const snackbar = ref(null);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  await getUsers();
});

async function getUsers() {
  try {
    const response = await UserServices.getUsers();
    users.value = response.data.map((u) => ({
      title: `${u.firstName} ${u.lastName}`,
      value: u.id,
    }));
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function createProject() {
  try {
    const newProject = await ProjectServices.createProjectAsAdmin(
      project.value,
    );
    router.push({ name: "adminProjects" });
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-container>
    <h4 class="pl-0 text-h5 mb-6 font-weight-medium">Create Project (Admin)</h4>

    <v-card class="rounded-lg elevation-5">
      <v-card-text>
        <v-row>
          <v-col>
            <v-text-field v-model="project.title" label="Title"></v-text-field>
          </v-col>
          <v-col>
            <v-autocomplete
              v-model="project.managerId"
              :items="users"
              label="Manager"
            ></v-autocomplete>
          </v-col>
          <v-col>
            <v-date-input
              v-model="project.deadline"
              label="Deadline"
            ></v-date-input>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-textarea
              v-model.number="project.description"
              label="Description"
            ></v-textarea>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="createProject()"
          >Create Project</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
