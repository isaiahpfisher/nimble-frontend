import apiClient from "./services";

export default {
  getBacklogForProject(projectId) {
    return apiClient.get(`projects/${projectId}/backlog`);
  },
  assignSprint(projectId, storyId, sprintId) {
    return apiClient.put(`projects/${projectId}/backlog/${storyId}/sprint`, {
      sprintId,
    });
  },
};