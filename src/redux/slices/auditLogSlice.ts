import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuditLogEntry {
  id: string;
  user: string | null;
  user_email: string;
  user_name: string;
  user_role: string;
  organization: string | null;
  organization_name: string;
  action: string;
  event: string;
  method: string;
  path: string;
  endpoint_name: string;
  status_code: number;
  query_params: string;
  request_body: string;
  response_summary: string;
  ip_address: string;
  user_agent: string;
  target_model: string;
  target_id: string;
  timestamp: string;
  flushed_to_blob: boolean;
}

interface AuditLogState {
  logs: AuditLogEntry[];
  loading: boolean;
  error: string | null;
  count: number;
  next: string | null;
  previous: string | null;
  currentPage: number;
}

const initialState: AuditLogState = {
  logs: [],
  loading: false,
  error: null,
  count: 0,
  next: null,
  previous: null,
  currentPage: 1,
};

const auditLogSlice = createSlice({
  name: "auditLog",
  initialState,
  reducers: {
    setAuditLogs(state, action: PayloadAction<AuditLogEntry[]>) {
      state.logs = action.payload;
    },
    setAuditLogsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAuditLogsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setAuditLogsPagination(state, action: PayloadAction<{ count: number; next: string | null; previous: string | null; currentPage: number }>) {
      state.count = action.payload.count;
      state.next = action.payload.next;
      state.previous = action.payload.previous;
      state.currentPage = action.payload.currentPage;
    },
  },
});

export const { setAuditLogs, setAuditLogsLoading, setAuditLogsError, setAuditLogsPagination } = auditLogSlice.actions;

export default auditLogSlice.reducer;
