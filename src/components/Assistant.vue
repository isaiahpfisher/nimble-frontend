<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useStore } from "vuex";

const router = useRouter();
const store = useStore();

const open = computed({
  get: () => store.getters["assistant/open"],
  set: (value) => store.commit("assistant/SET_OPEN", value),
});
const messages = computed(() => store.getters["assistant/messages"]);
const loading = computed(() => store.getters["assistant/loading"]);
const draft = ref("");
const messageList = ref(null);

// gfm = github flavored markdown (supports more markdown features)
const renderMarkdown = (content) =>
  DOMPurify.sanitize(marked.parse(content ?? "", { breaks: true, gfm: true }), {
    ADD_ATTR: ["target", "rel"],
  });

const followLink = (event) => {
  const anchor = event.target.closest("a");
  if (!anchor) return;

  const href = anchor.getAttribute("href") ?? "";

  const path = href.startsWith("/")
    ? href
    : href.startsWith(window.location.origin)
      ? href.slice(window.location.origin.length)
      : null;

  if (path === null) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    return;
  }

  event.preventDefault();

  const resolved = router.resolve(path);
  if (!resolved.matched.length) return;

  open.value = false;
  router.push(resolved);
};

const scrollToBottom = async () => {
  await nextTick();
  if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight;
};

watch(() => [messages.value.length, loading.value, open.value], scrollToBottom);

const send = () => {
  const text = draft.value.trim();
  if (!text) return;

  draft.value = "";
  store.dispatch("assistant/send", text);
};
</script>

<template>
  <v-navigation-drawer v-model="open" color="secondary" temporary location="right" width="420">
    <div class="d-flex flex-column fill-height">
      <v-toolbar color="primary" density="comfortable" flat>
        <v-toolbar-title class="text-body-1 font-weight-medium">Assistant</v-toolbar-title>
        <v-btn icon="mdi-close" variant="text" @click="open = false" />
      </v-toolbar>

      <div ref="messageList" class="flex-grow-1 overflow-y-auto pa-4">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="d-flex mb-3"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <v-sheet
            :color="message.role === 'user' ? 'primary' : 'white'"
            :class="message.role === 'user' ? 'text-white' : ''"
            class="pa-3 rounded-lg text-body-2"
            max-width="80%"
            elevation="1"
          >
            <div
              v-if="message.role === 'assistant'"
              class="markdown"
              @click="followLink"
              v-html="renderMarkdown(message.content)"
            ></div>
            <template v-else>{{ message.content }}</template>

            <div v-if="message.toolCalls?.length" class="d-flex flex-wrap ga-1 mt-2">
              <v-chip
                v-for="(call, callIndex) in message.toolCalls"
                :key="callIndex"
                :color="call.isError ? 'error' : undefined"
                size="x-small"
                variant="tonal"
                label
              >
                {{ call.name }}
              </v-chip>
            </div>
          </v-sheet>
        </div>

        <div v-if="loading" class="d-flex justify-start mb-3">
          <v-sheet color="white" class="pa-3 rounded-lg" elevation="1">
            <v-progress-circular indeterminate size="18" width="2" color="primary" />
            <span class="text-body-2 text-medium-emphasis ml-2">Thinking...</span>
          </v-sheet>
        </div>
      </div>

      <v-divider />

      <div class="pa-3">
        <v-textarea
          v-model="draft"
          placeholder="Ask a question..."
          rows="1"
          max-rows="5"
          auto-grow
          hide-details
          density="comfortable"
          variant="solo"
          bg-color="white"
          :disabled="loading"
          :loading="loading"
          append-inner-icon="mdi-send"
          @keydown.enter.exact.prevent="send"
          @click:append-inner="send"
        />
      </div>
    </div>
  </v-navigation-drawer>
</template>

<style>
/* AI wrote this CSS */
.markdown > :first-child {
  margin-top: 0;
}
.markdown > :last-child {
  margin-bottom: 0;
}
.markdown :is(p, ul, ol, pre, table) {
  margin: 0 0 0.5rem;
}
.markdown :is(ul, ol) {
  padding-left: 1.25rem;
}
.markdown li {
  margin-bottom: 0.25rem;
}
.markdown :is(h1, h2, h3, h4, h5, h6) {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0.75rem 0 0.35rem;
}
.markdown :is(code, pre) {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
}
.markdown code {
  padding: 0.1em 0.3em;
  font-size: 0.85em;
}
.markdown pre {
  padding: 0.6rem;
  overflow-x: auto;
}
.markdown pre code {
  background: none;
  padding: 0;
}
.markdown table {
  border-collapse: collapse;
  width: 100%;
}
.markdown :is(th, td) {
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0.25rem 0.5rem;
  text-align: left;
}
.markdown a {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}
.markdown a:hover {
  text-decoration: underline;
}
</style>
