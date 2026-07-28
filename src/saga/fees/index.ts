import { takeLatest } from "redux-saga/effects";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";
import { feesActions } from "@/redux/actions";

export function* watchFeesSaga() {
    yield takeLatest(feesActions.GET_FEE_STRUCTURES, genericSaga);
    yield takeLatest(feesActions.GET_FEE_STRUCTURE_DETAIL, genericSaga);
    yield takeLatest(feesActions.CREATE_FEE_STRUCTURES, genericSaga);
    yield takeLatest(feesActions.UPDATE_FEE_STRUCTURES, genericSaga);
    yield takeLatest(feesActions.DELETE_FEE_STRUCTURES, genericSaga);
    yield takeLatest(feesActions.GET_STUDENT_FEES, genericSaga);
    yield takeLatest(feesActions.CREATE_STUDENT_FEE, genericSaga);
    yield takeLatest(feesActions.GET_STUDENT_FEES_BY_STUDENT, genericSaga);
    yield takeLatest(feesActions.GET_STUDENT_FEES_SUMMARY, genericSaga);
    yield takeLatest(feesActions.GET_INSTALLMENTS, genericSaga);
    yield takeLatest(feesActions.CREATE_INSTALLMENT_PLAN, genericSaga);
    yield takeLatest(feesActions.APPROVE_INSTALLMENT_PLAN, genericSaga);
    yield takeLatest(feesActions.GET_PAYMENTS, genericSaga);
    yield takeLatest(feesActions.RECORD_PAYMENT, genericSaga);
    yield takeLatest(feesActions.VERIFY_PAYMENT, genericSaga);
    yield takeLatest(feesActions.GET_BANK_ACCOUNTS, genericSaga);
    yield takeLatest(feesActions.CREATE_BANK_ACCOUNT, genericSaga);
    yield takeLatest(feesActions.UPDATE_BANK_ACCOUNT, genericSaga);
    yield takeLatest(feesActions.DELETE_BANK_ACCOUNT, genericSaga);
    yield takeLatest(feesActions.GET_FEE_REPORT, genericSaga);
    yield takeLatest(feesActions.GET_REFUNDS, genericSaga);
    yield takeLatest(feesActions.CREATE_REFUND, genericSaga);
    yield takeLatest(feesActions.UPDATE_REFUND, genericSaga);
    yield takeLatest(feesActions.GET_MY_FEES, genericSaga);
}