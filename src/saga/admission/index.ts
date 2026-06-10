import { takeLatest } from "redux-saga/effects";
import { admissionActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchAdmissionSaga() {
  yield takeLatest(admissionActions.SUBMIT_ADMISSION, genericSaga);
  yield takeLatest(admissionActions.GET_ADMISSIONS, genericSaga);
  yield takeLatest(admissionActions.GET_ADMISSION_DETAIL, genericSaga);
  yield takeLatest(admissionActions.APPROVE_ADMISSION, genericSaga);
  yield takeLatest(admissionActions.REJECT_ADMISSION, genericSaga);
  yield takeLatest(admissionActions.UPLOAD_PAYMENT, genericSaga);
}
