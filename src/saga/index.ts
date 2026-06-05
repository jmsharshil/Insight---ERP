import { all, fork } from "redux-saga/effects";
import { watchAuthSaga } from "./auth";
import { watchUsersSaga } from "./users";

function* rootSaga() {
  yield all([
    fork(watchAuthSaga),
    fork(watchUsersSaga),
  ]);
}

export default rootSaga;
