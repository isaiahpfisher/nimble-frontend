import apiClient from "./services";

export default {
  getStories() {
    return apiClient.get("stories");
  },
  getStoriesForProject(projectId) {
    return apiClient.get(`projects/${projectId}/stories`);
  },
  getStory(projectId, storyId) {
    return apiClient.get(`projects/${projectId}/stories/${storyId}`);
  },
  createStory(projectId, story) {
    return apiClient.post(`projects/${projectId}/stories`, story);
  },
  updateStory(projectId, storyId, story) {
    return apiClient.put(`projects/${projectId}/stories/${storyId}`, story);
  },
  deleteStory(projectId, storyId) {
    return apiClient.delete(`projects/${projectId}/stories/${storyId}`);
  },
};
