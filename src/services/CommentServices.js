import apiClient from "./services";

export default {
  getComments() {
    return apiClient.get("comments");
  },
  getCommentsForStory(projectId, storyId) {
    return apiClient.get(`projects/${projectId}/stories/${storyId}/comments`);
  },
  createCommentForStory(projectId, storyId, comment) {
    return apiClient.post(
      `projects/${projectId}/stories/${storyId}/comments`,
      comment,
    );
  },
  getCommentsForCriterion(projectId, storyId, criterionId) {
    return apiClient.get(
      `projects/${projectId}/stories/${storyId}/acceptanceCriteria/${criterionId}/comments`,
    );
  },
  createCommentForCriterion(projectId, storyId, criterionId, comment) {
    return apiClient.post(
      `projects/${projectId}/stories/${storyId}/acceptanceCriteria/${criterionId}/comments`,
      comment,
    );
  },
  updateComment(commentId, comment) {
    return apiClient.put(`comments/${commentId}`, comment);
  },
  deleteComment(commentId) {
    return apiClient.delete(`comments/${commentId}`);
  },
};
