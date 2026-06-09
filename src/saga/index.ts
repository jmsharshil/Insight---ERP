import { all, fork } from "redux-saga/effects";
import { watchAuthSaga } from "./auth";
import { watchUsersSaga } from "./users";
import { watchDropdownSaga } from "./dropdown";
import { watchLeadsSaga } from "./leads";
import { watchCRMSaga } from "./crm";
import { watchAdmissionSaga } from "./admission";
import { watchStudentSaga } from "./student";
import { watchBatchSaga } from "./batch";
import { watchCourseSaga } from "./course";
import { watchChatSaga } from "./chat";
import { watchClassroomSaga } from "./classroom";

function* rootSaga() {
  yield all([
    fork(watchAuthSaga),
    fork(watchUsersSaga),
    fork(watchDropdownSaga),
    fork(watchLeadsSaga),
    fork(watchCRMSaga),
    fork(watchAdmissionSaga),
    fork(watchStudentSaga),
    fork(watchBatchSaga),
    fork(watchCourseSaga),
    fork(watchChatSaga),
    fork(watchClassroomSaga),
  ]);
}

export default rootSaga;
