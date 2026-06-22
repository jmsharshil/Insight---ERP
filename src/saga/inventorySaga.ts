import { takeLatest } from "redux-saga/effects";
import { inventoryActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchInventorySaga() {
  yield takeLatest(inventoryActions.GET_CATEGORIES,     genericSaga);
  yield takeLatest(inventoryActions.CREATE_CATEGORY,    genericSaga);
  yield takeLatest(inventoryActions.UPDATE_CATEGORY,    genericSaga);
  yield takeLatest(inventoryActions.DELETE_CATEGORY,    genericSaga);

  yield takeLatest(inventoryActions.GET_ITEMS,          genericSaga);
  yield takeLatest(inventoryActions.GET_ITEM_DETAIL,    genericSaga);
  yield takeLatest(inventoryActions.CREATE_ITEM,        genericSaga);
  yield takeLatest(inventoryActions.UPDATE_ITEM,        genericSaga);
  yield takeLatest(inventoryActions.DELETE_ITEM,        genericSaga);

  yield takeLatest(inventoryActions.GET_TRANSACTIONS,   genericSaga);
  yield takeLatest(inventoryActions.CREATE_TRANSACTION, genericSaga);

  yield takeLatest(inventoryActions.GET_ALLOCATIONS,    genericSaga);
  yield takeLatest(inventoryActions.CREATE_ALLOCATION,  genericSaga);
  yield takeLatest(inventoryActions.BULK_ALLOCATION,    genericSaga);
  yield takeLatest(inventoryActions.RETURN_ALLOCATION,  genericSaga);

  yield takeLatest(inventoryActions.GET_FORECAST,       genericSaga);
}
