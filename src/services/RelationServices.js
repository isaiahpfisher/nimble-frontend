import apiClient from "./services";

export default {
  createRelation(projectId, storyId, relation) {
    return apiClient.post(
      `projects/${projectId}/stories/${storyId}/relations`,
      relation
    );
  },
  deleteRelation(projectId, storyId, relationId) {
    return apiClient.delete(
      `projects/${projectId}/stories/${storyId}/relations/${relationId}`
    );
  },
};
