import apiClient from "./services";

export default {
  chat(messages) {
    return apiClient.post(`assistant/chat`, { messages });
  },
};
