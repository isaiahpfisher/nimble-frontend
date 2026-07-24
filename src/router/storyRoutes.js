import { isLoggedIn } from "./guards.js";

export default [
  {
    path: "/projects/:id/stories",
    name: "projectStories",
    component: () => import("../views/Stories/StoryList.vue"),
    beforeEnter: isLoggedIn,
  },
  {
    path: "/projects/:id/stories/new",
    name: "createStory",
    component: () => import("../views/Stories/CreateStory.vue"),
    beforeEnter: isLoggedIn,
  },
  {
    path: "/projects/:projectId/stories/:storyId",
    name: "editStory",
    component: () => import("../views/Stories/EditStory.vue"),
    beforeEnter: isLoggedIn,
  },
];
