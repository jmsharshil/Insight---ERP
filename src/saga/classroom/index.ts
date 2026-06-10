import { takeLatest } from "redux-saga/effects";
import { ClassroomAction, TimetableAction } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchClassroomSaga() {
  yield takeLatest(ClassroomAction.GET_CLASSROOMS, genericSaga);
  yield takeLatest(ClassroomAction.CREATE_CLASSROOMS, genericSaga);
  yield takeLatest(ClassroomAction.UPDATE_CLASSROOMS, genericSaga);
  yield takeLatest(ClassroomAction.DELETE_CLASSROOMS, genericSaga);
  yield takeLatest(TimetableAction.GET_TIMETABLE, genericSaga);
  yield takeLatest(TimetableAction.GET_TIMETABLE_DETAIL, genericSaga);
  yield takeLatest(TimetableAction.CREATE_TIMETABLE, genericSaga);
  yield takeLatest(TimetableAction.UPDATE_TIMETABLE, genericSaga);
  yield takeLatest(TimetableAction.DELETE_TIMETABLE, genericSaga);
}
