import { ref } from "vue";

export const greeting = () => ({
  role: "assistant",
  content: "Hi! I'm the Nimble assistant. Ask me anything.",
  local: true,
});

const messages = ref([greeting()]);
const conversationId = ref(null);
const draft = ref("");
const loading = ref(false);

export function resetConversation() {
  messages.value = [greeting()];
  conversationId.value = null;
  draft.value = "";
  loading.value = false;
}

export function useAssistantConversation() {
  return { messages, conversationId, draft, loading, resetConversation };
}
