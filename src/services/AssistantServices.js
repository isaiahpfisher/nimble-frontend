import apiClient from "./services";

export default {
  chat(messages, context = {}) {
    return apiClient.post(`assistant/chat`, { messages, ...context });
  },
  generate(kind, args = {}, context = {}) {
    return apiClient.post(`assistant/generate/${kind}`, { args, ...context });
  },
};
