import { all, fork } from "redux-saga/effects";
import { watchAuthSaga } from "./auth";

function* rootSaga() {
  yield all([
    fork(watchAuthSaga),
    // fork(watchStudentSaga),   ← new features added here
  ]);
}

export default rootSaga;
