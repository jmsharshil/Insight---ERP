import { takeLatest } from "redux-saga/effects";
import { reimbursementActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchReimbursementSaga() {
  yield takeLatest(reimbursementActions.GET_REIMBURSEMENTS, genericSaga);
  yield takeLatest(reimbursementActions.GET_REIMBURSEMENTS_SUMMARY, genericSaga);
  yield takeLatest(reimbursementActions.GET_REIMBURSEMENT_DETAIL, genericSaga);
  yield takeLatest(reimbursementActions.SUBMIT_REIMBURSEMENT, genericSaga);
  yield takeLatest(reimbursementActions.APPROVE_REIMBURSEMENT, genericSaga);
  yield takeLatest(reimbursementActions.REJECT_REIMBURSEMENT, genericSaga);
  yield takeLatest(reimbursementActions.DELETE_REIMBURSEMENT, genericSaga);
}
