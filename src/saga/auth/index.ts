import { takeLatest } from "redux-saga/effects";
import { authActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchAuthSaga() {
  yield takeLatest(authActions.LOGIN, genericSaga);
  yield takeLatest(authActions.SET_PASSWORD, genericSaga);
}
