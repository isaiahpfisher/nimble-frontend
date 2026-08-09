<script setup>
import { onMounted } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { Octokit, App } from "octokit";
import ProjectServices from "../../services/ProjectServices";
import SnackBar from "../../components/SnackBar.vue";
import StoryBoard from "../../components/StoryBoard.vue";
import StoryStateServices from "../../services/StoryStateServices";
import StoryServices from "../../services/StoryServices";
import SprintServices from "../../services/SprintServices";
import RepositoryServices from "../../services/RepositoryServices";
import { useRouter } from "vue-router";
import draggable from "vuedraggable";


const route = useRoute();
const router = useRouter();


const user = ref(null);
const projectId = ref(route.params.id);
const project = ref(null);
const sprintId = ref(null);
const snackbar = ref(null);
const storyStates = ref(null);
const stories = ref(null);
const sprints = ref(null);
const pullRequests = ref(null);
const repositories = ref(null);
const repoTokens = ref(null);
const octokit = ref(null);
const branches = ref(null);
const mainReference = ref(null);
var selectedSprint = ref(null);




onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getProject(projectId.value);
  getStoryStates(projectId.value);
  getStories(projectId.value);
  getSprints(projectId.value);
  getRepositories(projectId.value);
});


async function getProject(id) {
  try {
    const response = await ProjectServices.getProject(id);
    project.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}


async function getStoryStates(id) {
  try {
    const response = await StoryStateServices.getStoryStatesForProject(id);
    storyStates.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}


async function getStories(id) {
  try {
    const response = await StoryServices.getStoriesForProject(id);
    stories.value = response.data;
    console.log(stories.value);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}


async function getSprints(id) {
  try {
    const response = await SprintServices.getSprintsForProject(id);
    sprints.value = response.data;
    selectedSprint = sprints.value[0];
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function getRepositories(id) {
  try {
    const response = await RepositoryServices.getAllForProject(id);
    repositories.value = response.data;
    if(!(repositories.value == null)){
      for(var i = 0; i < repositories.value.length; i++){
        if(!(repositories.value[i].owner == null)&&!(repositories.value[i].githubToken == null)){
        console.log(repositories.value[i].githubToken+" "+ repositories.value[i].name +" "+repositories.value[i].owner+" "+repositories.value.length);
         getPullRequests(repositories.value[i].githubToken, repositories.value[i].name, repositories.value[i].owner);
         getBranches(repositories.value[i].githubToken, repositories.value[i].name, repositories.value[i].owner);
        }
      }
    }
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}




async function handleDrop(event, stateId) {
  console.log(event);
  if (!event.added) return;
  var story = event.added.element;
  story.stateId = stateId;


  try {
    await StoryServices.updateStory(projectId, story.id, story);
    snackbar.value.show("User Story updated.");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}




function editStory(storyId){
  router.push({path: '/projects/'+projectId.value+'/stories/'+storyId});
}


function selectSprint(){
  var sprint =document.getElementById("sprintselect");
  for(var i =0; i < sprints.value.length; i++){
    if(sprint.value == sprints.value[i].title){
      selectedSprint = sprints.value[i].id;
    }
  }
  getStories(projectId.value);
}







async function getPullRequests(token, repository, owner) {
  const octokit = new Octokit({
  auth: token
})
console.log(token);
  try {
    const response = await octokit.request('GET /repos/'+owner+'/'+repository+'/pulls', {
      owner: owner,
      repo: repository,
      headers: {
        'X-GitHub-Api-Version': '2026-03-10'
      }
    });
    pullRequests.value = response.data;
    checkPullRequestPositions();
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}//Test-Repository-For-Nimble

async function getBranches(token, repository, owner) {
  const octokit = new Octokit({
  auth: token
})
console.log(token);
  try {
    const response = await octokit.request('GET /repos/'+owner+'/'+repository+'/branches', {
      owner: owner,
      repo: repository,
      headers: {
        'X-GitHub-Api-Version': '2026-03-10'
      }
    });
    branches.value = response.data;
    console.log(branches.value);
    checkBranchPositions(token, repository, owner);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}


function checkPullRequestPositions() {

//positons for pull requests
  for(var i = 0; i < pullRequests.value.length; i++){
    for(var j=0; j < stories.value.length; j++){
      if((pullRequests.value.length>0)&&(stories.value.length>0)){
        if(pullRequests.value[i].head.ref == stories.value[j].title){
          if(!(project.value.prReviewStateId == null)){
            console.log(stories.value[j].stateId = project.value.prReviewStateId);
            updateStory(stories.value[j].id, stories.value[j]);
          }
        }
      }
    }
  }
}

function checkBranchPositions(token, repository, owner){
//positions for creating stories
  for(var j=0; j < stories.value.length; j++){
    if(stories.value[j].stateId == project.value.branchCreationStateId){
      var isMatch = false;
      for(var i = 0; i < branches.value.length; i++){
        if((branches.value.length>0)&&(stories.value.length>0)&&(branches.value[i].name != 'main')){
          if(branches.value[i].name == stories.value[j].title){
            isMatch = true;
          }
          console.log(branches.value[i].name +" "+stories.value[j].title)
        }
      }
      if(isMatch == false){
        //check what repository is labled for the story before running the create branch
        
        for(var x = 0; x < repositories.value.length; x++){
          if((stories.value[j].repositoryId == repositories.value[x].id)&&(repositories.value.length > 0)){
            console.log("make a new story with the name: "+stories.value[j].title+" and heres the extras "+token+repository+owner)
            createBranch(token, repository, owner, stories.value[j].title);
          }
        }
      }
    }
  }
}




async function updateStory(id, story) {
  try {
    const response = await StoryServices.updateStory(projectId.value, id, story) ;
    getStories(projectId.value);
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}

async function createBranch(token, repository, owner, name) {
  const octokit = new Octokit({
  auth: token
})
var newName = name;
//var newName = name.split(" ").join("_");

//i dont like that its a try catch in a try catch
  try {
    const response = await octokit.request('GET /repos/'+owner+'/'+repository+'/git/ref/heads/main', {
      owner: owner,
      repo: repository,
      ref: 'heads/main',
      headers: {
        'X-GitHub-Api-Version': '2026-03-10'
      }
    });
    mainReference.value = response.data;
    console.log("SHA1 gathered");
    console.log(mainReference.value.object.sha);


  try {
    const response = await octokit.request('POST /repos/'+owner+'/'+repository+'/git/refs', {
      owner: owner,
      repo: repository,
      ref: 'refs/heads/'+newName,
      sha: mainReference.value.object.sha,
      headers: {
        'X-GitHub-Api-Version': '2026-03-10'
      }
    });
    console.log("branch created");
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }

  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }


}

</script>


<template>
  <v-container v-if="!project||!stories||!sprints">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <h4 class="pl-0 text-h5 font-weight-medium">
      {{ project.title }} - Story Board
    </h4>
    <label>Choose a Sprint:</label>
    <v-select id="sprintselect"
    :items="sprints"
    :key="id">
    </v-select>
    <v-btn variant="flat" color="primary" @click="selectSprint()">
      Select Sprint
    </v-btn>
    <space></space>
<v-row>
  <v-col
  v-for="(storyState, i) in storyStates"
  :key="i"
  >
    <v-card class="rounded" elevation-5>
        <v-card-title class="text-h6">{{ storyState.name }}</v-card-title>
            <draggable
              item-key="id"
              :list="stories.filter(element=>element.stateId == storyState.id && element.sprintId == selectedSprint)"
              group="stories"
              animation="200"
              @change="event=>handleDrop(event, storyState.id)"
            ><template #item="{element, index}">
                <v-list-item
                  :key="element.id"
                  class="cursor-grab"
                  :class="{
                    'border-b': index < storyStates.length - 1
                  }"
                >
                  <template v-slot:prepend>
                    <v-icon class="text-medium-emphasis" icon="mdi-drag"></v-icon>
                  </template>




                  <v-tooltip text="Tooltip">
                    <template v-slot:activator="{ props }">
                      {{ element.title }}
                  </template>
                  </v-tooltip>


                  <template v-slot:append>
                    <v-btn
                      icon="mdi-pencil"
                      variant="tonal"
                      size="small"
                      @click="editStory(element.id)"
                    ></v-btn>
                  </template>
                </v-list-item>
              </template>
            </draggable>
     </v-card>
  </v-col>
  </v-row>
    </v-container>


  <SnackBar ref="snackbar" />
</template>





