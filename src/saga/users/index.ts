import { takeLatest } from "redux-saga/effects";
import { userActions, settingActions, branchAction } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchUsersSaga() {
  yield takeLatest(userActions.GET_USERS, genericSaga);
  yield takeLatest(userActions.GET_USERS_FOR_ASSIGN, genericSaga);
  yield takeLatest(userActions.GET_USER_DETAILS, genericSaga);
  yield takeLatest(userActions.UPDATE_USER, genericSaga);
  yield takeLatest(userActions.ADD_USER, genericSaga);
  yield takeLatest(settingActions.GET_SETTINGS, genericSaga);
  yield takeLatest(settingActions.UPDATE_SETTINGS, genericSaga);
  yield takeLatest(branchAction.GET_BRANCH, genericSaga);
  yield takeLatest(branchAction.GET_BRANCH_STUDENTS, genericSaga);
  yield takeLatest(branchAction.UPDATE_BRANCH, genericSaga);
  yield takeLatest(branchAction.DELETE_BRANCH, genericSaga);
  yield takeLatest(branchAction.CREATE_BRANCH, genericSaga);

}
