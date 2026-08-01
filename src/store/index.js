import { createStore } from "vuex";
import AssistantServices from "../services/AssistantServices.js";

const greeting = () => ({
  role: "assistant",
  content: "Hi! I'm the Nimble assistant. Ask me anything.",
  createdAt: Date.now(),
  local: true,
});

// don't let too many messages pile up
// we keep them, but don't send them to the model
const MAX_HISTORY = 20;

const forServer = (messages) =>
  messages
    .filter((message) => !message.local)
    .slice(-MAX_HISTORY)
    .map(({ role, content }) => ({ role, content }));

const assistantModule = {
  namespaced: true,
  state: () => ({
    open: false,
    messages: [greeting()],
    loading: false,
  }),
  getters: {
    open: (state) => state.open,
    messages: (state) => state.messages,
    loading: (state) => state.loading,
  },
  mutations: {
    SET_OPEN(state, value) {
      state.open = value;
    },
    TOGGLE_OPEN(state) {
      state.open = !state.open;
    },
    ADD_MESSAGE(state, message) {
      state.messages.push({ createdAt: Date.now(), ...message });
    },
    SET_LOADING(state, value) {
      state.loading = value;
    },
    RESET(state) {
      state.messages = [greeting()];
      state.loading = false;
    },
  },
  actions: {
    async send({ commit, state }, text) {
      if (!text || state.loading) return;

      commit("ADD_MESSAGE", { role: "user", content: text });
      commit("SET_LOADING", true);

      try {
        const { data } = await AssistantServices.chat(forServer(state.messages));
        commit("ADD_MESSAGE", { role: "assistant", content: data.reply, toolCalls: data.toolCalls });
      } catch (error) {
        commit("ADD_MESSAGE", {
          role: "assistant",
          content: error.response?.data?.message ?? error.message,
          local: true,
        });
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
};

export default createStore({
  modules: { assistant: assistantModule },
});
