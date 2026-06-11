import { takeLatest } from "redux-saga/effects";
import { courseAction, levelActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchCourseSaga() {
  yield takeLatest(courseAction.GET_COURSES, genericSaga);
  yield takeLatest(courseAction.GET_COURSE_DETAILS, genericSaga);
  yield takeLatest(courseAction.CREATE_COURSE, genericSaga);
  yield takeLatest(courseAction.UPDATE_COURSE, genericSaga);
  yield takeLatest(courseAction.DELETE_COURSE, genericSaga);

  // Level sagas using genericSaga
  yield takeLatest(levelActions.GET_LEVELS, genericSaga);
  yield takeLatest(levelActions.GET_LEVEL_DETAILS, genericSaga);
  yield takeLatest(levelActions.CREATE_LEVEL, genericSaga);
  yield takeLatest(levelActions.UPDATE_LEVEL, genericSaga);
  yield takeLatest(levelActions.DELETE_LEVEL, genericSaga);
}
