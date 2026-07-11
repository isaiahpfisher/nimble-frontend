<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import ocLogo from "/oc_logo.png";
import ProjectServices from "../services/ProjectServices";
import SnackBar from "./SnackBar.vue";
import UserMenu from "./UserMenu.vue";
import { useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const title = ref("Nimble");
const snackbar = ref(null);

// tells us if we're acting as an admin
// so we can make it clear that we're not a part of the project
const isAdminArea = computed(() => route.meta.admin === true);

const user = ref(null);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));

  if (route.params.id && !isAdminArea.value) {
    localStorage.setItem("selectedProjectId", route.params.id);
  }

  loadProjects();
  window.addEventListener("project-updated", loadProjects);
});

onUnmounted(() => {
  window.removeEventListener("project-updated", loadProjects);
});

// Project stuff
const projects = ref([]);
const selectedProject = ref(null);

// inject projectId into route
function projectRoute(name = "projectBoard") {
  return selectedProject.value
    ? { name, params: { id: selectedProject.value.id } }
    : { name: "home" };
}

async function loadProjects() {
  try {
    const response = await ProjectServices.getProjectsForCurrentUser();
    projects.value = response.data ?? [];
  } catch (error) {
    console.log(error);
    snackbar.value.show(error.message);
    return;
  }

  const localStorageProjectId = Number(
    localStorage.getItem("selectedProjectId"),
  );
  selectedProject.value =
    projects.value.find((p) => p.id === localStorageProjectId) ??
    projects.value[0] ??
    null;

  if (selectedProject.value) {
    localStorage.setItem("selectedProjectId", selectedProject.value.id);
  }
}

function selectProject(project) {
  selectedProject.value = project;
  localStorage.setItem("selectedProjectId", project.id);
  router.push({ name: route.name, params: { id: project.id } });
}

function createProject() {
  router.push({ name: "createProject" });
}

// Navigation stuff
const userItems = ref([
  { title: "Story Board", icon: "mdi-view-column", name: "projectBoard" },
  { title: "Backlog", icon: "mdi-database", name: "projectBacklog" },
  { title: "Sprints", icon: "mdi-chart-gantt", name: "projectSprints" },
  {
    title: "Project Settings",
    icon: "mdi-cog",
    name: "generalProjectSettings",
  },
]);
const adminItems = ref([
  { title: "Projects", icon: "mdi-cube-outline", name: "adminProjects" },
  { title: "Users", icon: "mdi-account-group", name: "adminUsers" },
]);
</script>

<template>
  <v-app-bar color="primary" app dark>
    <router-link :to="isAdminArea ? { name: 'adminProjects' } : projectRoute()">
      <v-img class="mx-2" :src="ocLogo" height="50" width="50" contain></v-img>
    </router-link>
    <v-toolbar-title class="title">{{ title }}</v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn
      v-if="!isAdminArea"
      class="mx-4"
      variant="flat"
      color="white"
      prepend-icon="mdi-plus"
      @click="snackbar.show('TODO: Implement Story Creation')"
    >
      New Story
    </v-btn>
  </v-app-bar>

  <v-navigation-drawer
    v-if="user !== null && !isAdminArea"
    color="primary"
    permanent
  >
    <template v-if="!isAdminArea">
      <v-list nav>
        <v-menu location="bottom" min-width="220">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              variant="text"
              rounded="lg"
              class="px-2"
            >
              <div class="d-flex align-center">
                <v-avatar color="accent" size="32" rounded="lg">
                  <span class="text-white text-caption font-weight-bold">
                    {{ selectedProject?.title[0] ?? "?" }}
                  </span>
                </v-avatar>
                <div class="ml-3 text-body-2 font-weight-medium">
                  {{ selectedProject?.title ?? "Select a project" }}
                </div>
                <v-spacer></v-spacer>
                <v-icon icon="mdi-unfold-more-horizontal" size="small"></v-icon>
              </div>
            </v-list-item>
          </template>
          <v-list density="compact" nav>
            <v-list-subheader>My Projects</v-list-subheader>
            <v-list-item
              v-for="project in projects"
              :key="project.id"
              :active="project.id === selectedProject?.id"
              @click="selectProject(project)"
            >
              <template v-slot:prepend>
                <v-avatar color="accent" size="28" rounded="lg">
                  <span class="text-white text-caption font-weight-bold">
                    {{ project.title[0] }}
                  </span>
                </v-avatar>
              </template>
              <v-list-item-title>{{ project.title }}</v-list-item-title>
            </v-list-item>

            <v-divider class="my-1"></v-divider>

            <v-list-item
              prepend-icon="mdi-plus"
              title="Create Project"
              @click="createProject"
            ></v-list-item>
          </v-list>
        </v-menu>
      </v-list>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in userItems"
          :key="item.name"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="projectRoute(item.name)"
        ></v-list-item>
      </v-list>
    </template>

    <template v-slot:append>
      <template v-if="user.isAdmin">
        <v-divider></v-divider>
        <v-list density="compact" nav>
          <v-list-item
            v-for="item in adminItems"
            :key="item.name"
            :prepend-icon="item.icon"
            :title="item.title"
            :to="{ name: item.name }"
          ></v-list-item>
        </v-list>
      </template>

      <v-divider></v-divider>
      <UserMenu />
    </template>
  </v-navigation-drawer>

  <SnackBar ref="snackbar" />
</template>
