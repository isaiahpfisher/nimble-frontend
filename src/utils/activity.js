export const ACTIVITY_ACTION = {
  CREATED: "created",
  UPDATED: "updated",
  DELETED: "deleted",
};

export const SUBJECT_TYPE = {
  STORY: "story",
  ACCEPTANCE_CRITERIA: "acceptanceCriteria",
  COMMENT: "comment",
  RELATION: "relation",
};

export const RELATION_DIRECTION = {
  OUTGOING: "outgoing",
  INCOMING: "incoming",
};

export const SUBJECT_TYPE_OPTIONS = [
  { title: "Stories", value: SUBJECT_TYPE.STORY },
  { title: "Acceptance Criteria", value: SUBJECT_TYPE.ACCEPTANCE_CRITERIA },
  { title: "Comments", value: SUBJECT_TYPE.COMMENT },
  { title: "Relations", value: SUBJECT_TYPE.RELATION },
];

export const ACTION_META = {
  [ACTIVITY_ACTION.CREATED]: {
    icon: "mdi-plus-circle-outline",
    color: "success",
  },
  [ACTIVITY_ACTION.UPDATED]: { icon: "mdi-pencil-outline", color: "primary" },
  [ACTIVITY_ACTION.DELETED]: {
    icon: "mdi-close-circle-outline",
    color: "error",
  },
};

const FIELD_LABELS = {
  title: "Title",
  description: "Description",
  priority: "Priority",
  estimate: "Estimate",
  status: "Status",
  state: "State",
  sprint: "Sprint",
  type: "Type",
  assignee: "Assignee",
  reporter: "Reporter",
  reviewer: "Reviewer",
  repository: "Repository",
};

export function fieldLabel(attribute) {
  return FIELD_LABELS[attribute] ?? attribute;
}

// changes can hold plain values (title, estimate, ...) or { id, label } rows for associations
export function changeValue(value) {
  if (value === null || value === undefined || value === "") {
    return "(none)";
  }

  if (typeof value === "object") {
    return value.label ?? "(none)";
  }

  // handle rich text values like story descriptions
  const text = String(value) // convert to string
    .replace(/<[^>]*>/g, " ") // remove html tags
    .replace(/\s+/g, " ") // convert newlines to spaces
    .trim();

  if (!text) {
    return "(none)";
  }

  // crop long text
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

export function initials(user, rawString) {
  if (user) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  } else {
    try {
      return rawString.split(" ")[0][0].toUpperCase() + rawString.split(" ")[1][0].toUpperCase();
    } catch (error) {
      return rawString[0].toUpperCase();
    }
  }
}
