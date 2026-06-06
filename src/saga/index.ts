import { all, fork } from "redux-saga/effects";
import { watchAuthSaga } from "./auth";
import { watchUsersSaga } from "./users";
import { watchDropdownSaga } from "./dropdown";
import { watchLeadsSaga } from "./leads";
import { watchCRMSaga } from "./crm";
import { watchBatchSaga } from "./batch";
import { watchCourseSaga } from "./course";
import { watchChatSaga } from "./chat";

function* rootSaga() {
  yield all([
    fork(watchAuthSaga),
    fork(watchUsersSaga),
    fork(watchDropdownSaga),
    fork(watchLeadsSaga),
    fork(watchCRMSaga),
    fork(watchBatchSaga),
    fork(watchCourseSaga),
    fork(watchChatSaga),
  ]);
}

export default rootSaga;
