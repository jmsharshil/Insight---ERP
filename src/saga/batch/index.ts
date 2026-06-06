import { takeLatest } from "redux-saga/effects";
import { batchAction } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchBatchSaga() {
  yield takeLatest(batchAction.GET_BATCHES, genericSaga);
  yield takeLatest(batchAction.GET_BATCH_DETAILS, genericSaga);
  yield takeLatest(batchAction.CREATE_BATCH, genericSaga);
  yield takeLatest(batchAction.UPDATE_BATCH, genericSaga);
  yield takeLatest(batchAction.DELETE_BATCH, genericSaga);
}
