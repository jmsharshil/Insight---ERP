import { takeLatest } from "redux-saga/effects";
import { courseAction, levelActions, subjectAction, chapterAction } from "@/redux/actions";
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

  // Subject sagas using genericSaga
  yield takeLatest(subjectAction.GET_SUBJECTS, genericSaga);
  yield takeLatest(subjectAction.CREATE_SUBJECT, genericSaga);
  yield takeLatest(subjectAction.UPDATE_SUBJECT, genericSaga);
  yield takeLatest(subjectAction.DELETE_SUBJECT, genericSaga);

  // Chapter sagas using genericSaga
  yield takeLatest(chapterAction.GET_CHAPTERS, genericSaga);
  yield takeLatest(chapterAction.CREATE_CHAPTER, genericSaga);
  yield takeLatest(chapterAction.UPDATE_CHAPTER, genericSaga);
  yield takeLatest(chapterAction.DELETE_CHAPTER, genericSaga);
}
