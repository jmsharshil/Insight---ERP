# InventoryPage.tsx — Full API Integration Prompt (with Allocations)

> Copy this entire prompt and paste it into Cursor / Copilot Chat / Windsurf.
> Fully self-contained — no extra context needed.

---

## CONTEXT — Project Stack & Conventions

You are a senior React + TypeScript developer working inside **insight-ems** (Vite + React 18).

### Tech Stack (already installed — NO new npm installs)

- **State:** Redux Toolkit + Redux Saga (`genericSaga` pattern)
- **Routing:** react-router-dom v6
- **UI:** Radix UI + shadcn/ui (`@/components/ui/`)
- **Animations:** framer-motion
- **Icons:** lucide-react
- **HTTP:** axios — always via `genericSaga`, never direct calls
- **Notifications:** `useToast` hook (`@/hooks/useToast`)
- **Skeletons:** `TableSkeleton` from `@/components/common/Skeletons`

### API Call Pattern — NEVER deviate

```ts
dispatch({
  type: ACTION_CONSTANT,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  endPoint: "/api/v1/...",
  body: { ... },
  auth: true,
  setLoading: (v: boolean) => dispatch(setSomeLoading(v)),
  getResponse: (res: any) => { /* handle */ },
  getError: (err: any) => { toast.error(err?.response?.data?.message || err?.message || "Error"); },
});
```

### Auth User Object Shape (from `useAuth().user`)

```ts
{
  id: string;
  name: string;
  role: string;   // "super_admin" | "branch_manager" | "admin_senior_executive" | "faculty" | ...
  organization: string;
  organization_name: string;
  // NO branch_id field — backend infers from user profile for non-super_admin
}
```

### branch Rule — CRITICAL (prevents "Branch required." errors)

```ts
// Only send branch for super_admin — backend infers for all other roles
const getBranchPayload = (isSuperAdmin: boolean, selectedBranch: string) => {
  if (isSuperAdmin && selectedBranch) return { branch: selectedBranch };
  return {};
};
```

Branch list from: `GET /api/v1/batches/dropdowns/` → `data.branches` → `{ id, name, city }`

### Users API (for student/faculty dropdowns)

```ts
// Fetch students
GET /api/auth/users/?role=student

// Fetch faculty
GET /api/auth/users/?role=faculty

// Response shape:
{
  success: true,
  count: 33,
  data: [
    {
      id: "uuid",
      name: "Test Faculty",
      role: "faculty",
      role_display: "Faculty",
      is_active: boolean,
      ...
    }
  ]
}
```

### Design Tokens

- Primary orange: `#F7A900` → `bg-primary` / `text-primary`
- Surface: `#F4F5F5`, Card: `#FFFFFF`, Border: `border-border`
- Status: success `bg-green-100 text-green-700` | danger `bg-red-100 text-red-700` | warning `bg-yellow-100 text-yellow-700` | info `bg-blue-100 text-blue-700`

### Folder Structure

```
src/pages/inventory/
  InventoryPage.tsx               ← Main page — 4 tabs
  tabs/
    CategoriesTab.tsx             ← CRUD for item categories
    ItemsTab.tsx                  ← CRUD for items + Add Stock per row
    AllocationsTab.tsx            ← Issue (single + bulk), view, return allocations
    ForecastTab.tsx               ← Read-only forecast dashboard
```

---

## API BASE URL

All inventory endpoints: `/api/v1/inventory/`

---

## FILE 1 — ADD to `src/redux/actions/index.ts`

```ts
export const inventoryActions = {
  // Categories
  GET_CATEGORIES:        "GET_INVENTORY_CATEGORIES",
  CREATE_CATEGORY:       "CREATE_INVENTORY_CATEGORY",
  UPDATE_CATEGORY:       "UPDATE_INVENTORY_CATEGORY",
  DELETE_CATEGORY:       "DELETE_INVENTORY_CATEGORY",

  // Items
  GET_ITEMS:             "GET_INVENTORY_ITEMS",
  GET_ITEM_DETAIL:       "GET_INVENTORY_ITEM_DETAIL",
  CREATE_ITEM:           "CREATE_INVENTORY_ITEM",
  UPDATE_ITEM:           "UPDATE_INVENTORY_ITEM",
  DELETE_ITEM:           "DELETE_INVENTORY_ITEM",

  // Stock Transactions
  GET_TRANSACTIONS:      "GET_INVENTORY_TRANSACTIONS",
  CREATE_TRANSACTION:    "CREATE_INVENTORY_TRANSACTION",

  // Allocations
  GET_ALLOCATIONS:       "GET_INVENTORY_ALLOCATIONS",
  CREATE_ALLOCATION:     "CREATE_INVENTORY_ALLOCATION",
  BULK_ALLOCATION:       "BULK_INVENTORY_ALLOCATION",
  RETURN_ALLOCATION:     "RETURN_INVENTORY_ALLOCATION",

  // Forecast
  GET_FORECAST:          "GET_INVENTORY_FORECAST",
} as const;
```

---

## FILE 2 — ADD to `src/service/api.ts`

```ts
INVENTORY: {
  CATEGORIES:          "/api/v1/inventory/categories/",
  CATEGORY_DETAIL:     (id: string) => `/api/v1/inventory/categories/${id}/`,

  ITEMS:               "/api/v1/inventory/items/",
  ITEM_DETAIL:         (id: string) => `/api/v1/inventory/items/${id}/`,

  TRANSACTIONS:        "/api/v1/inventory/transactions/",

  ALLOCATIONS:         "/api/v1/inventory/allocations/",
  ALLOCATION_DETAIL:   (id: string) => `/api/v1/inventory/allocations/${id}/`,
  ALLOCATION_RETURN:   (id: string) => `/api/v1/inventory/allocations/${id}/return_item/`,
  ALLOCATION_BULK:     "/api/v1/inventory/allocations/bulk_issue/",

  FORECAST:            "/api/v1/inventory/forecast/",
},
```

---

## FILE 3 — CREATE `src/redux/slices/inventorySlice.ts`

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ItemCategory {
  id: string;
  branch: string;
  branch_name: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  category: string;
  category_name: string;
  name: string;
  sku: string;
  description: string;
  size: string;
  total_stock: number;       // read-only — auto-calculated by backend
  reorder_level: number;
  unit_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: string;
  item: string;
  item_name: string;
  transaction_type: "purchase" | "allocation" | "return" | "damage" | "adjustment";
  transaction_type_display: string;
  quantity: number;
  unit_price: string;
  reference: string;
  notes: string;
  created_at: string;
}

export interface ItemAllocation {
  id: string;
  item: string;
  item_name: string;
  student: string | null;
  student_name: string | null;
  faculty: string | null;
  faculty_name: string | null;
  quantity: number;
  size: string;
  status: "issued" | "returned";
  status_display: string;
  issued_at: string;
  issued_by: number;
  issued_by_name: string;
  returned_at: string | null;
  return_notes: string;
  notes: string;
}

export interface ForecastItem {
  item_id: string;
  item_name: string;
  sku: string;
  category: string;
  current_stock: number;
  reorder_level: number;
  last_30d_usage: number;
  daily_burn_rate: number;
  projected_30d_demand: number;
  days_until_stockout: number;
  status: "healthy" | "warning" | "critical";
  message: string;
}

// User shape from /api/auth/users/
export interface UserOption {
  id: string;
  name: string;
  role: string;
  role_display: string;
  is_active: boolean;
}

interface InventoryState {
  categories: ItemCategory[];
  categoriesCount: number;
  categoriesLoading: boolean;

  items: InventoryItem[];
  itemsCount: number;
  itemsLoading: boolean;

  transactions: StockTransaction[];
  transactionsLoading: boolean;

  allocations: ItemAllocation[];
  allocationsCount: number;
  allocationsLoading: boolean;

  forecast: ForecastItem[];
  forecastLoading: boolean;

  error: string | null;
}

const initialState: InventoryState = {
  categories: [],
  categoriesCount: 0,
  categoriesLoading: false,

  items: [],
  itemsCount: 0,
  itemsLoading: false,

  transactions: [],
  transactionsLoading: false,

  allocations: [],
  allocationsCount: 0,
  allocationsLoading: false,

  forecast: [],
  forecastLoading: false,

  error: null,
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    // Categories
    setCategories(s, a: PayloadAction<{ data: ItemCategory[]; count: number }>) {
      s.categories = a.payload.data;
      s.categoriesCount = a.payload.count;
    },
    setCategoriesLoading(s, a: PayloadAction<boolean>) { s.categoriesLoading = a.payload; },
    addCategory(s, a: PayloadAction<ItemCategory>) { s.categories.unshift(a.payload); s.categoriesCount += 1; },
    updateCategoryInList(s, a: PayloadAction<ItemCategory>) {
      const i = s.categories.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.categories[i] = a.payload;
    },
    removeCategory(s, a: PayloadAction<string>) {
      s.categories = s.categories.filter(x => x.id !== a.payload);
      s.categoriesCount -= 1;
    },

    // Items
    setItems(s, a: PayloadAction<{ data: InventoryItem[]; count: number }>) {
      s.items = a.payload.data;
      s.itemsCount = a.payload.count;
    },
    setItemsLoading(s, a: PayloadAction<boolean>) { s.itemsLoading = a.payload; },
    addItem(s, a: PayloadAction<InventoryItem>) { s.items.unshift(a.payload); s.itemsCount += 1; },
    updateItemInList(s, a: PayloadAction<InventoryItem>) {
      const i = s.items.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.items[i] = a.payload;
    },
    removeItem(s, a: PayloadAction<string>) {
      s.items = s.items.filter(x => x.id !== a.payload);
      s.itemsCount -= 1;
    },

    // Transactions
    setTransactions(s, a: PayloadAction<StockTransaction[]>) { s.transactions = a.payload; },
    setTransactionsLoading(s, a: PayloadAction<boolean>) { s.transactionsLoading = a.payload; },
    addTransaction(s, a: PayloadAction<StockTransaction>) { s.transactions.unshift(a.payload); },

    // Allocations
    setAllocations(s, a: PayloadAction<{ data: ItemAllocation[]; count: number }>) {
      s.allocations = a.payload.data;
      s.allocationsCount = a.payload.count;
    },
    setAllocationsLoading(s, a: PayloadAction<boolean>) { s.allocationsLoading = a.payload; },
    addAllocation(s, a: PayloadAction<ItemAllocation>) { s.allocations.unshift(a.payload); s.allocationsCount += 1; },
    addAllocations(s, a: PayloadAction<ItemAllocation[]>) {
      s.allocations.unshift(...a.payload);
      s.allocationsCount += a.payload.length;
    },
    updateAllocationInList(s, a: PayloadAction<ItemAllocation>) {
      const i = s.allocations.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.allocations[i] = a.payload;
    },

    // Forecast
    setForecast(s, a: PayloadAction<ForecastItem[]>) { s.forecast = a.payload; },
    setForecastLoading(s, a: PayloadAction<boolean>) { s.forecastLoading = a.payload; },

    setInventoryError(s, a: PayloadAction<string>) { s.error = a.payload; },
  },
});

export const {
  setCategories, setCategoriesLoading, addCategory, updateCategoryInList, removeCategory,
  setItems, setItemsLoading, addItem, updateItemInList, removeItem,
  setTransactions, setTransactionsLoading, addTransaction,
  setAllocations, setAllocationsLoading, addAllocation, addAllocations, updateAllocationInList,
  setForecast, setForecastLoading,
  setInventoryError,
} = inventorySlice.actions;

export default inventorySlice.reducer;
```

---

## FILE 4 — CREATE `src/saga/inventorySaga.ts`

```ts
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
```

Register in root saga and store:

```ts
// root saga
import { watchInventorySaga } from "@/saga/inventorySaga";
yield fork(watchInventorySaga);

// store combineReducers
import inventoryReducer from "@/redux/slices/inventorySlice";
inventory: inventoryReducer,
```

---

## FILE 5 — CREATE `src/pages/inventory/tabs/CategoriesTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { inventoryActions } from "@/redux/actions";
import { dropdownActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setCategories, setCategoriesLoading, addCategory, updateCategoryInList, removeCategory } from "@/redux/slices/inventorySlice";
import type { ItemCategory } from "@/redux/slices/inventorySlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ConfirmDialog from "@/components/common/ConfirmDialog";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <p className="text-xs font-medium text-right">{value}</p>
    </div>
  );
}

function CategoryDetail({ item }: { item: ItemCategory }) {
  return (
    <div className="space-y-1 mt-4">
      <DetailRow label="Name"        value={item.name} />
      <DetailRow label="Branch"      value={item.branch_name} />
      <DetailRow label="Description" value={item.description || "—"} />
      <DetailRow label="Status"      value={
        item.is_active
          ? <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
          : <Badge className="bg-gray-100 text-gray-500 text-xs">Inactive</Badge>
      } />
      <DetailRow label="Created"     value={new Date(item.created_at).toLocaleString()} />
      <DetailRow label="Updated"     value={new Date(item.updated_at).toLocaleString()} />
    </div>
  );
}

const blankForm = () => ({ name: "", description: "" });

export default function CategoriesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { user } = useAuth();
  const { categories, categoriesCount, categoriesLoading } = useSelector((s: RootState) => s.inventory);

  const isSuperAdmin = user?.role === "super_admin";
  const [branches, setBranches]             = useState<{ id: string; name: string; city: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  useEffect(() => {
    if (isSuperAdmin) {
      dispatch({
        type: dropdownActions.GET_DROPDOWN,
        method: "GET",
        endPoint: "/api/v1/batches/dropdowns/",
        auth: true,
        getResponse: (res: any) => {
          const data = res?.data || res;
          if (data?.branches) setBranches(data.branches);
        },
        getError: () => {},
      });
    }
  }, [isSuperAdmin]);

  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerItem, setDrawerItem]       = useState<ItemCategory | null>(null);
  const [createOpen, setCreateOpen]       = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen]           = useState(false);
  const [editTarget, setEditTarget]       = useState<ItemCategory | null>(null);
  const [editLoading, setEditLoading]     = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState<ItemCategory | null>(null);
  const [form, setForm]                   = useState(blankForm());

  useEffect(() => {
    dispatch({
      type: inventoryActions.GET_CATEGORIES,
      method: "GET",
      endPoint: API.INVENTORY.CATEGORIES,
      auth: true,
      setLoading: (v: boolean) => dispatch(setCategoriesLoading(v)),
      getResponse: (res: any) => {
        const data  = Array.isArray(res?.results) ? res.results : (Array.isArray(res?.data) ? res.data : []);
        const count = res?.count ?? data.length;
        dispatch(setCategories({ data, count }));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load categories"),
    });
  }, []);

  const handleCreate = () => {
    const body: any = { ...form };
    if (isSuperAdmin && selectedBranch) body.branch = selectedBranch;
    dispatch({
      type: inventoryActions.CREATE_CATEGORY,
      method: "POST",
      endPoint: API.INVENTORY.CATEGORIES,
      body,
      auth: true,
      setLoading: (v: boolean) => setCreateLoading(v),
      getResponse: (res: any) => {
        const created = res?.data ?? res;
        if (created?.id) {
          dispatch(addCategory(created));
          toast.success("Category created.");
          setCreateOpen(false);
          setForm(blankForm());
        } else toast.error("Failed to create category.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create category"),
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: inventoryActions.UPDATE_CATEGORY,
      method: "PATCH",
      endPoint: API.INVENTORY.CATEGORY_DETAIL(editTarget.id),
      body: { name: editTarget.name, description: editTarget.description },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        const updated = res?.data ?? res;
        if (updated?.id) { dispatch(updateCategoryInList(updated)); toast.success("Category updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update category"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: inventoryActions.DELETE_CATEGORY,
      method: "DELETE",
      endPoint: API.INVENTORY.CATEGORY_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeCategory(deleteTarget.id)); toast.success("Category deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete category"),
    });
  };

  return (
    <div className="space-y-4">
      {isSuperAdmin && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Label className="text-xs whitespace-nowrap font-medium">Branch *</Label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="h-9 text-sm w-56"><SelectValue placeholder="Select Branch" /></SelectTrigger>
            <SelectContent>
              {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} — {b.city}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-blue-600">Required for super admin operations</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{categoriesCount} categor{categoriesCount === 1 ? "y" : "ies"}</p>
        <Button onClick={() => { setForm(blankForm()); setCreateOpen(true); }}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {categoriesLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Name", "Branch", "Description", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No categories found.</td></tr>
              ) : categories.map((cat, i) => (
                <motion.tr key={cat.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => { setDrawerItem(cat); setDrawerOpen(true); }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cat.branch_name}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{cat.description || "—"}</td>
                  <td className="px-4 py-3">
                    {cat.is_active
                      ? <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                      : <Badge className="bg-gray-100 text-gray-500 text-xs">Inactive</Badge>}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7"
                        onClick={() => { setEditTarget(cat); setEditOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7"
                        onClick={() => setDeleteTarget(cat)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Category Details</SheetTitle></SheetHeader>
          {drawerItem && <CategoryDetail item={drawerItem} />}
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Category Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Uniforms" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Optional description..." className="text-sm resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreate}
              disabled={createLoading || !form.name.trim() || (isSuperAdmin && !selectedBranch)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {createLoading ? "Creating…" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs mb-1 block">Category Name *</Label>
                <Input value={editTarget.name}
                  onChange={e => setEditTarget(p => p ? { ...p, name: e.target.value } : null)}
                  className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Description</Label>
                <Textarea value={editTarget.description}
                  onChange={e => setEditTarget(p => p ? { ...p, description: e.target.value } : null)}
                  rows={3} className="text-sm resize-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading || !editTarget?.name.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete category "${deleteTarget?.name}"?`}
        description="This will permanently delete the category."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

---

## FILE 6 — CREATE `src/pages/inventory/tabs/ItemsTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, PackagePlus, Search, AlertTriangle } from "lucide-react";
import { inventoryActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setItems, setItemsLoading, addItem, updateItemInList, removeItem, addTransaction } from "@/redux/slices/inventorySlice";
import type { InventoryItem } from "@/redux/slices/inventorySlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const TRANSACTION_TYPES = [
  { value: "purchase",   label: "Purchase / Inward" },
  { value: "damage",     label: "Damaged / Lost" },
  { value: "adjustment", label: "Manual Adjustment" },
];

function StockBadge({ stock, reorder }: { stock: number; reorder: number }) {
  if (stock <= 0)       return <Badge className="bg-red-100 text-red-700 text-xs">Out of Stock</Badge>;
  if (stock <= reorder) return <Badge className="bg-yellow-100 text-yellow-700 text-xs gap-1"><AlertTriangle className="w-3 h-3" />Low Stock</Badge>;
  return <Badge className="bg-green-100 text-green-700 text-xs">In Stock</Badge>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <p className="text-xs font-medium text-right">{value}</p>
    </div>
  );
}

function ItemDetail({ item }: { item: InventoryItem }) {
  return (
    <div className="space-y-1 mt-4">
      <DetailRow label="Name"          value={item.name} />
      <DetailRow label="SKU"           value={<span className="font-mono">{item.sku}</span>} />
      <DetailRow label="Category"      value={item.category_name} />
      <DetailRow label="Size"          value={item.size || "—"} />
      <DetailRow label="Description"   value={item.description || "—"} />
      <DetailRow label="Unit Price"    value={`₹${item.unit_price}`} />
      <DetailRow label="Total Stock"   value={<span className="font-bold">{item.total_stock}</span>} />
      <DetailRow label="Reorder Level" value={item.reorder_level} />
      <DetailRow label="Stock Status"  value={<StockBadge stock={item.total_stock} reorder={item.reorder_level} />} />
      <DetailRow label="Active"        value={
        item.is_active
          ? <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
          : <Badge className="bg-gray-100 text-gray-500 text-xs">Inactive</Badge>
      } />
      <DetailRow label="Created"       value={new Date(item.created_at).toLocaleString()} />
    </div>
  );
}

const blankItemForm = () => ({
  category: "", name: "", sku: "", description: "",
  size: "", reorder_level: "", unit_price: "",
});
const blankTxnForm = () => ({
  transaction_type: "purchase", quantity: "", unit_price: "", reference: "", notes: "",
});

export default function ItemsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { items, itemsCount, itemsLoading, categories } = useSelector((s: RootState) => s.inventory);

  const [search, setSearch]                 = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [drawerItem, setDrawerItem]         = useState<InventoryItem | null>(null);
  const [drawerLoading, setDrawerLoading]   = useState(false);

  const [createOpen, setCreateOpen]         = useState(false);
  const [createLoading, setCreateLoading]   = useState(false);
  const [editOpen, setEditOpen]             = useState(false);
  const [editTarget, setEditTarget]         = useState<InventoryItem | null>(null);
  const [editLoading, setEditLoading]       = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState<InventoryItem | null>(null);
  const [form, setForm]                     = useState(blankItemForm());

  const [stockTarget, setStockTarget]       = useState<InventoryItem | null>(null);
  const [stockOpen, setStockOpen]           = useState(false);
  const [stockLoading, setStockLoading]     = useState(false);
  const [txnForm, setTxnForm]               = useState(blankTxnForm());

  const fetchItems = () => {
    const params = new URLSearchParams();
    if (categoryFilter) params.append("category", categoryFilter);
    if (search)         params.append("search", search);
    const endPoint = `${API.INVENTORY.ITEMS}${params.toString() ? "?" + params.toString() : ""}`;
    dispatch({
      type: inventoryActions.GET_ITEMS,
      method: "GET",
      endPoint,
      auth: true,
      setLoading: (v: boolean) => dispatch(setItemsLoading(v)),
      getResponse: (res: any) => {
        const data  = Array.isArray(res?.results) ? res.results : (Array.isArray(res?.data) ? res.data : []);
        const count = res?.count ?? data.length;
        dispatch(setItems({ data, count }));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load items"),
    });
  };

  useEffect(() => { fetchItems(); }, [categoryFilter]);

  const handleRowClick = (item: InventoryItem) => {
    setDrawerOpen(true);
    setDrawerItem(null);
    setDrawerLoading(true);
    dispatch({
      type: inventoryActions.GET_ITEM_DETAIL,
      method: "GET",
      endPoint: API.INVENTORY.ITEM_DETAIL(item.id),
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data ?? res;
        setDrawerItem(data?.id ? data : item);
        setDrawerLoading(false);
      },
      getError: () => { setDrawerItem(item); setDrawerLoading(false); },
    });
  };

  const handleCreate = () => {
    dispatch({
      type: inventoryActions.CREATE_ITEM,
      method: "POST",
      endPoint: API.INVENTORY.ITEMS,
      body: { ...form, reorder_level: Number(form.reorder_level) },
      auth: true,
      setLoading: (v: boolean) => setCreateLoading(v),
      getResponse: (res: any) => {
        const created = res?.data ?? res;
        if (created?.id) {
          dispatch(addItem(created));
          toast.success("Item created.");
          setCreateOpen(false);
          setForm(blankItemForm());
        } else toast.error("Failed to create item.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create item"),
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: inventoryActions.UPDATE_ITEM,
      method: "PATCH",
      endPoint: API.INVENTORY.ITEM_DETAIL(editTarget.id),
      body: {
        name: editTarget.name, description: editTarget.description,
        size: editTarget.size, reorder_level: editTarget.reorder_level,
        unit_price: editTarget.unit_price,
      },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        const updated = res?.data ?? res;
        if (updated?.id) { dispatch(updateItemInList(updated)); toast.success("Item updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update item"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: inventoryActions.DELETE_ITEM,
      method: "DELETE",
      endPoint: API.INVENTORY.ITEM_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeItem(deleteTarget.id)); toast.success("Item deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete item"),
    });
  };

  const handleAddStock = () => {
    if (!stockTarget) return;
    dispatch({
      type: inventoryActions.CREATE_TRANSACTION,
      method: "POST",
      endPoint: API.INVENTORY.TRANSACTIONS,
      body: {
        item:             stockTarget.id,
        transaction_type: txnForm.transaction_type,
        quantity:         Number(txnForm.quantity),
        ...(txnForm.unit_price  ? { unit_price:  txnForm.unit_price }  : {}),
        ...(txnForm.reference   ? { reference:   txnForm.reference }   : {}),
        ...(txnForm.notes       ? { notes:       txnForm.notes }       : {}),
      },
      auth: true,
      setLoading: (v: boolean) => setStockLoading(v),
      getResponse: (res: any) => {
        const txn = res?.data ?? res;
        if (txn?.id) {
          dispatch(addTransaction(txn));
          toast.success("Stock transaction recorded.");
          setStockOpen(false);
          setTxnForm(blankTxnForm());
          fetchItems(); // refresh total_stock
        } else toast.error("Failed to record transaction.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to record transaction"),
    });
  };

  const filtered = items.filter(item => {
    if (!search) return true;
    return item.name?.toLowerCase().includes(search.toLowerCase()) ||
           item.sku?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name / SKU..." className="pl-8 h-9 text-sm w-52"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-9 text-sm"
            onClick={() => { setSearch(""); setCategoryFilter(""); fetchItems(); }}>Clear</Button>
          <Button variant="outline" className="h-9 text-sm" onClick={fetchItems}>Search</Button>
        </div>
        <Button onClick={() => { setForm(blankItemForm()); setCreateOpen(true); }}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{itemsCount} item(s) · {filtered.length} shown</p>

      {itemsLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Name", "SKU", "Category", "Size", "Stock", "Reorder", "Price", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-muted-foreground text-sm">No items found.</td></tr>
              ) : filtered.map((item, i) => (
                <motion.tr key={item.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => handleRowClick(item)}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.category_name}</td>
                  <td className="px-4 py-3">{item.size || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${item.total_stock <= 0 ? "text-red-600" : item.total_stock <= item.reorder_level ? "text-yellow-600" : "text-green-600"}`}>
                      {item.total_stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.reorder_level}</td>
                  <td className="px-4 py-3">₹{item.unit_price}</td>
                  <td className="px-4 py-3"><StockBadge stock={item.total_stock} reorder={item.reorder_level} /></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-green-600 hover:text-green-700"
                        onClick={() => { setStockTarget(item); setTxnForm(blankTxnForm()); setStockOpen(true); }}
                        title="Record Stock Transaction">
                        <PackagePlus className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7"
                        onClick={() => { setEditTarget(item); setEditOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7"
                        onClick={() => setDeleteTarget(item)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Item Details</SheetTitle></SheetHeader>
          {drawerLoading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sm text-muted-foreground animate-pulse">Loading…</span>
            </div>
          ) : drawerItem ? <ItemDetail item={drawerItem} /> : null}
        </SheetContent>
      </Sheet>

      {/* Create Item Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Item Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Uniform Shirt" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">SKU *</Label>
                <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="e.g. UNI-SHT-M" className="h-9 text-sm font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Size</Label>
                <Input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                  placeholder="S / M / L" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Reorder Level *</Label>
                <Input type="number" value={form.reorder_level}
                  onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))}
                  placeholder="10" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Unit Price (₹) *</Label>
                <Input type="number" step="0.01" value={form.unit_price}
                  onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))}
                  placeholder="250.00" className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Optional..." className="text-sm resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreate}
              disabled={createLoading || !form.name.trim() || !form.sku.trim() || !form.category || !form.reorder_level || !form.unit_price}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {createLoading ? "Creating…" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Item — {editTarget?.name}</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs mb-1 block">Item Name *</Label>
                <Input value={editTarget.name}
                  onChange={e => setEditTarget(p => p ? { ...p, name: e.target.value } : null)}
                  className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Size</Label>
                  <Input value={editTarget.size}
                    onChange={e => setEditTarget(p => p ? { ...p, size: e.target.value } : null)}
                    className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Reorder Level</Label>
                  <Input type="number" value={editTarget.reorder_level}
                    onChange={e => setEditTarget(p => p ? { ...p, reorder_level: Number(e.target.value) } : null)}
                    className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Unit Price (₹)</Label>
                  <Input type="number" step="0.01" value={editTarget.unit_price}
                    onChange={e => setEditTarget(p => p ? { ...p, unit_price: e.target.value } : null)}
                    className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Description</Label>
                <Textarea value={editTarget.description}
                  onChange={e => setEditTarget(p => p ? { ...p, description: e.target.value } : null)}
                  rows={2} className="text-sm resize-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading || !editTarget?.name.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={stockOpen} onOpenChange={o => { setStockOpen(o); if (!o) setStockTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Stock Transaction</DialogTitle>
            {stockTarget && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold text-foreground">{stockTarget.name}</span>
                {" "}· Current stock: <span className="font-bold">{stockTarget.total_stock}</span>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Transaction Type *</Label>
              <Select value={txnForm.transaction_type} onValueChange={v => setTxnForm(f => ({ ...f, transaction_type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {txnForm.transaction_type === "purchase"   && "➕ Increases total stock"}
                {txnForm.transaction_type === "damage"     && "➖ Decreases total stock"}
                {txnForm.transaction_type === "adjustment" && "⚙ Manual stock correction"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Quantity *</Label>
                <Input type="number" value={txnForm.quantity}
                  onChange={e => setTxnForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="100" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Unit Price (₹)</Label>
                <Input type="number" step="0.01" value={txnForm.unit_price}
                  onChange={e => setTxnForm(f => ({ ...f, unit_price: e.target.value }))}
                  placeholder="200.00" className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Reference / Invoice No.</Label>
              <Input value={txnForm.reference} onChange={e => setTxnForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="e.g. INV-10293" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Notes</Label>
              <Textarea value={txnForm.notes} onChange={e => setTxnForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Optional..." className="text-sm resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockOpen(false)} disabled={stockLoading}>Cancel</Button>
            <Button onClick={handleAddStock}
              disabled={stockLoading || !txnForm.quantity || Number(txnForm.quantity) <= 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {stockLoading ? "Recording…" : "Record Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete item "${deleteTarget?.name}"?`}
        description="This will permanently delete the item and all associated stock records."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

---

## FILE 7 — CREATE `src/pages/inventory/tabs/AllocationsTab.tsx`

This tab handles:
- List all allocations with filters (status, item, issued to)
- Single allocation — issue one item to one student or faculty
- Bulk allocation — issue multiple items to one student or faculty at once
- Return item — marks allocation as returned, auto-restores stock
- Row click → detail drawer

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, RotateCcw, Search, Users, Layers, CheckCircle2, Clock } from "lucide-react";
import { inventoryActions, userActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setAllocations, setAllocationsLoading,
  addAllocation, addAllocations, updateAllocationInList,
} from "@/redux/slices/inventorySlice";
import type { ItemAllocation, InventoryItem, UserOption } from "@/redux/slices/inventorySlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ── Types ─────────────────────────────────────────────────────────────────────

// Single allocation form
interface SingleAllocForm {
  item: string;
  recipient_type: "student" | "faculty";
  recipient_id: string;
  quantity: string;
  size: string;
  notes: string;
}

// One line in bulk allocation
interface BulkAllocLine {
  item: string;
  quantity: string;
  size: string;
  notes: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <p className="text-xs font-medium text-right">{value}</p>
    </div>
  );
}

function AllocationDetail({ item }: { item: ItemAllocation }) {
  return (
    <div className="space-y-1 mt-4">
      <DetailRow label="Item"         value={item.item_name} />
      <DetailRow label="Issued To"    value={item.student_name ?? item.faculty_name ?? "—"} />
      <DetailRow label="Type"         value={item.student ? "Student" : "Faculty"} />
      <DetailRow label="Quantity"     value={item.quantity} />
      <DetailRow label="Size"         value={item.size || "—"} />
      <DetailRow label="Status"       value={
        item.status === "issued"
          ? <Badge className="bg-blue-100 text-blue-700 text-xs">Issued</Badge>
          : <Badge className="bg-green-100 text-green-700 text-xs">Returned</Badge>
      } />
      <DetailRow label="Issued By"    value={item.issued_by_name} />
      <DetailRow label="Issued At"    value={new Date(item.issued_at).toLocaleString()} />
      {item.returned_at && (
        <DetailRow label="Returned At" value={new Date(item.returned_at).toLocaleString()} />
      )}
      {item.return_notes && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-1">Return Notes</p>
          <p className="text-xs bg-muted/30 rounded p-2">{item.return_notes}</p>
        </div>
      )}
      {item.notes && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-xs bg-muted/30 rounded p-2">{item.notes}</p>
        </div>
      )}
    </div>
  );
}

const blankSingleForm = (): SingleAllocForm => ({
  item: "", recipient_type: "student", recipient_id: "",
  quantity: "1", size: "", notes: "",
});

const blankBulkLine = (): BulkAllocLine => ({
  item: "", quantity: "1", size: "", notes: "",
});

export default function AllocationsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { allocations, allocationsCount, allocationsLoading, items } = useSelector((s: RootState) => s.inventory);

  // ── User lists ────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<UserOption[]>([]);
  const [faculty,  setFaculty]  = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    // Fetch students
    dispatch({
      type: userActions.GET_USERS,
      method: "GET",
      endPoint: "/api/auth/users/?role=student",
      auth: true,
      setLoading: (v: boolean) => setUsersLoading(v),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        setStudents(data);
      },
      getError: () => {},
    });
    // Fetch faculty
    dispatch({
      type: userActions.GET_USERS,
      method: "GET",
      endPoint: "/api/auth/users/?role=faculty",
      auth: true,
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        setFaculty(data);
      },
      getError: () => {},
    });
  }, []);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Drawer ────────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [drawerItem, setDrawerItem]     = useState<ItemAllocation | null>(null);

  // ── Issue mode toggle: "single" | "bulk" ─────────────────────────────────
  const [issueOpen, setIssueOpen]       = useState(false);
  const [issueMode, setIssueMode]       = useState<"single" | "bulk">("single");
  const [issueLoading, setIssueLoading] = useState(false);

  // Single issue form
  const [singleForm, setSingleForm] = useState<SingleAllocForm>(blankSingleForm());

  // Bulk issue form
  const [bulkRecipientType, setBulkRecipientType] = useState<"student" | "faculty">("student");
  const [bulkRecipientId,   setBulkRecipientId]   = useState("");
  const [bulkLines, setBulkLines] = useState<BulkAllocLine[]>([blankBulkLine()]);

  // ── Return confirm ────────────────────────────────────────────────────────
  const [returnTarget, setReturnTarget]   = useState<ItemAllocation | null>(null);
  const [returnNotes,  setReturnNotes]    = useState("");
  const [returnOpen,   setReturnOpen]     = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  // ── Fetch allocations ─────────────────────────────────────────────────────
  const fetchAllocations = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    if (search)       params.append("search", search);
    const endPoint = `${API.INVENTORY.ALLOCATIONS}${params.toString() ? "?" + params.toString() : ""}`;
    dispatch({
      type: inventoryActions.GET_ALLOCATIONS,
      method: "GET",
      endPoint,
      auth: true,
      setLoading: (v: boolean) => dispatch(setAllocationsLoading(v)),
      getResponse: (res: any) => {
        const data  = Array.isArray(res?.results) ? res.results : (Array.isArray(res?.data) ? res.data : []);
        const count = res?.count ?? data.length;
        dispatch(setAllocations({ data, count }));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load allocations"),
    });
  };

  useEffect(() => { fetchAllocations(); }, [statusFilter]);

  // ── Recipients helper ─────────────────────────────────────────────────────
  const recipientList = (type: "student" | "faculty") => type === "student" ? students : faculty;

  // ── Single Issue ──────────────────────────────────────────────────────────
  const handleSingleIssue = () => {
    const body: any = {
      item:     singleForm.item,
      quantity: Number(singleForm.quantity),
      status:   "issued",
      ...(singleForm.size  ? { size: singleForm.size }   : {}),
      ...(singleForm.notes ? { notes: singleForm.notes } : {}),
    };
    if (singleForm.recipient_type === "student") body.student = singleForm.recipient_id;
    else                                          body.faculty = singleForm.recipient_id;

    dispatch({
      type: inventoryActions.CREATE_ALLOCATION,
      method: "POST",
      endPoint: API.INVENTORY.ALLOCATIONS,
      body,
      auth: true,
      setLoading: (v: boolean) => setIssueLoading(v),
      getResponse: (res: any) => {
        const created = res?.data ?? res;
        if (created?.id) {
          dispatch(addAllocation(created));
          toast.success("Item issued successfully.");
          setIssueOpen(false);
          setSingleForm(blankSingleForm());
        } else toast.error("Failed to issue item.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to issue item"),
    });
  };

  // ── Bulk Issue ────────────────────────────────────────────────────────────
  const handleBulkIssue = () => {
    const body: any = {
      allocations: bulkLines.map(line => ({
        item:     line.item,
        quantity: Number(line.quantity),
        ...(line.size  ? { size: line.size }   : {}),
        ...(line.notes ? { notes: line.notes } : {}),
      })),
    };
    if (bulkRecipientType === "student") body.student = bulkRecipientId;
    else                                  body.faculty = bulkRecipientId;

    dispatch({
      type: inventoryActions.BULK_ALLOCATION,
      method: "POST",
      endPoint: API.INVENTORY.ALLOCATION_BULK,
      body,
      auth: true,
      setLoading: (v: boolean) => setIssueLoading(v),
      getResponse: (res: any) => {
        // Bulk returns an array of created allocations
        const created = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        if (created.length > 0) {
          dispatch(addAllocations(created));
          toast.success(`${created.length} item(s) issued successfully.`);
          setIssueOpen(false);
          setBulkLines([blankBulkLine()]);
          setBulkRecipientId("");
        } else toast.error("Failed to issue items.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to issue items"),
    });
  };

  // ── Return Item ───────────────────────────────────────────────────────────
  const handleReturn = () => {
    if (!returnTarget) return;
    dispatch({
      type: inventoryActions.RETURN_ALLOCATION,
      method: "POST",
      endPoint: API.INVENTORY.ALLOCATION_RETURN(returnTarget.id),
      body: { return_notes: returnNotes },
      auth: true,
      setLoading: (v: boolean) => setReturnLoading(v),
      getResponse: () => {
        // Backend returns { status: "Item returned successfully." }
        // Update local allocation status
        const updated: ItemAllocation = {
          ...returnTarget,
          status: "returned",
          status_display: "Returned",
          returned_at: new Date().toISOString(),
          return_notes: returnNotes,
        };
        dispatch(updateAllocationInList(updated));
        toast.success("Item returned successfully. Stock restored.");
        setReturnOpen(false);
        setReturnTarget(null);
        setReturnNotes("");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to return item"),
    });
  };

  // ── Bulk line helpers ─────────────────────────────────────────────────────
  const addBulkLine = () => setBulkLines(prev => [...prev, blankBulkLine()]);
  const removeBulkLine = (idx: number) => setBulkLines(prev => prev.filter((_, i) => i !== idx));
  const updateBulkLine = (idx: number, key: keyof BulkAllocLine, value: string) => {
    setBulkLines(prev => prev.map((l, i) => i === idx ? { ...l, [key]: value } : l));
  };

  const filtered = allocations.filter(a => {
    if (!search) return true;
    return (a.student_name ?? a.faculty_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
           a.item_name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name / item..." className="pl-8 h-9 text-sm w-52"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-9 text-sm"
            onClick={() => { setSearch(""); setStatusFilter(""); fetchAllocations(); }}>Clear</Button>
          <Button variant="outline" className="h-9 text-sm" onClick={fetchAllocations}>Search</Button>
        </div>
        <Button onClick={() => { setIssueOpen(true); setIssueMode("single"); setSingleForm(blankSingleForm()); setBulkLines([blankBulkLine()]); setBulkRecipientId(""); }}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Issue Item
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{allocationsCount} allocation(s) · {filtered.length} shown</p>

      {/* Table */}
      {allocationsLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Item", "Issued To", "Type", "Qty", "Size", "Status", "Issued At", "Issued By", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-muted-foreground text-sm">No allocations found.</td></tr>
              ) : filtered.map((alloc, i) => (
                <motion.tr key={alloc.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => { setDrawerItem(alloc); setDrawerOpen(true); }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium">{alloc.item_name}</td>
                  <td className="px-4 py-3">{alloc.student_name ?? alloc.faculty_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${alloc.student ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {alloc.student ? "Student" : "Faculty"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{alloc.quantity}</td>
                  <td className="px-4 py-3">{alloc.size || "—"}</td>
                  <td className="px-4 py-3">
                    {alloc.status === "issued"
                      ? <Badge className="bg-blue-100 text-blue-700 text-xs gap-1"><Clock className="w-3 h-3" />Issued</Badge>
                      : <Badge className="bg-green-100 text-green-700 text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Returned</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(alloc.issued_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{alloc.issued_by_name}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {alloc.status === "issued" && (
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-orange-500 hover:text-orange-600"
                        onClick={() => { setReturnTarget(alloc); setReturnNotes(""); setReturnOpen(true); }}
                        title="Return Item">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Allocation Details</SheetTitle></SheetHeader>
          {drawerItem && <AllocationDetail item={drawerItem} />}
        </SheetContent>
      </Sheet>

      {/* Issue Dialog — single + bulk tabs */}
      <Dialog open={issueOpen} onOpenChange={o => setIssueOpen(o)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Issue Item(s)</DialogTitle></DialogHeader>

          {/* Mode toggle */}
          <div className="flex gap-2 pt-1">
            <Button
              variant={issueMode === "single" ? "default" : "outline"}
              size="sm"
              className={`gap-1.5 ${issueMode === "single" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setIssueMode("single")}>
              <Users className="w-3.5 h-3.5" /> Single Issue
            </Button>
            <Button
              variant={issueMode === "bulk" ? "default" : "outline"}
              size="sm"
              className={`gap-1.5 ${issueMode === "bulk" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setIssueMode("bulk")}>
              <Layers className="w-3.5 h-3.5" /> Bulk Issue
            </Button>
          </div>

          {/* ── SINGLE ISSUE ── */}
          {issueMode === "single" && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs mb-1 block">Item *</Label>
                <Select value={singleForm.item} onValueChange={v => setSingleForm(f => ({ ...f, item: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>
                    {items.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} {item.size ? `(${item.size})` : ""} — Stock: {item.total_stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Issue To *</Label>
                  <Select value={singleForm.recipient_type}
                    onValueChange={(v: "student" | "faculty") => setSingleForm(f => ({ ...f, recipient_type: v, recipient_id: "" }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">
                    {singleForm.recipient_type === "student" ? "Student" : "Faculty"} *
                  </Label>
                  <Select value={singleForm.recipient_id}
                    onValueChange={v => setSingleForm(f => ({ ...f, recipient_id: v }))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={`Select ${singleForm.recipient_type}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {recipientList(singleForm.recipient_type).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Quantity *</Label>
                  <Input type="number" value={singleForm.quantity}
                    onChange={e => setSingleForm(f => ({ ...f, quantity: e.target.value }))}
                    min="1" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Size</Label>
                  <Input value={singleForm.size} onChange={e => setSingleForm(f => ({ ...f, size: e.target.value }))}
                    placeholder="S / M / L" className="h-9 text-sm" />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Notes</Label>
                <Textarea value={singleForm.notes} onChange={e => setSingleForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Optional notes..." className="text-sm resize-none" />
              </div>
            </div>
          )}

          {/* ── BULK ISSUE ── */}
          {issueMode === "bulk" && (
            <div className="space-y-4 py-2">
              {/* Recipient selection */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-xs mb-1 block">Issue To *</Label>
                  <Select value={bulkRecipientType}
                    onValueChange={(v: "student" | "faculty") => { setBulkRecipientType(v); setBulkRecipientId(""); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">
                    {bulkRecipientType === "student" ? "Student" : "Faculty"} *
                  </Label>
                  <Select value={bulkRecipientId} onValueChange={setBulkRecipientId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={`Select ${bulkRecipientType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {recipientList(bulkRecipientType).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Item lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Items to Issue *</Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addBulkLine}>
                    <Plus className="w-3 h-3" /> Add Item
                  </Button>
                </div>

                {bulkLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 border border-border rounded-lg">
                    {/* Item select — 5 cols */}
                    <div className="col-span-5">
                      {idx === 0 && <Label className="text-xs mb-1 block">Item</Label>}
                      <Select value={line.item} onValueChange={v => updateBulkLine(idx, "item", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select item" /></SelectTrigger>
                        <SelectContent>
                          {items.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} {item.size ? `(${item.size})` : ""} — {item.total_stock}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Qty — 2 cols */}
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs mb-1 block">Qty</Label>}
                      <Input type="number" value={line.quantity}
                        onChange={e => updateBulkLine(idx, "quantity", e.target.value)}
                        min="1" className="h-8 text-xs" />
                    </div>
                    {/* Size — 2 cols */}
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs mb-1 block">Size</Label>}
                      <Input value={line.size} onChange={e => updateBulkLine(idx, "size", e.target.value)}
                        placeholder="M" className="h-8 text-xs" />
                    </div>
                    {/* Notes — 2 cols */}
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs mb-1 block">Notes</Label>}
                      <Input value={line.notes} onChange={e => updateBulkLine(idx, "notes", e.target.value)}
                        placeholder="Optional" className="h-8 text-xs" />
                    </div>
                    {/* Remove — 1 col */}
                    <div className="col-span-1">
                      {bulkLines.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"
                          onClick={() => removeBulkLine(idx)}>
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
                ℹ All items will be issued atomically — if any item fails, none will be issued.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueOpen(false)} disabled={issueLoading}>Cancel</Button>
            <Button
              onClick={issueMode === "single" ? handleSingleIssue : handleBulkIssue}
              disabled={
                issueLoading ||
                (issueMode === "single" && (!singleForm.item || !singleForm.recipient_id || !singleForm.quantity)) ||
                (issueMode === "bulk"   && (!bulkRecipientId || bulkLines.some(l => !l.item || !l.quantity)))
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {issueLoading
                ? "Issuing…"
                : issueMode === "bulk"
                  ? `Issue ${bulkLines.length} Item(s)`
                  : "Issue Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Confirm Dialog */}
      <Dialog open={returnOpen} onOpenChange={o => { setReturnOpen(o); if (!o) { setReturnTarget(null); setReturnNotes(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return Item</DialogTitle>
            {returnTarget && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold text-foreground">{returnTarget.item_name}</span>
                {" "}issued to{" "}
                <span className="font-semibold text-foreground">{returnTarget.student_name ?? returnTarget.faculty_name}</span>
              </p>
            )}
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs mb-1 block">Return Notes</Label>
            <Textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)}
              rows={3} placeholder="e.g. Returned in good condition. Student transferred."
              className="text-sm resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReturnOpen(false); setReturnTarget(null); setReturnNotes(""); }}
              disabled={returnLoading}>Cancel</Button>
            <Button onClick={handleReturn} disabled={returnLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white">
              {returnLoading ? "Processing…" : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## FILE 8 — CREATE `src/pages/inventory/tabs/ForecastTab.tsx`

```tsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { TrendingDown, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { inventoryActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setForecast, setForecastLoading } from "@/redux/slices/inventorySlice";
import type { ForecastItem } from "@/redux/slices/inventorySlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/common/Skeletons";

const FORECAST_STATUS = {
  healthy:  { badge: "bg-green-100 text-green-700",   icon: CheckCircle2,  label: "Healthy" },
  warning:  { badge: "bg-yellow-100 text-yellow-700", icon: AlertTriangle,  label: "Warning" },
  critical: { badge: "bg-red-100 text-red-700",       icon: TrendingDown,   label: "Critical" },
};

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-border p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export default function ForecastTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { forecast, forecastLoading } = useSelector((s: RootState) => s.inventory);

  const fetchForecast = () => {
    dispatch({
      type: inventoryActions.GET_FORECAST,
      method: "GET",
      endPoint: API.INVENTORY.FORECAST,
      auth: true,
      setLoading: (v: boolean) => dispatch(setForecastLoading(v)),
      getResponse: (res: any) => {
        // Forecast returns a plain array — not paginated
        const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        dispatch(setForecast(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load forecast"),
    });
  };

  useEffect(() => { fetchForecast(); }, []);

  const critical = forecast.filter(f => f.status === "critical").length;
  const warning  = forecast.filter(f => f.status === "warning").length;
  const healthy  = forecast.filter(f => f.status === "healthy").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">30-Day Stock Forecast</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Based on last 30 days of allocations.</p>
        </div>
        <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={fetchForecast} disabled={forecastLoading}>
          <RefreshCw className={`w-3.5 h-3.5 ${forecastLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {!forecastLoading && forecast.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Critical Items" value={critical} sub="Stockout in 30 days"     color="text-red-600" />
          <StatCard label="Warning Items"  value={warning}  sub="Near reorder level"       color="text-yellow-600" />
          <StatCard label="Healthy Items"  value={healthy}  sub="Sufficient stock"         color="text-green-600" />
        </div>
      )}

      {forecastLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Item", "SKU", "Category", "Stock", "Reorder", "30d Usage", "Burn/day", "Days Left", "Status", "Message"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecast.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground text-sm">No forecast data. Add items and allocations first.</td></tr>
              ) : (
                [...forecast]
                  .sort((a, b) => ({ critical: 0, warning: 1, healthy: 2 }[a.status] - { critical: 0, warning: 1, healthy: 2 }[b.status]))
                  .map((f, i) => {
                    const cfg  = FORECAST_STATUS[f.status] ?? FORECAST_STATUS.healthy;
                    const Icon = cfg.icon;
                    return (
                      <motion.tr key={f.item_id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{f.item_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.sku}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.category}</td>
                        <td className="px-4 py-3 font-bold">
                          <span className={f.current_stock <= 0 ? "text-red-600" : f.current_stock <= f.reorder_level ? "text-yellow-600" : "text-green-600"}>
                            {f.current_stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{f.reorder_level}</td>
                        <td className="px-4 py-3">{f.last_30d_usage}</td>
                        <td className="px-4 py-3">{f.daily_burn_rate.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={f.days_until_stockout <= 7 ? "text-red-600 font-bold" : f.days_until_stockout <= 30 ? "text-yellow-600 font-semibold" : "text-green-600"}>
                            {f.days_until_stockout > 365 ? "365+" : f.days_until_stockout}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${cfg.badge} text-xs gap-1`}>
                            <Icon className="w-3 h-3" /> {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-xs text-muted-foreground">{f.message}</p>
                        </td>
                      </motion.tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## FILE 9 — CREATE `src/pages/inventory/InventoryPage.tsx`

```tsx
import { useEffect } from "react";
import { useUI } from "@/hooks/useUI";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import ItemsTab       from "./tabs/ItemsTab";
import CategoriesTab  from "./tabs/CategoriesTab";
import AllocationsTab from "./tabs/AllocationsTab";
import ForecastTab    from "./tabs/ForecastTab";

const TABS = [
  { value: "items",       label: "Items" },
  { value: "allocations", label: "Allocations" },
  { value: "categories",  label: "Categories" },
  { value: "forecast",    label: "Forecast" },
];

export default function InventoryPage() {
  const { setPageTitle } = useUI();

  useEffect(() => {
    setPageTitle("Inventory Management");
  }, [setPageTitle]);

  return (
    <div className="space-y-5">
      <Tabs defaultValue="items">
        <TabsList className="flex-wrap gap-1 h-auto p-1">
          {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <ItemsTab />
        </TabsContent>

        <TabsContent value="allocations" className="mt-4">
          <AllocationsTab />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>

        <TabsContent value="forecast" className="mt-4">
          <ForecastTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## CHECKLIST

- [ ] Add `inventoryActions` to `src/redux/actions/index.ts`
- [ ] Add `API.INVENTORY` block to `src/service/api.ts`
- [ ] Add `inventory: inventoryReducer` to store `combineReducers`
- [ ] Register `watchInventorySaga` in root saga with `yield fork(watchInventorySaga)`
- [ ] Add route: `<Route path="/inventory" element={<InventoryPage />} />`
- [ ] Add nav item for Inventory in sidebar config
- [ ] Ensure `UserOption` type is exported from `inventorySlice.ts` (used in AllocationsTab)

---

## KEY IMPLEMENTATION NOTES

- **`total_stock` is read-only** — never send in POST/PATCH. Auto-calculated by backend on every transaction and allocation.
- **`branch` field in category POST** — only for `super_admin`. All other roles omit it.
- **Transaction types in Add Stock dialog** — only `purchase`, `damage`, `adjustment`. Never `allocation` or `return` (backend creates those automatically).
- **After stock transaction** — always call `fetchItems()` to refresh `total_stock`.
- **Forecast API** — returns a plain array, not paginated. Check `Array.isArray(res)` first.
- **Forecast table** — sorted critical → warning → healthy.
- **Single issue** — body has either `student` or `faculty` key (never both). `status: "issued"` always hardcoded.
- **Bulk issue** — `POST /allocations/bulk_issue/` — body is `{ student/faculty: uuid, allocations: [{ item, quantity, size?, notes? }] }`. Response is an array of created allocation objects.
- **Return item** — `POST /allocations/<id>/return_item/` — body is `{ return_notes: string }`. Response is `{ status: "Item returned successfully." }` (not the updated allocation object), so update Redux state manually using `updateAllocationInList` with a locally constructed updated object.
- **Users API** — `GET /api/auth/users/?role=student` and `?role=faculty` separately. Response shape: `{ success, count, data: [...] }`.
- **Category dropdown in ItemsTab** — uses `categories` from Redux state directly. Make sure CategoriesTab fetches on mount OR fetch categories inside ItemsTab too.
- **Row click → Sheet drawer** on all tables. `e.stopPropagation()` on all action button cells.
- **Bulk line remove button** — only shown when `bulkLines.length > 1` to prevent removing all lines.
- **Issue dialog disable logic** — single: requires `item + recipient_id + quantity`. Bulk: requires `bulkRecipientId + every line has item + quantity`.



Here are the specific lines and fields that were removed from the API documentation payloads:
 
**1. Items API (`/items/`)**
*   Removed `"sku": "UNI-SHT-M"` from the *List Items* `GET` response payload.
*   Removed `"sku": "UNI-SHT-M"` from the *Create Item* `POST` request payload.
 
**2. Stock Transactions API (`/transactions/`)**
*   Removed `"unit_price": "200.00"` from the *Add New Stock* `POST` request payload.
 
**3. Item Allocations API (`/allocations/`)**
*   Removed `"size": "M"` and `"size": "L"` from the *Issue an Item* `POST` request payloads (both Student and Faculty versions).
*   Removed `"size": "M"` from the *Issue an Item* `POST` response payload.
 
**4. Bulk Allocations API (`/allocations/bulk_issue/`)**
*   Removed `"size": "M"` and `"size": ""` from the individual items inside the `"allocations"` array in the `POST` request payload.
 
**5. Dynamic Forecasting API (`/forecast/`)**
*   Removed `"sku": "UNI-SHT-M"` and `"sku": "BOK-MTH-10"` from the items returned in the `GET` response payload.