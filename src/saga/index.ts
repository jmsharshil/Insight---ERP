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
import { watchFeesSaga } from "./fees";
import { watchFacultySaga } from "./faculty";
import { watchNotificationsSaga } from "./notifications";
import { watchAttendanceSaga } from "./attendance";
import { watchTimetableNewSaga } from "./timetableNewSaga";
import { watchExamSaga } from "./examSaga";
import { watchLeaveSaga } from "./leaveSaga";
import { watchInventorySaga } from "./inventorySaga";
import { watchPayrollSaga } from "./payrollSaga";
import { watchAuditLogSaga } from "./auditLogSaga";

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
    fork(watchFeesSaga),
    fork(watchFacultySaga),
    fork(watchNotificationsSaga),
    fork(watchAttendanceSaga),
    fork(watchTimetableNewSaga),
    fork(watchExamSaga),
    fork(watchLeaveSaga),
    fork(watchInventorySaga),
    fork(watchPayrollSaga),
    fork(watchAuditLogSaga),
  ]);
}

export default rootSaga;
