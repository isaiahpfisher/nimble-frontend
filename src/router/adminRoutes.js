import { isAdmin } from "./guards";

export default [
  {
    path: "/admin/projects",
    name: "adminProjects",
    component: () => import("../views/Admin/AdminProjectList.vue"),
    beforeEnter: isAdmin,
  },
  {
    path: "/admin/projects/new",
    name: "adminCreateProject",
    component: () => import("../views/Admin/AdminCreateProject.vue"),
    beforeEnter: isAdmin,
  },
  {
    path: "/admin/users",
    name: "adminUsers",
    component: () => import("../views/Admin/AdminUserList.vue"),
    beforeEnter: isAdmin,
  },
  {
    path: "/admin/users/new",
    name: "adminCreateUser",
    component: () => import("../views/Admin/AdminCreateUser.vue"),
    beforeEnter: isAdmin,
  },
  {
    path: "/admin/users/:id",
    name: "adminEditUser",
    component: () => import("../views/Admin/AdminEditUser.vue"),
    beforeEnter: isAdmin,
  },
];
