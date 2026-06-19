import { takeLatest } from "redux-saga/effects";
import { leadActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchLeadsSaga() {
  yield takeLatest(leadActions.CREATE_LEAD, genericSaga);
  yield takeLatest(leadActions.GET_LEADS, genericSaga);
  yield takeLatest(leadActions.GET_LEAD_DETAILS, genericSaga);
  yield takeLatest(leadActions.UPDATE_LEAD_STATUS, genericSaga);
  yield takeLatest(leadActions.UPDATE_LEAD, genericSaga);
  yield takeLatest(leadActions.ASSIGN_LEAD, genericSaga);
  yield takeLatest(leadActions.REASSIGN_LEAD, genericSaga);
}
  