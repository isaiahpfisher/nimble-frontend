// The assistant panel decides which project the model treats as "this
// project". Getting it wrong means confidently answering about the wrong
// board, so the resolution order is pinned here against the real route table.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { h } from "vue";
import { VApp } from "vuetify/components";

vi.mock("../services/AssistantServices.js", () => ({
  default: { chat: vi.fn(() => Promise.resolve({ data: { reply: "ok", toolCalls: [] } })) },
}));

// navigating fires the route guards, which would otherwise try to reach the API
vi.mock("../services/services.js", () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: [] })), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import router from "../router/index.js";
import AssistantServices from "../services/AssistantServices.js";
import Assistant from "../components/Assistant.vue";

/** Mounts the panel open on `path`, the way the app shell does. */
async function openPanelAt(path) {
  await router.replace(path);
  await router.isReady();

  // v-app is what Vuetify's drawer needs around it, and modelValue is the
  // shell's open state, which the panel now owns nothing of.
  const host = { render: () => h(VApp, () => h(Assistant, { modelValue: true })) };
  return mount(host, { global: { plugins: [router] } });
}

/** Types a question and presses enter, as a user does. */
async function ask(panel, question) {
  const field = panel.find("textarea");
  await field.setValue(question);
  await field.trigger("keydown.enter");
  await flushPromises();
}

const lastRequest = () => AssistantServices.chat.mock.calls.at(-1);

async function contextSentFrom(path) {
  const panel = await openPanelAt(path);
  await ask(panel, "what is the current sprint?");
  panel.unmount();

  return lastRequest()[1];
}

const projectIdSentFrom = async (path) => (await contextSentFrom(path)).projectId;

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  localStorage.setItem("user", JSON.stringify({ id: 1, token: "t" }));
});

describe("the project the assistant is told about", () => {
  it("comes from the route on a project page", async () => {
    expect(await projectIdSentFrom("/projects/3/backlog")).toBe(3);
  });

  // the story and sprint detail routes name the param :projectId, the rest :id
  it("reads the :projectId param too", async () => {
    expect(await projectIdSentFrom("/projects/2/stories/47")).toBe(2);
    expect(await projectIdSentFrom("/projects/2/sprints/9")).toBe(2);
  });

  // an admin viewing a project they do not belong to leaves the stored id
  // pointing somewhere else; the page they are looking at has to win
  it("prefers the route over a stale stored id", async () => {
    localStorage.setItem("selectedProjectId", "99");

    expect(await projectIdSentFrom("/projects/3")).toBe(3);
  });

  it("falls back to the stored id away from a project page", async () => {
    localStorage.setItem("selectedProjectId", "7");

    expect(await projectIdSentFrom("/admin/users")).toBe(7);
  });

  it("sends nothing when there is no project anywhere", async () => {
    expect(await projectIdSentFrom("/admin/users")).toBeUndefined();
  });

  it("sends nothing for a project route that carries no id", async () => {
    expect(await projectIdSentFrom("/projects/new")).toBeUndefined();
  });

  it("ignores a junk stored id rather than sending it", async () => {
    localStorage.setItem("selectedProjectId", "not-a-number");

    expect(await projectIdSentFrom("/admin/users")).toBeUndefined();
  });

  // "assign this to Carol" only works if the assistant knows what "this" is
  it("sends the story the user has open", async () => {
    const context = await contextSentFrom("/projects/2/stories/47");

    expect(context).toMatchObject({ projectId: 2, storyId: 47 });
  });

  it("sends the sprint the user has open", async () => {
    const context = await contextSentFrom("/projects/2/sprints/9");

    expect(context).toMatchObject({ projectId: 2, sprintId: 9 });
  });

  // a story id from a page they have left is not "this story"
  it("does not carry a story id away from the story page", async () => {
    await contextSentFrom("/projects/2/stories/47");
    const context = await contextSentFrom("/projects/2/backlog");

    expect(context.storyId).toBeUndefined();
    expect(context.sprintId).toBeUndefined();
  });

  it("does not mistake the story list for a single story", async () => {
    expect((await contextSentFrom("/projects/2/stories")).storyId).toBeUndefined();
    expect((await contextSentFrom("/projects/2/stories/new")).storyId).toBeUndefined();
  });
});

describe("what the panel keeps", () => {
  it("records what the assistant actually ran, alongside its answer", async () => {
    const toolCalls = [{ name: "update_story", isWrite: true, isError: false }];
    AssistantServices.chat.mockResolvedValueOnce({ data: { reply: "Done.", toolCalls } });

    const panel = await openPanelAt("/projects/2/backlog");
    await ask(panel, "bump it to High");

    expect(panel.text()).toContain("Done.");
    expect(panel.text()).toContain("update_story");
  });

  // an error is ours, not the model's: it must not be drawn as an answer and
  // must not be replayed to the model on the next question
  it("shows a failure as one and keeps it out of the next request", async () => {
    AssistantServices.chat.mockRejectedValueOnce({ response: { data: { message: "Assistant is down." } } });

    const panel = await openPanelAt("/projects/2/backlog");
    await ask(panel, "what am I working on?");
    expect(panel.text()).toContain("Assistant is down.");

    await ask(panel, "try again");

    const [sent] = lastRequest();
    expect(sent.map((message) => message.content)).toEqual(["what am I working on?", "try again"]);
  });
});

describe("carrying the conversation on", () => {
  // The server holds what the assistant actually saw — tool results and all —
  // and this id is the panel's handle on it. Without it every follow-up starts
  // from nothing and the tools are all run again.
  it("sends nothing the first time and the server's id after that", async () => {
    AssistantServices.chat.mockResolvedValueOnce({
      data: { reply: "ok", toolCalls: [], conversationId: "abc-123" },
    });

    const panel = await openPanelAt("/projects/2/backlog");
    await ask(panel, "what am I working on?");
    expect(lastRequest()[2]).toBeNull();

    await ask(panel, "and the first one?");
    expect(lastRequest()[2]).toBe("abc-123");
  });

  it("keeps the id it has when a reply comes back without one", async () => {
    AssistantServices.chat.mockResolvedValueOnce({
      data: { reply: "ok", toolCalls: [], conversationId: "abc-123" },
    });

    const panel = await openPanelAt("/projects/2/backlog");
    await ask(panel, "first");
    await ask(panel, "second");

    expect(lastRequest()[2]).toBe("abc-123");
  });

  it("starts a new conversation when the panel is reset", async () => {
    AssistantServices.chat.mockResolvedValueOnce({
      data: { reply: "ok", toolCalls: [], conversationId: "abc-123" },
    });

    const panel = await openPanelAt("/projects/2/backlog");
    await ask(panel, "what am I working on?");

    await panel.find('[data-test="assistant-reset"]').trigger("click");
    await ask(panel, "starting over");

    expect(lastRequest()[2]).toBeNull();
  });
});
