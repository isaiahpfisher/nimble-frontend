import { isAdmin } from "./guards";

export default [
  {
    path: "/admin/users",
    name: "adminUsers",
    component: () => import("../views/Admin/AdminUserList.vue"),
    beforeEnter: isAdmin,
  },
];
