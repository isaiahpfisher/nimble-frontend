import apiClient from "./services";

export default {
  getStoryTypes() {
    return apiClient.get("storyTypes");
  },
  getStoryTypesForProject(projectId) {
    return apiClient.get(`projects/${projectId}/storyTypes`);
  },
  createStoryType(projectId, storyType) {
    return apiClient.post(`projects/${projectId}/storyTypes`, storyType);
  },
  updateStoryType(projectId, storyTypeId, storyType) {
    return apiClient.put(
      `projects/${projectId}/storyTypes/${storyTypeId}`,
      storyType,
    );
  },
  deleteStoryType(projectId, storyTypeId) {
    return apiClient.delete(`projects/${projectId}/storyTypes/${storyTypeId}`);
  },
};
