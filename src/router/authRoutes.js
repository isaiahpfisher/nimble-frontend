import { isLoggedOut, resolveHome } from "./guards";

export default [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Auth/Login.vue"),
  },
  {
    path: "/auth/github/callback",
    name: "github-callback",
    component: () => import("../views/Auth/GithubCallback.vue"),
    beforeEnter: isLoggedOut,
  },
  {
    path: "/",
    name: "home",
    beforeEnter: resolveHome,
    component: () => import("../views/Projects/StoryBoard.vue"),
  },
];
