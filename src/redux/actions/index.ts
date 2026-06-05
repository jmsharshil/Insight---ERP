export const authActions = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  SET_PASSWORD: "SET_PASSWORD",
} as const;

export const userActions = {
  GET_USERS: "GET_USERS",
  GET_USER_DETAILS: "GET_USER_DETAILS",
  UPDATE_USER: "UPDATE_USER",
} as const;

export const dropdownActions = {
  GET_DROPDOWN: "GET_DROPDOWN",
} as const;

export const leadActions = {
  CREATE_LEAD: "CREATE_LEAD",
  GET_LEADS: "GET_LEADS",
  GET_LEAD_DETAILS: "GET_LEAD_DETAILS",
  UPDATE_LEAD_STATUS: "UPDATE_LEAD_STATUS",
} as const;

export const crmActions = {
  GET_CRM_ANALYTICS: "GET_CRM_ANALYTICS",
}

export const settingActions = {
  GET_SETTINGS: "GET_SETTINGS",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
} as const;

export const branchAction = {
  GET_BRANCH: "GET_BRANCH",
  GET_BRANCH_STUDENTS: "GET_BRANCH_STUDENTS",
  UPDATE_BRANCH: "UPDATE_BRANCH",
  DELETE_BRANCH: "DELETE_BRANCH",
  CREATE_BRANCH: "CREATE_BRANCH",
} as const;
