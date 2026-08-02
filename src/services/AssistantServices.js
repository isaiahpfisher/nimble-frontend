import apiClient from "./services";

export default {
  // conversationId is what the server gave us last time. It lets the assistant
  // keep the tool results it has already seen, instead of re-fetching
  // everything to answer a follow-up. Null starts a fresh conversation.
  chat(messages, context = {}, conversationId = null) {
    return apiClient.post(`assistant/chat`, { messages, conversationId, ...context });
  },
};
