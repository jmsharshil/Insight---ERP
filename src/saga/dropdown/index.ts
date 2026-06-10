import { takeEvery } from "redux-saga/effects";
import { dropdownActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchDropdownSaga() {
  yield takeEvery(dropdownActions.GET_DROPDOWN, genericSaga);
}
