import { createRouter, createWebHistory } from "vue-router";
import authRoutes from "./authRoutes";
import projectRoutes from "./projectRoutes";
import adminRoutes from "./adminRoutes";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...authRoutes, ...projectRoutes, ...adminRoutes],
});

export default router;
