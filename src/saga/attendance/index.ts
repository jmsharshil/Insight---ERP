import { takeLatest } from "redux-saga/effects";
import { attendanceActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchAttendanceSaga() {
  yield takeLatest(attendanceActions.GET_DASHBOARD,       genericSaga);
  yield takeLatest(attendanceActions.GET_STUDENTS,        genericSaga);
  yield takeLatest(attendanceActions.GET_STUDENT_DETAIL,  genericSaga);
  yield takeLatest(attendanceActions.GET_HISTORY,         genericSaga);
  yield takeLatest(attendanceActions.GET_FACULTY,         genericSaga);
  yield takeLatest(attendanceActions.GET_FACULTY_DETAIL,  genericSaga);
  yield takeLatest(attendanceActions.GET_ANALYTICS,       genericSaga);
  yield takeLatest(attendanceActions.GET_DEFAULTERS,      genericSaga);
  yield takeLatest(attendanceActions.GET_VIOLATIONS,      genericSaga);
  yield takeLatest(attendanceActions.GET_BATCH_REGISTER,  genericSaga);
  yield takeLatest(attendanceActions.EXPORT_CSV,          genericSaga);
}
