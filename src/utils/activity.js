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
