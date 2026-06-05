import { takeLatest } from "redux-saga/effects";
import { userActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchUsersSaga() {
  yield takeLatest(userActions.GET_USERS, genericSaga);
  yield takeLatest(userActions.GET_USER_DETAILS, genericSaga);
  yield takeLatest(userActions.UPDATE_USER, genericSaga);
}
