import { ref } from "vue";

export const greeting = () => ({
  role: "assistant",
  content: "Hi! I'm the Nimble assistant. Ask me anything.",
  local: true,
});

const messages = ref([greeting()]);
const draft = ref("");
const loading = ref(false);

export function resetConversation() {
  messages.value = [greeting()];
  draft.value = "";
  loading.value = false;
}

export function useAssistantConversation() {
  return { messages, draft, loading, resetConversation };
}
