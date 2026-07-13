import apiClient from "./services";

export default {
  getProjects() {
    return apiClient.get("projects");
  },
  getProject(id) {
    return apiClient.get(`projects/${id}`);
  },
  getProjectsForCurrentUser() {
    return apiClient.get(`users/me/projects`);
  },
  createProject(project) {
    return apiClient.post("projects", project);
  },
  createProjectAsAdmin(project) {
    return apiClient.post("admin/projects", project);
  },
  updateProject(id, project) {
    return apiClient.put(`projects/${id}`, project);
  },
  deleteProject(id) {
    return apiClient.delete(`projects/${id}`);
  },
};
