import { takeLatest } from "redux-saga/effects";
import { notificationActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchNotificationsSaga() {
  yield takeLatest(notificationActions.GET_NOTIFICATIONS, genericSaga);
  yield takeLatest(notificationActions.MARK_NOTIFICATIONS_READ, genericSaga);
}
