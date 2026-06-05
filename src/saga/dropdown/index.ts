import { takeLatest } from "redux-saga/effects";
import { dropdownActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchDropdownSaga() {
  yield takeLatest(dropdownActions.GET_DROPDOWN, genericSaga);
}
