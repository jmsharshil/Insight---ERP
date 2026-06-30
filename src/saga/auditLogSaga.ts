import { takeLatest } from "redux-saga/effects";
import { auditLogActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchAuditLogSaga() {
  yield takeLatest(auditLogActions.GET_AUDIT_LOGS,       genericSaga);
  yield takeLatest(auditLogActions.GET_AUDIT_LOG_DETAIL, genericSaga);
  yield takeLatest(auditLogActions.FLUSH_AUDIT_LOGS,     genericSaga);
}
