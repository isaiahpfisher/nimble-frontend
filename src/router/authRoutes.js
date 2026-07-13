import { isLoggedOut, resolveHome } from "./guards";

export default [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Auth/Login.vue"),
    beforeEnter: isLoggedOut,
  },
  {
    path: "/",
    name: "home",
    beforeEnter: resolveHome,
    component: () => import("../views/Projects/StoryBoard.vue"),
  },
];
