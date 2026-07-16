import { isLoggedIn } from "./guards.js";

export default [
  {
    path: "/projects/:id/stories/new",
    name: "createStory",
    component: () => import("../views/Projects/CreateStory.vue"),
    beforeEnter: isLoggedIn,
  },
  {
    path: "/projects/:projectId/stories/:storyId",
    name: "editStory",
    component: () => import("../views/Projects/EditStory.vue"),
    beforeEnter: isLoggedIn,
  },
];
