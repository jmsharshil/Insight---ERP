import { takeLatest, takeEvery } from "redux-saga/effects";
import { salesActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchSalesSaga() {
  yield takeLatest(salesActions.GET_PLANS, genericSaga);
  yield takeLatest(salesActions.GET_ODOMETER_READINGS, genericSaga);
  yield takeEvery(salesActions.CREATE_PLAN, genericSaga);
  yield takeEvery(salesActions.UPDATE_PLAN, genericSaga);
  yield takeEvery(salesActions.DELETE_PLAN, genericSaga);
  yield takeEvery(salesActions.APPROVE_ODOMETER, genericSaga);
  yield takeEvery(salesActions.REJECT_ODOMETER, genericSaga);
  yield takeEvery(salesActions.BULK_APPROVE_ODOMETER, genericSaga);
  yield takeEvery(salesActions.BULK_REJECT_ODOMETER, genericSaga);
  yield takeEvery(salesActions.UPLOAD_ACTIVITY_PHOTO, genericSaga);
}
