import { takeLatest } from "redux-saga/effects";
import { facultyAction } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchFacultySaga() {
  yield takeLatest(facultyAction.GET_FACULTY, genericSaga);
  yield takeLatest(facultyAction.GET_FACULTY_DETAILS, genericSaga);
  yield takeLatest(facultyAction.ADD_FACULTY, genericSaga);
  yield takeLatest(facultyAction.UPDATE_FACULTY, genericSaga);
  yield takeLatest(facultyAction.DELETE_FACULTY, genericSaga);
}
