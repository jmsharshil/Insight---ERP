import { takeLatest } from "redux-saga/effects";
import { ChatAction } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchChatSaga() {
  yield takeLatest(ChatAction.GET_CHAT_ROOMS, genericSaga);
}
