// Smoke tests: mount every page in the app and check it renders real content.
//
// These catch broken imports, template errors, and crashes on render — the bulk
// of what actually breaks a Vue app. They do not check behaviour; see the
// per-unit specs for that.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { h } from "vue";
import { VApp } from "vuetify/components";

import { fixtureFor } from "./fixtures.js";

// vue-chartjs builds its components with a factory, so they cannot be stubbed
// by name the way QuillEditor and draggable are. jsdom has no canvas, and
// chart.js swallows the failure into a console error rather than throwing.
vi.mock("vue-chartjs", () => {
  const chartStub = (name) => ({
    name,
    props: ["data", "options"],
    render: () => h("div", { "data-test-stub": "chart" }),
  });
  return { Line: chartStub("Line"), Bar: chartStub("Bar"), Pie: chartStub("Pie") };
});

// One mock covers the whole app: every service module wraps this client.
vi.mock("../services/services.js", () => {
  const respond = (method) => (url) =>
    Promise.resolve({ data: fixtureFor(method, url) });

  return {
    default: {
      get: vi.fn(respond("get")),
      post: vi.fn(respond("post")),
      put: vi.fn(respond("put")),
      delete: vi.fn(respond("delete")),
    },
  };
});

import authRoutes from "../router/authRoutes.js";
import projectRoutes from "../router/projectRoutes.js";
import storyRoutes from "../router/storyRoutes.js";
import adminRoutes from "../router/adminRoutes.js";

// Guards hit localStorage and the network to decide *whether* to show a page;
// these tests are about what a page renders once you are on it. Guards are
// covered separately in guards.spec.js.
function withoutGuards(routes) {
  return routes.map(({ beforeEnter, children, ...route }) => ({
    ...route,
    ...(children ? { children: withoutGuards(children) } : {}),
  }));
}

const ROUTES = withoutGuards([
  ...authRoutes,
  ...projectRoutes,
  ...storyRoutes,
  ...adminRoutes,
]);

// depth picks which component in a nested match to mount: the default is the
// leaf (the page itself), 0 is the layout wrapper around it.
const PAGES = [
  { name: "login", path: "/login", expect: ["Login", "Create Account", "Continue with GitHub"] },
  {
    name: "github-callback",
    path: "/auth/github/callback",
    expect: ["No authorization code received from GitHub."],
  },

  { name: "createProject", path: "/projects/new", expect: ["Create Project", "Title", "Deadline"] },
  { name: "projectBoard", path: "/projects/1", expect: ["Test Project", "Story Board"] },
  { name: "projectBacklog", path: "/projects/1/backlog", expect: ["Test Project", "Backlog"] },
  { name: "projectSprints", path: "/projects/1/sprints", expect: ["Test Project", "Sprints", "Sprint 1"] },

  { name: "sprintNav", path: "/projects/1/sprints/2", depth: 0, expect: ["Sprint 2", "Board", "Plan", "Retro", "Burndown"] },
  { name: "sprintBoard", path: "/projects/1/sprints/2", expect: ["Board"] },
  { name: "sprintPlan", path: "/projects/1/sprints/2/plan", expect: ["Plan"] },
  { name: "sprintRetro", path: "/projects/1/sprints/2/retro", expect: ["Retro"] },
  // The burndown chart is stubbed out (no canvas in jsdom), so there is no text
  // to match — reaching the stub at all means the data pipeline ran.
  { name: "sprintBurndown", path: "/projects/1/sprints/2/burndown", expect: [], stub: "chart" },

  { name: "projectSettingsNav", path: "/projects/1/settings", depth: 0, expect: ["General", "Board Columns", "Story Types", "Repositories", "Members"] },
  { name: "generalProjectSettings", path: "/projects/1/settings", expect: ["General Settings"] },
  { name: "boardColumnsProjectSettings", path: "/projects/1/settings/board-columns", expect: ["Story States", "To Do", "In Progress"] },
  { name: "storyTypesProjectSettings", path: "/projects/1/settings/story-types", expect: ["Story Types", "Feature", "Bug"] },
  { name: "reposProjectSettings", path: "/projects/1/settings/repos", expect: ["Test Project", "Connect Repository", "acme/nimble"] },
  { name: "membersProjectSettings", path: "/projects/1/settings/members", expect: ["Team Members", "Project Members"] },
  { name: "addMember", path: "/projects/1/settings/addMember", expect: ["Users"] },

  { name: "projectStories", path: "/projects/1/stories", expect: ["Stories", "Test story title"] },
  { name: "createStory", path: "/projects/1/stories/new", expect: ["Create Story"] },
  { name: "editStory", path: "/projects/1/stories/5", expect: ["Test story title", "Update Story"] },

  { name: "adminProjects", path: "/admin/projects", expect: ["Projects", "Test Project"] },
  { name: "adminCreateProject", path: "/admin/projects/new", expect: ["Create Project (Admin)", "Manager"] },
  { name: "adminUsers", path: "/admin/users", expect: ["Users", "Ada", "Hopper"] },
  { name: "adminCreateUser", path: "/admin/users/new", expect: ["Create User"] },
  { name: "adminEditUser", path: "/admin/users/1", expect: ["Edit User", "Ada"] },
];

// "home" has no :id, so StoryBoard has no project to load — in the real app the
// resolveHome guard always redirects before it renders. Covered in guards.spec.js.
const NOT_RENDERED = ["home"];

function createTestRouter() {
  return createRouter({ history: createMemoryHistory(), routes: ROUTES });
}

async function resolveComponent(record) {
  const component = record.components?.default;
  if (typeof component === "function" && !component.render && !component.setup) {
    return (await component()).default;
  }
  return component;
}

// Vuetify trips this Vue warning internally on almost every component that uses
// slots; it says nothing about the app's own code.
const IGNORED_WARNINGS = [/Slot "\w+" invoked outside of the render function/];

let consoleErrors;

function record(...args) {
  const text = args.map(String).join(" ");
  if (!IGNORED_WARNINGS.some((pattern) => pattern.test(text))) {
    consoleErrors.push(text);
  }
}

beforeEach(() => {
  consoleErrors = [];
  vi.spyOn(console, "error").mockImplementation(record);
  vi.spyOn(console, "warn").mockImplementation(record);
  // Views swallow request failures into a snackbar rather than throwing, so a
  // failed load would otherwise look like a page that just rendered a skeleton.
  vi.spyOn(console, "log").mockImplementation((...args) => {
    const text = args.map(String).join(" ");
    if (text.includes("No fixture for")) consoleErrors.push(text);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("every page renders", () => {
  // Titled by hand rather than with "$name": it.each quotes interpolated
  // strings, and these read better in the run output without the quotes.
  const cases = PAGES.map((page) => [`${page.name.padEnd(28)} ${page.path}`, page]);

  it.each(cases)("%s", async (_title, page) => {
    const router = createTestRouter();
    router.push(page.path);
    await router.isReady();

    const matched = router.currentRoute.value.matched;
    expect(matched.length, `no route matched ${page.path}`).toBeGreaterThan(0);

    const record = matched[page.depth ?? matched.length - 1];
    const component = await resolveComponent(record);

    // Wrapped in v-app the way App.vue does it: Vuetify's layout components
    // (navigation drawers, toolbars) throw without that injection.
    const host = { render: () => h(VApp, () => h(component)) };
    const wrapper = mount(host, { global: { plugins: [router] } });
    await flushPromises();
    await flushPromises();

    expect(consoleErrors, `${page.name} logged errors while rendering`).toEqual([]);

    // Form fields hold their value as a DOM property, not in the serialized
    // markup, so append them — otherwise a page that is nothing but inputs
    // could only ever be checked for its labels.
    const inputValues = wrapper
      .findAll("input, textarea")
      .map((field) => field.element.value)
      .join(" ");
    const rendered = `${wrapper.html()} ${inputValues}`;

    for (const keyword of page.expect) {
      expect(rendered, `${page.name} is missing "${keyword}"`).toContain(keyword);
    }

    if (page.stub) {
      expect(wrapper.find(`[data-test-stub="${page.stub}"]`).exists()).toBe(true);
    }

    wrapper.unmount();
  });
});

describe("smoke test coverage", () => {
  it("covers every route in the app", () => {
    const routeNames = [];
    const collect = (routes) => {
      for (const route of routes) {
        if (route.name) routeNames.push(route.name);
        if (route.children) collect(route.children);
      }
    };
    collect(ROUTES);

    const covered = new Set([...PAGES.map((p) => p.name), ...NOT_RENDERED]);
    const uncovered = routeNames.filter((name) => !covered.has(name));

    expect(uncovered, "add these routes to PAGES in pages.spec.js").toEqual([]);
  });
});
