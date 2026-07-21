import apiClient from "./services";

export default {
  getSprints() {
    return apiClient.get("sprints");
  },
  getSprint(id) {
    return apiClient.get(`sprints/${id}`);
  },
  getSprintsForProject(projectId) {
    return apiClient.get(`projects/${projectId}/sprints`);
  },
  createSprint(sprint) {
    return apiClient.post("sprints", sprint);
  },
  createRecurringSprints(sprint) {
    return apiClient.post("sprints/recurring", sprint);
  },
  updateSprint(id, sprint) {
    return apiClient.put(`sprints/${id}`, sprint);
  },
  deleteSprint(id) {
    return apiClient.delete(`sprints/${id}`);
  },
};