import apiClient from "./services";

export default {
  getStories() {
    return apiClient.get("activity");
  },
  getActivityForStory(projectId, storyId) {
    return apiClient.get(`projects/${projectId}/stories/${storyId}/activity`);
  },
};
