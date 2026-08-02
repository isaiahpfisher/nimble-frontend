<script setup>
import { ref, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import DOMPurify from "dompurify";
import { marked } from "marked";
import AssistantServices from "../services/AssistantServices.js";

const router = useRouter();

const greeting = () => ({
  role: "assistant",
  content: "Hi! I'm the Nimble assistant. Ask me anything.",
  local: true,
});

const open = defineModel({ default: false });
const messages = ref([greeting()]);
const loading = ref(false);
const draft = ref("");
const messageList = ref(null);

// don't let too many messages pile up
// we keep them, but don't send them to the model
const MAX_HISTORY = 20;

const forServer = () =>
  messages.value
    .filter((message) => !message.local)
    .slice(-MAX_HISTORY)
    .map(({ role, content }) => ({ role, content }));

const asId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

const pageContext = () => {
  const route = router.currentRoute.value;
  const on = (prefix) => route?.matched?.some((match) => match.path.startsWith(prefix));

  return {
    projectId:
      (on("/projects/") ? asId(route.params.projectId ?? route.params.id) : undefined) ??
      asId(localStorage.getItem("selectedProjectId")),
    storyId: route?.name === "editStory" ? asId(route.params.storyId) : undefined,
    sprintId: on("/projects/:projectId/sprints/:sprintId") ? asId(route.params.sprintId) : undefined,
  };
};

const send = async () => {
  const text = draft.value.trim();
  if (!text || loading.value) return;

  draft.value = "";
  messages.value.push({ role: "user", content: text });
  loading.value = true;

  try {
    const { data } = await AssistantServices.chat(forServer(), pageContext());
    messages.value.push({ role: "assistant", content: data.reply, toolCalls: data.toolCalls });
  } catch (error) {
    messages.value.push({
      role: "assistant",
      content: error.response?.data?.message ?? error.message,
      local: true,
      failed: true,
    });
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  draft.value = "";
  messages.value = [greeting()];
  loading.value = false;
};

const html = new WeakMap();

// gfm = github flavored markdown (supports more markdown features)
const render = (message) => {
  if (!html.has(message)) {
    html.set(
      message,
      DOMPurify.sanitize(marked.parse(message.content ?? "", { breaks: true, gfm: true }), {
        ADD_ATTR: ["target", "rel"], // allow links to work properly
      }),
    );
  }
  return html.get(message);
};

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
</script>

<template>
  <v-navigation-drawer v-model="open" color="secondary" temporary location="right" width="420">
    <div class="d-flex flex-column fill-height">
      <v-toolbar color="primary" density="comfortable" flat>
        <v-toolbar-title class="text-body-1 font-weight-medium">Assistant</v-toolbar-title>
        <div class="d-flex ga-2">
          <v-btn icon="mdi-eraser-variant" variant="text" @click="reset" />
          <v-btn icon="mdi-close" variant="text" @click="open = false" />
        </div>
      </v-toolbar>

      <div ref="messageList" class="flex-grow-1 overflow-y-auto pa-4">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="d-flex mb-3"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <v-sheet
            :color="message.role === 'user' ? 'primary' : message.failed ? 'error' : 'white'"
            :class="message.role === 'user' || message.failed ? 'text-white' : ''"
            class="pa-3 rounded-lg text-body-2"
            max-width="80%"
            elevation="1"
          >
            <div
              v-if="message.role === 'assistant' && !message.failed"
              class="markdown"
              @click="followLink"
              v-html="render(message)"
            ></div>
            <template v-else>{{ message.content }}</template>

            <div v-if="message.toolCalls?.length" class="d-flex flex-wrap ga-1 mt-2">
              <v-chip
                v-for="(call, callIndex) in message.toolCalls"
                :key="callIndex"
                :color="call.isError ? 'error' : call.isWrite ? 'primary' : undefined"
                :variant="call.isWrite && !call.isError ? 'flat' : 'tonal'"
                :prepend-icon="call.isError ? 'mdi-alert-circle-outline' : call.isWrite ? 'mdi-pencil' : undefined"
                size="x-small"
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
/* AI GENERATED - for stying the markdown responses */
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
