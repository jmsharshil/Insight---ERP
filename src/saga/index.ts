import { all, fork } from "redux-saga/effects";
import { watchAuthSaga } from "./auth";
import { watchUsersSaga } from "./users";
import { watchDropdownSaga } from "./dropdown";
import { watchLeadsSaga } from "./leads";
import { watchCRMSaga } from "./crm";

function* rootSaga() {
  yield all([
    fork(watchAuthSaga),
    fork(watchUsersSaga),
    fork(watchDropdownSaga),
    fork(watchLeadsSaga),
    fork(watchCRMSaga),
  ]);
}

export default rootSaga;
