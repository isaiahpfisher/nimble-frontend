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
var userId = ref(null);
const projectId = ref(route.params.id);
const projectMemberNonManager = {isManager: "0",  "userId": ref(null),   "projectId": ref(null)};
const projectMemberManager = {isManager: "1",  "userId": ref(null),   "projectId": ref(null)};
const projectMembers = ref(null);
const snackbar = ref(null);
const search = ref("");
const headers = [
  { title: 'Name', key: 'name', value: (item) => getUsername(item.userId)},
  { title: 'Role', key: 'isManager', value: (item) => item.isManager==1 ? 'Manager' : 'Member' },
  { title: 'Change Role', value: 'action1'},
  { title: 'Remove' , value: 'action'},
]


onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  userId = user.value.id;
  getUsers()
});

function getUsername(id){
  var username = "";
  for(var i = 0; i < users.value.length; i++){
    if(users.value[i].id == id){
      username = users.value[i].firstName + " " + users.value[i].lastName;
    }
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
    getProjectMembers(projectId.value);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function getProjectMembers(id) {
  try {
    const response = await ProjectMemberServices.getProjectMembersForCurrentProject(id);
    projectMembers.value = response.data;
    userIsManager();
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function removeMember(id){
    try {
    await ProjectMemberServices.deleteProjectMember(id);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
  router.go();
}

async function addManager(id){
  try {
    projectMemberManager.userId = id;
    projectMemberManager.projectId = projectId.value;
    await ProjectMemberServices.updateProjectMember(id, projectMemberManager);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
router.go();
}
async function removeManager(id){
  try {
    projectMemberNonManager.userId = id;
    projectMemberNonManager.projectId = projectId.value;
    await ProjectMemberServices.updateProjectMember(id, projectMemberNonManager);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
router.go();

}


function userIsManager(){
    for(var i = 0; i < projectMembers.value.length; i++){
    if(projectMembers.value[i].userId == user.value.id){
      userManager = true;
    }
    console.log(user.value.id);
  }
}

function checkIfUser(id){
  console.log(id+" vs "+user.value.id)
  return user.value.id == id;
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
        :filter-keys="['name', 'isManager']"
        :items="projectMembers"
        :headers="headers"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title> Project Members </v-toolbar-title>
            <v-container>
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
            </v-container>
            <v-container v-if="userManager">
            <v-btn
              class="me-2"
              prepend-icon="mdi-plus"
              rounded="lg"
              alignment="right"
              text="Add Member"
              @click="leavepage()"
            ></v-btn>
            </v-container>
          </v-toolbar>
        </template>
        <template v-slot:item.action1="{ item }">
          <v-container v-if="item.isManager == '0'&&userManager&&!checkIfUser(item.userId)">
            <v-btn @click="addManager(item.id)">
              Add Manager
            </v-btn>
          </v-container>
          <v-container v-else-if = "userManager&&!checkIfUser(item.userId)">
            <v-btn @click="removeManager(item.id)">
              Remove Manager
            </v-btn>
          </v-container>
          <v-container v-else>

          </v-container>
        </template>
        <template v-slot:item.action="{ item }">
          <v-containter v-if = '!checkIfUser(item.userId)'>
            <v-btn @click="removeMember(item.id)">
              Remove
            </v-btn>
            </v-containter>
        </template>
      </v-data-table>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
