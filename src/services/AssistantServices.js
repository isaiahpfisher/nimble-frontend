import apiClient from "./services";

export default {
  chat(messages, context = {}) {
    return apiClient.post(`assistant/chat`, { messages, ...context });
  },
};
