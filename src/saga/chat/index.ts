import { takeLatest } from "redux-saga/effects";
import { ChatAction } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchChatSaga() {
  yield takeLatest(ChatAction.GET_CHAT_ROOMS, genericSaga);
  yield takeLatest(ChatAction.GET_CHAT_ROOM_DETAILS, genericSaga);
  yield takeLatest(ChatAction.CREATE_GROUP_CHAT, genericSaga);
  yield takeLatest(ChatAction.CREATE_DIRECT_CHAT, genericSaga);
  yield takeLatest(ChatAction.SEND_CHAT_MESSAGE, genericSaga);
  yield takeLatest(ChatAction.GET_CHAT_MESSAGES, genericSaga);
}
