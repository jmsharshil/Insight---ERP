import { takeLatest } from "redux-saga/effects";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";
import { feesActions } from "@/redux/actions";

export function* watchFeesSaga() {
    yield takeLatest(feesActions.GET_FEE_STRUCTURES, genericSaga);
//     yield takeLatest(feesActions.CREATE_FEE_STRUCTURES, genericSaga);
//     yield takeLatest(feesActions.UPDATE_FEE_STRUCTURES, genericSaga);
//     yield takeLatest(feesActions.DELETE_FEE_STRUCTURES, genericSaga);
}