import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DUMMY_ATTENDANCE, AttendanceRecord } from "@/constants/dummy/attendance";
interface AttendanceState {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
}
const initialState: AttendanceState = {
  records: [],
  loading: false,
  error: null,
};
export const normalizeRecord = (r: any): AttendanceRecord => {
  const formatTime = (dtStr: string | null | undefined) => {
    if (!dtStr) return undefined;
    if (dtStr.includes(" ") || dtStr.includes("T")) {
      const parts = dtStr.split(/[ T]/);
      const timePart = parts[1];
      if (timePart) {
        return timePart.substring(0, 5); // return HH:MM
      }
    }
    return dtStr;
  };
  return {
    id: String(r.id || r.attendance_id || ""),
    studentId: String(r.student || r.student_id || r.studentId || ""),
    studentName: String(r.student_name || r.studentName || ""),
    rollNumber: String(r.roll_number || r.rollNumber || ""),
    batch: String(r.batch_name || r.batch || ""),
    date: String(r.date || ""),
    checkIn: formatTime(r.checked_in_at || r.check_in || r.checkIn),
    checkOut: formatTime(r.checked_out_at || r.check_out || r.checkOut),
    status: (r.status || "absent") as any,
    statusDisplay: r.status_display || r.statusDisplay || undefined,
    session: r.session || undefined,
    sessionDisplay: r.session_display || r.sessionDisplay || undefined,
    markedByName: r.marked_by_name || r.markedByName || undefined,
    markedBy: String(r.marked_by || r.markedBy || ""),
    markedAt: r.marked_at || r.markedAt || undefined,
    isCorrected: r.is_corrected !== undefined ? r.is_corrected : r.isCorrected,
    correctedBy: r.corrected_by || r.correctedBy || undefined,
    correctedByName: r.corrected_by_name || r.correctedByName || undefined,
    correctionNote: r.correction_note || r.correctionNote || undefined,
    scanType: (r.scan_type || r.scanType || (r.marked_by_name ? "manual" : "qr")) as any,
    deviceId: r.device_id || r.deviceId || undefined,
    violation: r.violation || undefined,
    checkedInAt: r.checked_in_at || undefined,
    checkedOutAt: r.checked_out_at || undefined,
    batchId: r.batch || undefined,
    branchId: r.branch || undefined,
    batchName: r.batch_name || r.batchName || undefined,
    branchName: r.branch_name || r.branchName || undefined,
  };
};
export const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    setRecords: (state, action: PayloadAction<any[]>) => {
      state.records = action.payload.map(normalizeRecord);
      state.error = null;
    },
    addRecord: (state, action: PayloadAction<AttendanceRecord>) => {
      state.records = [action.payload, ...state.records];
    },
    updateRecord: (state, action: PayloadAction<AttendanceRecord>) => {
      const index = state.records.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});
export const { setRecords, addRecord, updateRecord, setLoading, setError } =
  attendanceSlice.actions;
export const attendanceReducer = attendanceSlice.reducer;
export default attendanceReducer;
