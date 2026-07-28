// Canned API responses for the smoke tests.
//
// Every network call in the app goes through the single apiClient in
// src/services/services.js, so mocking that one module and routing by URL here
// covers all of the views at once. The real service modules still run on top of
// this, which means the URLs they build are exercised for free: an unmatched
// URL throws, and the test that triggered it fails.

export const USERS = [
  { id: 1, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", isAdmin: true },
  { id: 2, firstName: "Grace", lastName: "Hopper", email: "grace@example.com", isAdmin: false },
];

export const CURRENT_USER = { ...USERS[0], token: "test-token" };

export const STORY_STATES = [
  { id: 10, name: "To Do", position: 0, projectId: 1 },
  { id: 11, name: "In Progress", position: 1, projectId: 1 },
  { id: 12, name: "Done", position: 2, projectId: 1 },
];

export const STORY_TYPES = [
  { id: 20, name: "Feature", projectId: 1 },
  { id: 21, name: "Bug", projectId: 1 },
];

export const PROJECT_MEMBERS = [
  { id: 30, projectId: 1, userId: 1, isManager: 1, user: USERS[0] },
  { id: 31, projectId: 1, userId: 2, isManager: 0, user: USERS[1] },
];

export const REPOSITORIES = [
  { id: 40, projectId: 1, githubId: "123456", name: "acme/nimble" },
];

export const PROJECT = {
  id: 1,
  title: "Test Project",
  description: "A project used by the smoke tests.",
  deadline: "2026-12-31",
  managerId: 1,
  projectMembers: PROJECT_MEMBERS,
  storyState: STORY_STATES,
  storyType: STORY_TYPES,
};

export const STORY = {
  id: 5,
  projectId: 1,
  title: "Test story title",
  description: "<p>A story used by the smoke tests.</p>",
  priority: "High",
  estimate: 3,
  completedAt: null,
  stateId: 10,
  state: STORY_STATES[0],
  typeId: 20,
  type: STORY_TYPES[0],
  sprintId: 2,
  sprint: { id: 2, title: "Sprint 2" },
  assignee: USERS[1],
  assigneeId: 2,
  reporter: USERS[0],
  reporterId: 1,
  acceptanceCriteria: [],
  relationOne: [],
  relationTwo: [],
};

export const SPRINT = {
  id: 2,
  projectId: 1,
  title: "Sprint 2",
  goal: "Ship the smoke tests.",
  startDate: "2026-07-01",
  endDate: "2026-07-14",
  status: "Active",
  story: [STORY],
};

export const SPRINTS = [
  { ...SPRINT, id: 1, title: "Sprint 1", status: "Completed" },
  SPRINT,
];

export const ACTIVITY = [];
export const COMMENTS = [];

// [method, regex, response]. Methods are matched loosely so a page that PUTs to
// a URL it can also GET does not need a second entry.
const ROUTES = [
  [/^users$/, USERS],
  [/^users\/\d+$/, USERS[0]],
  [/^users\/me\/projects$/, [PROJECT]],
  [/^login$/, CURRENT_USER],
  [/^logout$/, {}],

  [/^projects$/, [PROJECT]],
  [/^projects\/\d+$/, PROJECT],
  [/^projects\/\d+\/stories$/, [STORY]],
  [/^projects\/\d+\/stories\/\d+$/, STORY],
  [/^projects\/\d+\/stories\/\d+\/comments$/, COMMENTS],
  [/^projects\/\d+\/stories\/\d+\/activity$/, ACTIVITY],
  [/^projects\/\d+\/stories\/\d+\/acceptanceCriteria(\/\d+)?$/, {}],
  [/^projects\/\d+\/stories\/\d+\/acceptanceCriteria\/\d+\/comments$/, COMMENTS],
  [/^projects\/\d+\/stories\/\d+\/relations(\/\d+)?$/, {}],
  [/^projects\/\d+\/storyStates(\/(\d+|reorder))?$/, STORY_STATES],
  [/^projects\/\d+\/storyTypes(\/\d+)?$/, STORY_TYPES],
  [/^projects\/\d+\/sprints$/, SPRINTS],
  [/^projects\/\d+\/repositories\/?$/, REPOSITORIES],

  [/^sprints$/, SPRINTS],
  [/^sprints\/recurring$/, SPRINTS],
  [/^sprints\/\d+$/, SPRINT],

  [/^projectMembers$/, PROJECT_MEMBERS],
  [/^projectMembers\/project\/\d+$/, PROJECT_MEMBERS],
  [/^projectMembers\/user\/\d+$/, PROJECT_MEMBERS],
  [/^projectMembers\/\d+(\/\d+)?$/, PROJECT_MEMBERS[0]],

  [/^repositories\/?$/, REPOSITORIES],
  [/^repositories\/\d+$/, REPOSITORIES[0]],

  [/^comments\/\d+$/, {}],
  [/^activity$/, ACTIVITY],
];

// Deep clone so a view that mutates its response cannot leak into the next test.
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function fixtureFor(method, url) {
  const path = String(url).replace(/^\/+/, "").split("?")[0].replace(/\/$/, "");

  for (const [pattern, response] of ROUTES) {
    if (pattern.test(path) || pattern.test(`${path}/`)) {
      return clone(response);
    }
  }

  throw new Error(
    `No fixture for ${method.toUpperCase()} ${path} — add one to src/test/fixtures.js`,
  );
}
