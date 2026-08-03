import apiClient from "./services";

export default {
  chat(messages, context = {}, conversationId = null) {
    return apiClient.post(`assistant/chat`, { messages, conversationId, ...context });
  },
  tool(name, args = {}, context = {}) {
    return apiClient.post(`assistant/tool/${name}`, { args, ...context });
  },
  generate(kind, args = {}, context = {}) {
    return apiClient.post(`assistant/generate/${kind}`, { args, ...context });
  },
};
