<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import ProjectServices from "../../../services/ProjectServices.js";
import ProjectMemberServices from "../../../services/ProjectMemberServices.js";
import UserServices from "../../../services/UserServices.js";
import SnackBar from "../../../components/SnackBar.vue";
import { useRouter } from "vue-router";
const router = useRouter();

const route = useRoute();

const user = ref(null);
const users = ref(null);
const projectId = ref(route.params.id);
const project = ref(null);
const projectMembers = ref(null);
const snackbar = ref(null);
const headers = [
  { title: 'userId', key: 'userId', value: (item) => getUsername(item.userId)},
  { title: 'role', key: 'isManager', value: (item) => item.isManager==1 ? 'Manager' : 'Member' },
]

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getUsers()
  getProjectMembers(projectId.value);
});

function getUsername(id){
  var username = "";
  for(var i = 0; i < users.value.length; i++){
    if(users.value[i].id == id){
      username = users.value[i].firstName + " " + users.value[i].lastName;
    }
    console.log(users.value[i].id + users.value[i].firstName + id);
  }
  return username;
}

function leavepage(){
  router.push({ name: "addMember" });
}

async function getUsers() {
  try {
    const response = await UserServices.getUsers();
    users.value = response.data;
    console.log(users.value);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}


async function getProjectMembers(id) {
  try {
    const response = await ProjectMemberServices.getProjectMembersForCurrentProject(id);
    projectMembers.value = response.data;
    console.log(projectMembers.value);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-container v-if="!projectMembers">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <v-card variant="flat" border rounded="lg">
      <v-data-table
        v-model:search="search"
        :filter-keys="['userId', projectId]"
        :items="projectMembers"
        :headers="headers"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title> Project Members </v-toolbar-title>

            <v-text-field
              v-model="search"
              class="me-2"
              density="compact"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              variant="solo-filled"
              flat
              hide-details
              single-line
            ></v-text-field>

            <v-btn
              class="me-2"
              prepend-icon="mdi-plus"
              rounded="lg"
              text="New Project"
              @click="leavepage()"
            ></v-btn>
          </v-toolbar>
        </template>
      </v-data-table>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
