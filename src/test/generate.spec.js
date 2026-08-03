// The three places the assistant writes something rather than looking it up.
//
// The rule all three share: nothing the model produces is saved by producing
// it. Criteria arrive as a ticked list to accept, a rewritten description lands
// in the editor and not the database, and a drafted story fills the form in
// front of the person who has to press Create. These tests exist to keep that
// true, because it is the property that makes a generate button safe.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { h } from "vue";
import { VApp } from "vuetify/components";

import { fixtureFor, DRAFTED_STORY, GENERATED_CRITERIA, REWRITTEN_DESCRIPTION } from "./fixtures.js";

vi.mock("../services/services.js", () => {
  const respond = (method) => (url) => Promise.resolve({ data: fixtureFor(method, url) });

  return {
    default: {
      get: vi.fn(respond("get")),
      post: vi.fn(respond("post")),
      put: vi.fn(respond("put")),
      delete: vi.fn(respond("delete")),
    },
  };
});

vi.mock("../services/AssistantServices.js", () => ({
  default: { chat: vi.fn(), tool: vi.fn(), generate: vi.fn() },
}));

import apiClient from "../services/services.js";
import AssistantServices from "../services/AssistantServices.js";
import projectRoutes from "../router/projectRoutes.js";
import storyRoutes from "../router/storyRoutes.js";

import CreateStory from "../views/Stories/CreateStory.vue";
import EditStory from "../views/Stories/EditStory.vue";
import StoryAcceptanceCriteria from "../components/StoryAcceptanceCriteria.vue";

function testRouter(path) {
  const strip = (routes) =>
    routes.map(({ beforeEnter, children, ...route }) => ({
      ...route,
      ...(children ? { children: strip(children) } : {}),
    }));

  const router = createRouter({
    history: createMemoryHistory(),
    routes: strip([...projectRoutes, ...storyRoutes]),
  });

  router.push(path);
  return router;
}

async function mountAt(component, path, props = {}) {
  const router = testRouter(path);
  await router.isReady();

  const host = { render: () => h(VApp, () => h(component, props)) };
  const wrapper = mount(host, { global: { plugins: [router] } });

  await flushPromises();
  await flushPromises();

  return wrapper;
}

const click = async (wrapper, selector) => {
  await wrapper.find(selector).trigger("click");
  await flushPromises();
};

// Vuetify teleports dialogs to document.body, so they are outside the mounted
// wrapper entirely and have to be reached through the document.
const inDialog = (selector) => document.querySelector(selector);

const clickDialog = async (selector) => {
  const element = inDialog(selector);
  if (!element) throw new Error(`Nothing matching ${selector} is on screen`);

  element.click();
  await flushPromises();
};

/** Requests that actually changed something, by URL. */
const writes = (method) =>
  apiClient[method].mock.calls.map(([url, body]) => ({ url, body }));

const generateCall = (kind) =>
  AssistantServices.generate.mock.calls.filter((call) => call[0] === kind).at(-1);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  localStorage.setItem("user", JSON.stringify({ id: 1, token: "t" }));
});

afterEach(() => {
  // teleported dialogs outlive their wrapper's unmount in jsdom
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("generating acceptance criteria", () => {
  const props = { projectId: 1, storyId: 5 };

  const generate = async (wrapper) => {
    await click(wrapper, '[data-test="generate-criteria"]');
  };

  it("asks for criteria for the story it is mounted on", async () => {
    AssistantServices.generate.mockResolvedValue({ data: GENERATED_CRITERIA });

    const wrapper = await mountAt(StoryAcceptanceCriteria, "/projects/1/stories/5", props);
    await generate(wrapper);

    expect(generateCall("acceptance_criteria")).toEqual([
      "acceptance_criteria",
      {},
      { projectId: 1, storyId: 5 },
    ]);

    wrapper.unmount();
  });

  it("shows what it wrote for review, and saves none of it yet", async () => {
    AssistantServices.generate.mockResolvedValue({ data: GENERATED_CRITERIA });

    const wrapper = await mountAt(StoryAcceptanceCriteria, "/projects/1/stories/5", props);
    await generate(wrapper);

    const dialog = document.body.innerHTML;
    expect(dialog).toContain("Suggested acceptance criteria");
    expect(dialog).toContain("Reset email arrives");
    expect(dialog).toContain("Unknown address is not revealed");

    // the point: looking at them has written nothing
    expect(writes("post")).toEqual([]);

    wrapper.unmount();
  });

  it("saves the ones that are ticked when accepted", async () => {
    AssistantServices.generate.mockResolvedValue({ data: GENERATED_CRITERIA });

    const wrapper = await mountAt(StoryAcceptanceCriteria, "/projects/1/stories/5", props);
    await generate(wrapper);
    await clickDialog('[data-test="accept-criteria"]');

    const posted = writes("post").filter((call) => call.url.includes("acceptanceCriteria"));
    expect(posted).toHaveLength(2);
    expect(posted[0].body).toMatchObject({
      title: "Reset email arrives",
      status: "Pending",
    });

    wrapper.unmount();
  });

  it("leaves out anything the user unticked", async () => {
    AssistantServices.generate.mockResolvedValue({ data: GENERATED_CRITERIA });

    const wrapper = await mountAt(StoryAcceptanceCriteria, "/projects/1/stories/5", props);
    await generate(wrapper);

    // untick the first suggestion
    document.querySelectorAll('[data-test="suggested-criteria"] input[type="checkbox"]')[0].click();
    await flushPromises();

    await clickDialog('[data-test="accept-criteria"]');

    const posted = writes("post").filter((call) => call.url.includes("acceptanceCriteria"));
    expect(posted).toHaveLength(1);
    expect(posted[0].body.title).toBe("Unknown address is not revealed");

    wrapper.unmount();
  });

  it("says so plainly when the story is already covered", async () => {
    AssistantServices.generate.mockResolvedValue({
      data: { result: { criteria: [], existingCount: 4 } },
    });

    const wrapper = await mountAt(StoryAcceptanceCriteria, "/projects/1/stories/5", props);
    await generate(wrapper);

    expect(document.body.innerHTML).toContain("already looks covered");

    wrapper.unmount();
  });

  it("reports a failure instead of opening an empty dialog", async () => {
    AssistantServices.generate.mockRejectedValue({ response: { data: { message: "The assistant is busy." } } });

    const wrapper = await mountAt(StoryAcceptanceCriteria, "/projects/1/stories/5", props);
    await generate(wrapper);

    expect(wrapper.emitted()).toBeDefined();
    expect(writes("post")).toEqual([]);

    wrapper.unmount();
  });
});

describe("rewriting a description", () => {
  it("shows the old wording next to the new one", async () => {
    AssistantServices.generate.mockResolvedValue({ data: REWRITTEN_DESCRIPTION });

    const wrapper = await mountAt(EditStory, "/projects/1/stories/5");
    await click(wrapper, '[data-test="rewrite-description"]');

    const dialog = document.body.innerHTML;
    expect(dialog).toContain("The reset email never turns up.");
    expect(dialog).toContain("As a user, when I request a password reset");

    wrapper.unmount();
  });

  // the rewrite lands in the editor, not the database
  it("writes nothing until the story is updated", async () => {
    AssistantServices.generate.mockResolvedValue({ data: REWRITTEN_DESCRIPTION });

    const wrapper = await mountAt(EditStory, "/projects/1/stories/5");
    await click(wrapper, '[data-test="rewrite-description"]');
    await clickDialog('[data-test="accept-rewrite"]');

    expect(writes("put")).toEqual([]);

    // ...and then it is part of the ordinary save
    const update = wrapper.findAll("button").find((b) => b.text().includes("Update Story"));
    await update.trigger("click");
    await flushPromises();

    const saved = writes("put").at(-1);
    expect(saved.body.description).toContain("As a user, when I request a password reset");

    wrapper.unmount();
  });

  it("keeps the original when the rewrite is declined", async () => {
    AssistantServices.generate.mockResolvedValue({ data: REWRITTEN_DESCRIPTION });

    const wrapper = await mountAt(EditStory, "/projects/1/stories/5");
    await click(wrapper, '[data-test="rewrite-description"]');

    const keep = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Keep mine"));
    keep.click();
    await flushPromises();

    const update = wrapper.findAll("button").find((b) => b.text().includes("Update Story"));
    await update.trigger("click");
    await flushPromises();

    expect(writes("put").at(-1).body.description).not.toContain("As a user, when I request");

    wrapper.unmount();
  });
});

describe("drafting a story from one line", () => {
  const draft = async (wrapper, idea) => {
    await wrapper.find('[data-test="story-idea"] input').setValue(idea);
    await click(wrapper, '[data-test="draft-story"]');
  };

  it("sends the sentence and the project it is in", async () => {
    AssistantServices.generate.mockResolvedValue({ data: DRAFTED_STORY });

    const wrapper = await mountAt(CreateStory, "/projects/1/stories/new");
    await draft(wrapper, "users can't reset their password");

    expect(generateCall("story_draft")).toEqual([
      "story_draft",
      { prompt: "users can't reset their password" },
      { projectId: 1 },
    ]);

    wrapper.unmount();
  });

  it("fills the form in rather than creating anything", async () => {
    AssistantServices.generate.mockResolvedValue({ data: DRAFTED_STORY });

    const wrapper = await mountAt(CreateStory, "/projects/1/stories/new");
    await draft(wrapper, "users can't reset their password");

    const title = wrapper.find('[data-test="story-title"] input');
    expect(title.element.value).toBe("Send password reset emails reliably");
    expect(wrapper.html()).toContain("1 acceptance criterion will be added");

    // nothing has been saved by drafting
    expect(writes("post")).toEqual([]);

    wrapper.unmount();
  });

  it("creates the story and its criteria only when told to", async () => {
    AssistantServices.generate.mockResolvedValue({ data: DRAFTED_STORY });

    const wrapper = await mountAt(CreateStory, "/projects/1/stories/new");
    await draft(wrapper, "users can't reset their password");

    const create = wrapper.findAll("button").find((b) => b.text().includes("Create Story"));
    await create.trigger("click");
    await flushPromises();

    const posted = writes("post");
    expect(posted[0].url).toMatch(/projects\/1\/stories$/);
    expect(posted[0].body).toMatchObject({
      title: "Send password reset emails reliably",
      typeId: 3,
      priority: "High",
    });

    // the criteria could not exist before the story did
    const criteria = posted.filter((call) => call.url.includes("acceptanceCriteria"));
    expect(criteria).toHaveLength(1);
    expect(criteria[0].body.title).toBe("Reset email arrives");

    wrapper.unmount();
  });

  it("does nothing on an empty sentence", async () => {
    const wrapper = await mountAt(CreateStory, "/projects/1/stories/new");
    await click(wrapper, '[data-test="draft-story"]');

    expect(AssistantServices.generate).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it("leaves the form usable when drafting fails", async () => {
    AssistantServices.generate.mockRejectedValue(new Error("503"));

    const wrapper = await mountAt(CreateStory, "/projects/1/stories/new");
    await draft(wrapper, "users can't reset their password");

    expect(wrapper.find('[data-test="story-title"] input').element.value).toBe("");
    expect(writes("post")).toEqual([]);

    wrapper.unmount();
  });
});
