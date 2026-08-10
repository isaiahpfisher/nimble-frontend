import apiClient from "./services";

export default {
  getSystemLogs() {
    return apiClient.get("systemlogs");
  },
};