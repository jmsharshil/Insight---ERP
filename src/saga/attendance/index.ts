import { takeLatest } from "redux-saga/effects";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";
import { attendanceActions } from "@/redux/actions";

export function* watchAttendanceSaga() {
  yield takeLatest(attendanceActions.GET_ATTENDANCE, genericSaga);
  yield takeLatest(attendanceActions.GET_ATTENDANCE_REPORT, genericSaga);
}
