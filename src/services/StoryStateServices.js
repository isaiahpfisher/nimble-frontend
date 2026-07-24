import apiClient from "./services";

export default {
  getStoryStates() {
    return apiClient.get("storyStates");
  },
  getStoryStatesForProject(projectId) {
    return apiClient.get(`projects/${projectId}/storyStates`);
  },
  createStoryState(projectId, storyState) {
    return apiClient.post(`projects/${projectId}/storyStates`, storyState);
  },
  updateStoryState(projectId, storyStateId, storyState) {
    return apiClient.put(
      `projects/${projectId}/storyStates/${storyStateId}`,
      storyState,
    );
  },
  reorderStoryStates(projectId, states) {
    return apiClient.put(`projects/${projectId}/storyStates/reorder`, {
      states,
    });
  },
  deleteStoryState(projectId, storyStateId, fallbackStateId) {
    return apiClient.delete(
      `projects/${projectId}/storyStates/${storyStateId}`,
      {
        data: { fallbackStateId },
      },
    );
  },
};
