import { isLoggedIn } from "./guards";

export default [
  {
    path: "/projects/new",
    name: "createProject",
    component: () => import("../views/Projects/CreateProject.vue"),
    beforeEnter: isLoggedIn,
  },
  {
    path: "/projects/:id",
    name: "projectBoard",
    component: () => import("../views/Projects/StoryBoard.vue"),
    beforeEnter: isLoggedIn,
  },
  {
    path: "/projects/:id/backlog",
    name: "projectBacklog",
    component: () => import("../views/Projects/Backlog.vue"),
    beforeEnter: isLoggedIn,
  },
  {
    path: "/projects/:id/sprints",
    name: "projectSprints",
    component: () => import("../views/Projects/Sprints/Sprints.vue"),
    beforeEnter: isLoggedIn,
  },
  {
    path: "/projects/:projectId/sprints/:sprintId",
    component: () => import("../views/Projects/Sprints/SprintNav.vue"),
    beforeEnter: isLoggedIn,
    children: [
      {
        path: "",
        name: "sprintBoard",
        component: () => import("../views/Projects/Sprints/SprintBoard.vue"),
      },
      {
        path: "plan",
        name: "sprintPlan",
        component: () => import("../views/Projects/Sprints/SprintPlan.vue"),
      },
      {
        path: "retro",
        name: "sprintRetro",
        component: () => import("../views/Projects/Sprints/SprintRetro.vue"),
      },
      {
        path: "burndown",
        name: "sprintBurndown",
        component: () => import("../views/Projects/Sprints/SprintBurndown.vue"),
      },
    ],
  },
  {
    path: "/projects/:id/settings",
    component: () => import("../views/Projects/ProjectSettings/ProjectSettings.vue"),
    beforeEnter: isLoggedIn,
    children: [
      {
        path: "",
        name: "generalProjectSettings",
        component: () => import("../views/Projects/ProjectSettings/GeneralProjectSettings.vue"),
      },
      {
        path: "board-columns",
        name: "boardColumnsProjectSettings",
        component: () => import("../views/Projects/ProjectSettings/BoardColumnsProjectSettings.vue"),
      },
      {
        path: "story-types",
        name: "storyTypesProjectSettings",
        component: () => import("../views/Projects/ProjectSettings/StoryTypesProjectSettings.vue"),
      },
      {
        path: "repos",
        name: "reposProjectSettings",
        component: () => import("../views/Projects/ProjectSettings/ReposProjectSettings.vue"),
      },
      {
        path: "members",
        name: "membersProjectSettings",
        component: () => import("../views/Projects/ProjectSettings/MembersProjectSettings.vue"),
      },
      {
        path: "addMember",
        name: "addMember",
        component: () => import("../views/Projects/ProjectSettings/AddMember.vue"),
      },
    ],
  },
];
