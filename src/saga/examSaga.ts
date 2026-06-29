import { takeLatest } from "redux-saga/effects";
import { examActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchExamSaga() {
  yield takeLatest(examActions.GET_EXAMS, genericSaga);
  yield takeLatest(examActions.GET_EXAM_DETAIL, genericSaga);
  yield takeLatest(examActions.UPDATE_EXAM, genericSaga);
  yield takeLatest(examActions.DELETE_EXAM, genericSaga);
  yield takeLatest(examActions.GET_QUESTIONS, genericSaga);
  yield takeLatest(examActions.ADD_QUESTIONS, genericSaga);
  yield takeLatest(examActions.UPDATE_QUESTION, genericSaga);
  yield takeLatest(examActions.DELETE_QUESTION, genericSaga);
  yield takeLatest(examActions.GET_SEATING, genericSaga);
  yield takeLatest(examActions.ASSIGN_SEATING, genericSaga);
  yield takeLatest(examActions.UPDATE_SEAT, genericSaga);
  yield takeLatest(examActions.DELETE_SEAT, genericSaga);
  yield takeLatest(examActions.DISTRIBUTE_ANSWER_KEY, genericSaga);
  yield takeLatest(examActions.GET_MALPRACTICE, genericSaga);
  yield takeLatest(examActions.REPORT_MALPRACTICE, genericSaga);
  yield takeLatest(examActions.UPDATE_MALPRACTICE, genericSaga);
  yield takeLatest(examActions.DELETE_MALPRACTICE, genericSaga);
  yield takeLatest(examActions.SCHEDULE_EXAM, genericSaga);
  yield takeLatest(examActions.GET_PAPERS, genericSaga);
  yield takeLatest(examActions.UPDATE_PAPER_MARKS, genericSaga);
  yield takeLatest(examActions.DELETE_PAPER, genericSaga);
  yield takeLatest(examActions.GET_CHECKER_STATUS, genericSaga);
  yield takeLatest(examActions.RAISE_PAPER_QUERY, genericSaga);
  yield takeLatest(examActions.RESOLVE_PAPER_QUERY, genericSaga);
  yield takeLatest(examActions.GET_RESULTS, genericSaga);
  yield takeLatest(examActions.PUBLISH_RESULTS, genericSaga);
  yield takeLatest(examActions.DELETE_RESULT, genericSaga);
  yield takeLatest(examActions.CREATE_RECHECK_REQUEST, genericSaga);
  yield takeLatest(examActions.GET_RECHECK_REQUESTS, genericSaga);
  yield takeLatest(examActions.RECHECK_REQUEST_ACTION, genericSaga);
}
