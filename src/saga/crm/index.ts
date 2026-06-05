import { takeLatest } from "redux-saga/effects";
import { crmActions, leadActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchCRMSaga() {
  yield takeLatest(crmActions.GET_CRM_ANALYTICS, genericSaga);
}
