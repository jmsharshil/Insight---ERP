import { takeLatest } from "redux-saga/effects";
import { timetableActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchTimetableNewSaga() {
  yield takeLatest(timetableActions.GET_SLOTS,         genericSaga);
  yield takeLatest(timetableActions.GET_SLOT_DETAIL,   genericSaga);
  yield takeLatest(timetableActions.CREATE_SLOT,       genericSaga);
  yield takeLatest(timetableActions.UPDATE_SLOT,       genericSaga);
  yield takeLatest(timetableActions.DELETE_SLOT,       genericSaga);
  yield takeLatest(timetableActions.GET_EXAM_TYPES,    genericSaga);
  yield takeLatest(timetableActions.CREATE_EXAM_TYPE,  genericSaga);
  yield takeLatest(timetableActions.UPDATE_EXAM_TYPE,  genericSaga);
  yield takeLatest(timetableActions.DELETE_EXAM_TYPE,  genericSaga);
  yield takeLatest(timetableActions.GET_FACULTY_VIEW,  genericSaga);
  yield takeLatest(timetableActions.GET_STUDENT_VIEW,  genericSaga);
}
