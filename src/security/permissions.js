// src/security/permissions.js (working copy)
// Stable permission constants for EDUMON
export const PERMISSIONS = {
  MANAGE_USERS: "MANAGE_USERS",
  VIEW_COURSES: "VIEW_COURSES",
  CREATE_COURSES: "CREATE_COURSES",
  GRADE_TASKS: "GRADE_TASKS",
  VIEW_REPORTS: "VIEW_REPORTS",
};

// NOTE: For a final move, run:
// mkdir -p src/security/guards && git mv src/permissions.js src/security/permissions.js
// and update imports to '../security/permissions'
