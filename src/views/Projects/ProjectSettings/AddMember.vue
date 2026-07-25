<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import ProjectMemberServices from "../../../services/ProjectMemberServices.js";
import UserServices from "../../../services/UserServices.js";
import SnackBar from "../../../components/SnackBar.vue";
import { useRouter } from "vue-router";
const router = useRouter();

const route = useRoute();

const user = ref(null);
const users = ref(null);
var userManager = false;
const projectMember = {isManager: "0",  "userId": ref(null),   "projectId": ref(null)};
const projectId = ref(route.params.id);
const projectMembers = ref(null);
const snackbar = ref(null);
const headers = [
    { title: 'name', key: 'firstName', value: (item) => item.firstName +' '+ item.lastName},
    { title: 'Add', value: 'action' }
]
const search = ref("");

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getProjectMembers(projectId.value);
});

function leavepage(){
  router.push({ name: "membersProjectSettings" });
}

async function getProjectMembers(id) {
  try {
    const response = await ProjectMemberServices.getProjectMembersForCurrentProject(id);
    projectMembers.value = response.data;
    getUsers();
    userIsManager();
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function getUsers() {
  try {
    const response = await UserServices.getUsers();
    users.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

function isMember(id){
var trueText = false;
  for(var i = 0; i < projectMembers.value.length; i++){
    if(projectMembers.value[i].userId == id){
      trueText = true;
    }
  }
  return trueText;
}

async function addMember(id){
  try {
    projectMember.userId = id;
    projectMember.projectId = projectId.value;
    const response = await ProjectMemberServices.createProjectMember(projectMember, projectId.value, id);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
  getProjectMembers(projectId.value);
}

function userIsManager(){
    for(var i = 0; i < projectMembers.value.length; i++){
    if(projectMembers.value[i].userId == user.value.id){
      userManager = true;
    }
  }
  if(userManager == false){
      snackbar.value.show("Unauthorized");
    }
}

</script>

<template>
  <v-container v-if="!users||!userManager">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <v-card variant="flat" border rounded="lg">
      <v-data-table
        v-model:search="search"
        :filter-keys="['firstName']"
        :items="users"
        :headers="headers"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title> Users </v-toolbar-title>

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
              rounded="lg"
              text="Back"
              @click="leavepage()"
            ></v-btn>
          </v-toolbar>
        </template>
        <template v-slot:item.action="{ item }">
          <v-container v-if="isMember(item.id)">
            <a>Member</a>
          </v-container>
          <v-container v-else>
            <v-btn @click="addMember(item.id)">
              Add
            </v-btn>
          </v-container>
        </template>
      </v-data-table>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
