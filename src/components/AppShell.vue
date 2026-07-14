<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import ocLogo from "/oc_logo.png";
import UserServices from "../services/UserServices";
import ProjectServices from "../services/ProjectServices";
import SnackBar from "./SnackBar.vue";
import { useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const title = ref("Nimble");
const snackbar = ref(null);

// User stuff
const user = ref(null);
const fullName = computed(() =>
  user.value ? `${user.value.firstName} ${user.value.lastName}` : "",
);
const initials = computed(() =>
  user.value ? `${user.value.firstName[0]}${user.value.lastName[0]}` : "",
);

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));

  if (!user.value) return;

  loadProjects();
  window.addEventListener("project-updated", loadProjects);
});

onUnmounted(() => {
  window.removeEventListener("project-updated", loadProjects);
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

// Project stuff
const projects = ref([]); // current user's projects
const selectedProject = ref(null);

// Only project routes carry a project id in `:id`. Other routes (e.g.
// /admin/users/:id) reuse the `id` param for a different entity, so we must
// not treat those as a selected project.
const isProjectRoute = computed(() =>
  route.matched.some((r) => r.path.startsWith("/projects/")),
);
const routeProjectId = computed(() =>
  isProjectRoute.value ? Number(route.params.id) || null : null,
);

// An admin can open a project they don't belong to/
// We need to check that to render things differently for admins.
const isAdminViewing = computed(
  () =>
    routeProjectId.value != null &&
    user.value?.isAdmin &&
    !projects.value.some((p) => p.id === routeProjectId.value),
);

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

  const myProject = projects.value.find((p) => p.id === routeProjectId.value);
  // only update local storage if we're not an admin peeking at a project
  if (myProject) {
    selectedProject.value = myProject;
    localStorage.setItem("selectedProjectId", myProject.id);
  } else if (isAdminViewing.value) {
    try {
      const response = await ProjectServices.getProject(routeProjectId.value);
      selectedProject.value = response.data;
    } catch (error) {
      console.log(error);
      snackbar.value.show(error.message);
    }
  } else {
    // No project in the route → restore the last selected member project.
    const savedId = Number(localStorage.getItem("selectedProjectId"));
    selectedProject.value =
      projects.value.find((p) => p.id === savedId) ?? projects.value[0] ?? null;
    if (selectedProject.value) {
      localStorage.setItem("selectedProjectId", selectedProject.value.id);
    }
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
    <router-link :to="projectRoute()">
      <v-img class="mx-2" :src="ocLogo" height="50" width="50" contain></v-img>
    </router-link>
    <v-toolbar-title class="title">{{ title }}</v-toolbar-title>

    <v-spacer></v-spacer>

    <v-btn
      v-if="isAdminViewing"
      class="mx-4"
      variant="flat"
      color="white"
      prepend-icon="mdi-arrow-left"
      :to="{ name: 'adminProjects' }"
    >
      Back to Projects
    </v-btn>
    <v-btn
      v-else-if="user !== null"
      class="mx-4"
      variant="flat"
      color="white"
      prepend-icon="mdi-plus"
      @click="snackbar.show('TODO: Implement Story Creation')"
    >
      New Story
    </v-btn>
  </v-app-bar>

  <v-navigation-drawer v-if="user !== null" color="primary" permanent>
    <v-list nav>
      <v-menu location="bottom" min-width="220">
        <template v-slot:activator="{ props }">
          <v-list-item v-bind="props" variant="text" rounded="lg" class="px-2">
            <div class="d-flex align-center">
              <v-avatar color="accent" size="32" rounded="lg">
                <span class="text-white text-caption font-weight-bold">
                  {{ selectedProject?.title[0] ?? "?" }}
                </span>
              </v-avatar>
              <div class="ml-3 text-body-2 font-weight-medium">
                {{ selectedProject?.title ?? "Select a project" }}
                <v-chip
                  v-if="isAdminViewing"
                  class="ml-1"
                  size="x-small"
                  color="warning"
                  variant="flat"
                  prepend-icon="mdi-shield-crown"
                  label
                >
                  Admin
                </v-chip>
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
      <v-list nav>
        <v-menu location="top end" min-width="200" rounded>
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" class="px-2">
              <div class="d-flex align-center">
                <v-avatar color="accent" size="40">
                  <span class="text-white font-weight-bold">{{
                    initials
                  }}</span>
                </v-avatar>
                <div class="ml-3">
                  <div class="text-body-2">{{ fullName }}</div>
                  <div class="text-caption">{{ user.email }}</div>
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
              <p class="text-caption mt-1">{{ user.email }}</p>
              <v-divider class="my-3"></v-divider>
              <v-btn rounded variant="text" @click="logout()">Logout</v-btn>
            </v-card-text>
          </v-card>
        </v-menu>
      </v-list>
    </template>
  </v-navigation-drawer>

  <SnackBar ref="snackbar" />
</template>
