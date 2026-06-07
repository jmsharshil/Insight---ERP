import { takeLatest } from "redux-saga/effects";

import { studentActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchStudentSaga() {
  yield takeLatest(studentActions.GET_STUDENTS, genericSaga);
  yield takeLatest(studentActions.GET_STUDENT_DETAIL, genericSaga);
}
