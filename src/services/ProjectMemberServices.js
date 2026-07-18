import apiClient from "./services";

export default {
  getProjectMembers() {
    return apiClient.get("projectMembers");
  },
  getProjectMembersForCurrentUser(userId) {
    return apiClient.get(`projectMembers/user/${userId}`);
  },
    getProjectMembersForCurrentProject(projectId) {
    return apiClient.get(`projectMembers/project/${projectId}`);
  },
  createProjectMember(projectMember, projectId, userId) {
    return apiClient.post(`projectMembers/${projectId}/${userId}`, projectMember);
  },
  updateProjectMember(id, project) {
    return apiClient.put(`projectMembers/${id}`, project);
  },
  deleteProjectMember(id) {
    return apiClient.delete(`projectMembers/${id}`);
  },
};
