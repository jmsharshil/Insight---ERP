import { takeLatest } from "redux-saga/effects";
import { payrollActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchPayrollSaga() {
  yield takeLatest(payrollActions.GET_RUNS,             genericSaga);
  yield takeLatest(payrollActions.GET_RUN_DETAIL,       genericSaga);
  yield takeLatest(payrollActions.GENERATE_PAYROLL,     genericSaga);
  yield takeLatest(payrollActions.UPDATE_RUN,           genericSaga);
  yield takeLatest(payrollActions.DELETE_RUN,           genericSaga);
  yield takeLatest(payrollActions.APPROVE_RUN,          genericSaga);
  yield takeLatest(payrollActions.DISBURSE_RUN,         genericSaga);
  yield takeLatest(payrollActions.GET_PAYSLIPS,         genericSaga);
  yield takeLatest(payrollActions.ADJUST_PAYSLIP,       genericSaga);
  yield takeLatest(payrollActions.GET_MY_PAYROLL,       genericSaga);
  yield takeLatest(payrollActions.GET_SALARY_PREVIEW,   genericSaga);
  yield takeLatest(payrollActions.GET_FACULTY_PAYSLIPS, genericSaga);
  yield takeLatest(payrollActions.GET_LATE_POLICY,      genericSaga);
  yield takeLatest(payrollActions.CREATE_LATE_POLICY,   genericSaga);
  yield takeLatest(payrollActions.UPDATE_LATE_POLICY,   genericSaga);
  yield takeLatest(payrollActions.DELETE_LATE_POLICY,   genericSaga);
  yield takeLatest(payrollActions.GET_EXTRA_HOURS,      genericSaga);
  yield takeLatest(payrollActions.UPDATE_EXTRA_HOUR,    genericSaga);
}
