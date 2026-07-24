import { createRouter, createWebHistory } from "vue-router";
import authRoutes from "./authRoutes";
import projectRoutes from "./projectRoutes";
import adminRoutes from "./adminRoutes";
import storyRoutes from "./storyRoutes";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...authRoutes, ...projectRoutes, ...storyRoutes, ...adminRoutes],
});

export default router;
