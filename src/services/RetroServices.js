import apiClient from "./services";

export default {
  // =========================
  // Get all retrospectives for a sprint
  // =========================

  getRetrosBySprintId(projectId, sprintId) {
    return apiClient.get(
      `projects/${projectId}/sprints/${sprintId}/retrospectives`
    );
  },

  // =========================
  // Get one retrospective
  // =========================

  getRetro(id) {
    return apiClient.get(
      `retrospectives/${id}`
    );
  },

  // =========================
  // Get all users
  // =========================

  getUsers() {
    return apiClient.get("users");
  },

  // =========================
  // Create retrospective
  // =========================

  createRetro(retro) {
    return apiClient.post(
      "retrospectives",
      {
        title: retro.title,
        summary: retro.summary || "",
        sprintId: Number(retro.sprintId),
        createdById: Number(
          retro.createdById
        ),
      }
    );
  },

  // =========================
  // Update retrospective
  // =========================

  updateRetro(id, retro) {
    return apiClient.put(
      `retrospectives/${id}`,
      {
        title: retro.title,
        summary: retro.summary || "",
        createdById: Number(
          retro.createdById
        ),
      }
    );
  },

  // =========================
  // Delete retrospective
  // =========================

  deleteRetro(id) {
    return apiClient.delete(
      `retrospectives/${id}`
    );
  },
};