import { takeLatest } from "redux-saga/effects";
import { leaveActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchLeaveSaga() {
  yield takeLatest(leaveActions.GET_LEAVE_POLICIES, genericSaga);
  yield takeLatest(leaveActions.CREATE_LEAVE_POLICY, genericSaga);
  yield takeLatest(leaveActions.UPDATE_LEAVE_POLICY, genericSaga);
  yield takeLatest(leaveActions.DELETE_LEAVE_POLICY, genericSaga);

  yield takeLatest(leaveActions.GET_HOLIDAYS, genericSaga);
  yield takeLatest(leaveActions.CREATE_HOLIDAY, genericSaga);
  yield takeLatest(leaveActions.UPDATE_HOLIDAY, genericSaga);
  yield takeLatest(leaveActions.DELETE_HOLIDAY, genericSaga);

  yield takeLatest(leaveActions.GET_MY_BALANCE, genericSaga);
  yield takeLatest(leaveActions.GET_USER_BALANCE, genericSaga);

  yield takeLatest(leaveActions.GET_LEAVES, genericSaga);
  yield takeLatest(leaveActions.SUBMIT_LEAVE, genericSaga);
  yield takeLatest(leaveActions.UPDATE_LEAVE, genericSaga);
  yield takeLatest(leaveActions.CANCEL_LEAVE, genericSaga);
  yield takeLatest(leaveActions.APPROVE_LEAVE, genericSaga);
  yield takeLatest(leaveActions.REJECT_LEAVE, genericSaga);

  yield takeLatest(leaveActions.GET_LATE_ENTRIES, genericSaga);
  yield takeLatest(leaveActions.CREATE_LATE_ENTRY, genericSaga);
  yield takeLatest(leaveActions.UPDATE_LATE_ENTRY, genericSaga);
  yield takeLatest(leaveActions.DELETE_LATE_ENTRY, genericSaga);

  yield takeLatest(leaveActions.GET_LEAVE_DETAIL, genericSaga);
  yield takeLatest(leaveActions.GET_POLICY_DETAIL, genericSaga);
  yield takeLatest(leaveActions.GET_HOLIDAY_DETAIL, genericSaga);
  yield takeLatest(leaveActions.GET_LATE_ENTRY_DETAIL, genericSaga);
}
