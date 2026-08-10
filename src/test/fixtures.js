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

// Stories the backlog view lists: not started, so not yet on a sprint. Two
// priorities, because the backlog and sprint-planning views both sort by it.
export const BACKLOG = [
  { ...STORY, id: 6, title: "Low priority backlog story", priority: "Low", sprintId: null, sprint: null },
  { ...STORY, id: 7, title: "High priority backlog story", priority: "High", sprintId: null, sprint: null },
];

export const ACTIVITY = [];
export const COMMENTS = [];

// Drafts the assistant wrote. The server answers { kind, result }, and nothing
// in these has been saved — the page decides what to keep.
export const GENERATED_CRITERIA = {
  kind: "acceptance_criteria",
  result: {
    storyId: 5,
    story: { id: 5, title: "Test story title" },
    existingCount: 0,
    criteria: [
      {
        title: "Reset email arrives",
        description: "Given a registered user, when they request a reset, then an email arrives within a minute.",
      },
      {
        title: "Unknown address is not revealed",
        description: "Given an unregistered address, when a reset is requested, then the same confirmation is shown.",
      },
    ],
  },
};

export const REWRITTEN_DESCRIPTION = {
  kind: "story_description",
  result: {
    storyId: 5,
    original: "The reset email never turns up.",
    description:
      "As a user, when I request a password reset, I want the email to arrive, so that I can get back into my account.",
  },
};

export const DRAFTED_STORY = {
  kind: "story_draft",
  result: {
    projectId: 1,
    title: "Send password reset emails reliably",
    description:
      "As a user, when I request a password reset, I want the email to arrive, so that I can get back into my account.",
    typeId: 3,
    type: "Bug",
    priority: "High",
    criteria: [
      {
        title: "Reset email arrives",
        description: "Given a registered user, when they request a reset, then an email arrives within a minute.",
      },
    ],
  },
};

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
  [/^projects\/\d+\/backlog(\/\d+\/sprint)?$/, BACKLOG],
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

  [/^assistant\/generate\/acceptance_criteria$/, GENERATED_CRITERIA],
  [/^assistant\/generate\/story_description$/, REWRITTEN_DESCRIPTION],
  [/^assistant\/generate\/story_draft$/, DRAFTED_STORY],
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
