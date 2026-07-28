import apiClient from "./services";

class RepositoryServices {
  getAll() {
    return apiClient.get("/repositories/");
  }

  getAllForProject(projectId) {
    return apiClient.get(`/projects/${projectId}/repositories/`);
  }

  get(id) {
    return apiClient.get(`/repositories/${id}`);
  }

  create(projectId, data) {
    return apiClient.post(`/projects/${projectId}/repositories/`, data);
  }

  update(id, data) {
    return apiClient.put(`/repositories/${id}`, data);
  }

  delete(id) {
    return apiClient.delete(`/repositories/${id}`);
  }
}

export default new RepositoryServices();