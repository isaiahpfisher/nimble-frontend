import apiClient from "./services";

export default {
  createCriterion(projectId, storyId, criterion) {
    return apiClient.post(
      `projects/${projectId}/stories/${storyId}/acceptanceCriteria`,
      criterion
    );
  },
  updateCriterion(projectId, storyId, criterionId, criterion) {
    return apiClient.put(
      `projects/${projectId}/stories/${storyId}/acceptanceCriteria/${criterionId}`,
      criterion
    );
  },
  deleteCriterion(projectId, storyId, criterionId) {
    return apiClient.delete(
      `projects/${projectId}/stories/${storyId}/acceptanceCriteria/${criterionId}`
    );
  },
};
