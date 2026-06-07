import { takeLatest } from "redux-saga/effects";
import { courseAction } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchCourseSaga() {
  yield takeLatest(courseAction.GET_COURSES, genericSaga);
  yield takeLatest(courseAction.GET_COURSE_DETAILS, genericSaga);
  yield takeLatest(courseAction.CREATE_COURSE, genericSaga);
  yield takeLatest(courseAction.UPDATE_COURSE, genericSaga);
  yield takeLatest(courseAction.DELETE_COURSE, genericSaga);
}
