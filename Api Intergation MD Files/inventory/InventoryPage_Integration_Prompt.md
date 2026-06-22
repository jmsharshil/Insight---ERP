# InventoryPage.tsx — Full API Integration Prompt

> Copy this entire prompt and paste it into Cursor / Copilot Chat / Windsurf.
> Fully self-contained — no extra context needed.
> Item Allocation is OUT OF SCOPE for this page — handled in a separate page.

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

### branch_id Rule — CRITICAL (prevents "Branch required." errors)

```ts
// Helper — use in every POST/PATCH that accepts a branch field
const getBranchPayload = (isSuperAdmin: boolean, selectedBranch: string) => {
  if (isSuperAdmin && selectedBranch) return { branch: selectedBranch };
  return {}; // backend infers branch for all non-super_admin roles — do NOT send it
};
```

- `super_admin` → must send `branch` explicitly (picked from branch dropdown)
- All other roles → omit `branch` entirely, backend infers it automatically
- Branch list comes from: `GET /api/v1/batches/dropdowns/` → `data.branches`
- Branch shape: `{ id: string; name: string; city: string }`

### Design Tokens

- Primary orange: `#F7A900` → `bg-primary` / `text-primary`
- Surface: `#F4F5F5`, Card: `#FFFFFF`, Border: `border-border`
- Status badges: success `bg-green-100 text-green-700` | danger `bg-red-100 text-red-700` | warning `bg-yellow-100 text-yellow-700` | info `bg-blue-100 text-blue-700`

### Folder Structure to Create

```
src/pages/inventory/
  InventoryPage.tsx               ← Main page with tabs
  tabs/
    CategoriesTab.tsx             ← CRUD for item categories
    ItemsTab.tsx                  ← CRUD for items + Add Stock action per row
    ForecastTab.tsx               ← Read-only forecast dashboard
```

---

## API BASE URL

All inventory endpoints are prefixed with `/api/v1/inventory/`

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

  // Forecast
  GET_FORECAST:          "GET_INVENTORY_FORECAST",
} as const;
```

---

## FILE 2 — ADD to `src/service/api.ts`

```ts
INVENTORY: {
  // Categories
  CATEGORIES:          "/api/v1/inventory/categories/",
  CATEGORY_DETAIL:     (id: string) => `/api/v1/inventory/categories/${id}/`,

  // Items
  ITEMS:               "/api/v1/inventory/items/",
  ITEM_DETAIL:         (id: string) => `/api/v1/inventory/items/${id}/`,

  // Stock Transactions
  TRANSACTIONS:        "/api/v1/inventory/transactions/",

  // Forecast
  FORECAST:            "/api/v1/inventory/forecast/",
},
```

---

## FILE 3 — CREATE `src/redux/slices/inventorySlice.ts`

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ── Types ────────────────────────────────────────────────────────────────────

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

interface InventoryState {
  // Categories
  categories: ItemCategory[];
  categoriesCount: number;
  categoriesLoading: boolean;

  // Items
  items: InventoryItem[];
  itemsCount: number;
  itemsLoading: boolean;
  selectedItem: InventoryItem | null;

  // Transactions
  transactions: StockTransaction[];
  transactionsLoading: boolean;

  // Forecast
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
  selectedItem: null,

  transactions: [],
  transactionsLoading: false,

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
    setCategoriesLoading(s, a: PayloadAction<boolean>) {
      s.categoriesLoading = a.payload;
    },
    addCategory(s, a: PayloadAction<ItemCategory>) {
      s.categories.unshift(a.payload);
      s.categoriesCount += 1;
    },
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
    setItemsLoading(s, a: PayloadAction<boolean>) {
      s.itemsLoading = a.payload;
    },
    setSelectedItem(s, a: PayloadAction<InventoryItem | null>) {
      s.selectedItem = a.payload;
    },
    addItem(s, a: PayloadAction<InventoryItem>) {
      s.items.unshift(a.payload);
      s.itemsCount += 1;
    },
    updateItemInList(s, a: PayloadAction<InventoryItem>) {
      const i = s.items.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.items[i] = a.payload;
      if (s.selectedItem?.id === a.payload.id) s.selectedItem = a.payload;
    },
    removeItem(s, a: PayloadAction<string>) {
      s.items = s.items.filter(x => x.id !== a.payload);
      s.itemsCount -= 1;
    },

    // Transactions
    setTransactions(s, a: PayloadAction<StockTransaction[]>) {
      s.transactions = a.payload;
    },
    setTransactionsLoading(s, a: PayloadAction<boolean>) {
      s.transactionsLoading = a.payload;
    },
    addTransaction(s, a: PayloadAction<StockTransaction>) {
      s.transactions.unshift(a.payload);
    },

    // Forecast
    setForecast(s, a: PayloadAction<ForecastItem[]>) {
      s.forecast = a.payload;
    },
    setForecastLoading(s, a: PayloadAction<boolean>) {
      s.forecastLoading = a.payload;
    },

    setInventoryError(s, a: PayloadAction<string>) {
      s.error = a.payload;
    },
  },
});

export const {
  setCategories, setCategoriesLoading, addCategory, updateCategoryInList, removeCategory,
  setItems, setItemsLoading, setSelectedItem, addItem, updateItemInList, removeItem,
  setTransactions, setTransactionsLoading, addTransaction,
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
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
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

// ── Shared detail helper ──────────────────────────────────────────────────────
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
    <div className="space-y-3 mt-4">
      <DetailRow label="Name"        value={item.name} />
      <DetailRow label="Branch"      value={item.branch_name} />
      <DetailRow label="Description" value={item.description || "—"} />
      <DetailRow label="Active"      value={
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

  // ── Branch dropdown (super_admin only) ───────────────────────────────────
  const [branches, setBranches]         = useState<{ id: string; name: string; city: string }[]>([]);
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

  // ── Drawer ────────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerItem, setDrawerItem]       = useState<ItemCategory | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const handleRowClick = (cat: ItemCategory) => {
    setDrawerOpen(true);
    setDrawerItem(null);
    setDrawerLoading(true);
    // Use list data directly — no separate detail endpoint for categories
    setDrawerItem(cat);
    setDrawerLoading(false);
  };

  // ── CRUD state ────────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen]         = useState(false);
  const [createLoading, setCreateLoading]   = useState(false);
  const [editOpen, setEditOpen]             = useState(false);
  const [editTarget, setEditTarget]         = useState<ItemCategory | null>(null);
  const [editLoading, setEditLoading]       = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState<ItemCategory | null>(null);
  const [form, setForm]                     = useState(blankForm());

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch({
      type: inventoryActions.GET_CATEGORIES,
      method: "GET",
      endPoint: API.INVENTORY.CATEGORIES,
      auth: true,
      setLoading: (v: boolean) => dispatch(setCategoriesLoading(v)),
      getResponse: (res: any) => {
        const data  = Array.isArray(res?.results) ? res.results : (res?.data ?? []);
        const count = res?.count ?? data.length;
        dispatch(setCategories({ data, count }));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load categories"),
    });
  }, []);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    const body: any = { ...form };
    // ONLY send branch for super_admin — backend infers for all other roles
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

  // ── Update ────────────────────────────────────────────────────────────────
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

  // ── Delete ────────────────────────────────────────────────────────────────
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
      {/* Super admin branch selector */}
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

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{categoriesCount} categor{categoriesCount === 1 ? "y" : "ies"}</p>
        <Button onClick={() => { setForm(blankForm()); setCreateOpen(true); }}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {/* Table */}
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
                  onClick={() => handleRowClick(cat)}
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

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Category Details</SheetTitle></SheetHeader>
          {drawerLoading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sm text-muted-foreground animate-pulse">Loading…</span>
            </div>
          ) : drawerItem ? <CategoryDetail item={drawerItem} /> : null}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
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

      {/* Edit Dialog */}
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
        description="This will permanently delete the category. Items in this category may be affected."
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

Items tab includes:
- List all items with stock level indicator
- Create item (category dropdown from fetched categories)
- Edit item
- Delete item
- Row click → detail drawer
- "Add Stock" button per row → opens stock transaction dialog (purchase)

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, PackagePlus, Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import { inventoryActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setItems, setItemsLoading, setSelectedItem,
  addItem, updateItemInList, removeItem, addTransaction,
  setTransactionsLoading,
} from "@/redux/slices/inventorySlice";
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

// ── Transaction type options ──────────────────────────────────────────────────
const TRANSACTION_TYPES = [
  { value: "purchase",   label: "Purchase / Inward" },
  { value: "damage",     label: "Damaged / Lost" },
  { value: "adjustment", label: "Manual Adjustment" },
];
// Note: "allocation" and "return" are auto-created by the backend — not shown here

// ── Stock level badge ─────────────────────────────────────────────────────────
function StockBadge({ stock, reorder }: { stock: number; reorder: number }) {
  if (stock <= 0)       return <Badge className="bg-red-100 text-red-700 text-xs">Out of Stock</Badge>;
  if (stock <= reorder) return <Badge className="bg-yellow-100 text-yellow-700 text-xs gap-1"><AlertTriangle className="w-3 h-3" />Low Stock</Badge>;
  return <Badge className="bg-green-100 text-green-700 text-xs">In Stock</Badge>;
}

// ── Shared detail helper ──────────────────────────────────────────────────────
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
    <div className="space-y-3 mt-4">
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
  transaction_type: "purchase",
  quantity: "",
  unit_price: "",
  reference: "",
  notes: "",
});

export default function ItemsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { items, itemsCount, itemsLoading } = useSelector((s: RootState) => s.inventory);
  const { categories } = useSelector((s: RootState) => s.inventory);

  // ── Search/filter ─────────────────────────────────────────────────────────
  const [search, setSearch]           = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // ── Drawer ────────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerItem, setDrawerItem]       = useState<InventoryItem | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

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
        setDrawerItem(data?.id ? data : item); // fallback to list data
        setDrawerLoading(false);
      },
      getError: () => { setDrawerItem(item); setDrawerLoading(false); },
    });
  };

  // ── CRUD state ────────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen]       = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen]           = useState(false);
  const [editTarget, setEditTarget]       = useState<InventoryItem | null>(null);
  const [editLoading, setEditLoading]     = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState<InventoryItem | null>(null);
  const [form, setForm]                   = useState(blankItemForm());

  // ── Add Stock state ───────────────────────────────────────────────────────
  const [stockTarget, setStockTarget]     = useState<InventoryItem | null>(null);
  const [stockOpen, setStockOpen]         = useState(false);
  const [stockLoading, setStockLoading]   = useState(false);
  const [txnForm, setTxnForm]             = useState(blankTxnForm());

  // ── Fetch items ───────────────────────────────────────────────────────────
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
        const data  = Array.isArray(res?.results) ? res.results : (res?.data ?? []);
        const count = res?.count ?? data.length;
        dispatch(setItems({ data, count }));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load items"),
    });
  };

  useEffect(() => { fetchItems(); }, [categoryFilter]);

  // ── Create item ───────────────────────────────────────────────────────────
  const handleCreate = () => {
    dispatch({
      type: inventoryActions.CREATE_ITEM,
      method: "POST",
      endPoint: API.INVENTORY.ITEMS,
      body: {
        ...form,
        reorder_level: Number(form.reorder_level),
        unit_price: form.unit_price,
      },
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

  // ── Update item ───────────────────────────────────────────────────────────
  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: inventoryActions.UPDATE_ITEM,
      method: "PATCH",
      endPoint: API.INVENTORY.ITEM_DETAIL(editTarget.id),
      body: {
        name:          editTarget.name,
        description:   editTarget.description,
        size:          editTarget.size,
        reorder_level: editTarget.reorder_level,
        unit_price:    editTarget.unit_price,
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

  // ── Delete item ───────────────────────────────────────────────────────────
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

  // ── Add Stock (transaction) ───────────────────────────────────────────────
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
        unit_price:       txnForm.unit_price || undefined,
        reference:        txnForm.reference || undefined,
        notes:            txnForm.notes || undefined,
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
          fetchItems(); // refresh to get updated total_stock
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
      {/* Toolbar */}
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
            onClick={() => { setSearch(""); setCategoryFilter(""); fetchItems(); }}>
            Clear
          </Button>
          <Button variant="outline" className="h-9 text-sm" onClick={fetchItems}>Search</Button>
        </div>
        <Button onClick={() => { setForm(blankItemForm()); setCreateOpen(true); }}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{itemsCount} item(s) total · {filtered.length} shown</p>

      {/* Table */}
      {itemsLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Name", "SKU", "Category", "Size", "Stock", "Reorder", "Unit Price", "Status", ""].map(h => (
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
                  <td className="px-4 py-3">
                    <StockBadge stock={item.total_stock} reorder={item.reorder_level} />
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {/* Add Stock */}
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-green-600 hover:text-green-700"
                        onClick={() => { setStockTarget(item); setTxnForm(blankTxnForm()); setStockOpen(true); }}
                        title="Add Stock">
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
                Item: <span className="font-semibold text-foreground">{stockTarget.name}</span>
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
                rows={2} placeholder="Optional context..." className="text-sm resize-none" />
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

## FILE 7 — CREATE `src/pages/inventory/tabs/ForecastTab.tsx`

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

// ── Status config ─────────────────────────────────────────────────────────────
const FORECAST_STATUS = {
  healthy:  { badge: "bg-green-100 text-green-700",  icon: CheckCircle2,   label: "Healthy" },
  warning:  { badge: "bg-yellow-100 text-yellow-700", icon: AlertTriangle,  label: "Warning" },
  critical: { badge: "bg-red-100 text-red-700",       icon: TrendingDown,   label: "Critical" },
};

// ── Summary stat card ─────────────────────────────────────────────────────────
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
        // Forecast returns a plain array (not paginated)
        const data = Array.isArray(res) ? res : (res?.data ?? []);
        dispatch(setForecast(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load forecast"),
    });
  };

  useEffect(() => { fetchForecast(); }, []);

  // ── Summary counts ────────────────────────────────────────────────────────
  const critical = forecast.filter(f => f.status === "critical").length;
  const warning  = forecast.filter(f => f.status === "warning").length;
  const healthy  = forecast.filter(f => f.status === "healthy").length;

  return (
    <div className="space-y-5">
      {/* Header + refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">30-Day Stock Forecast</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Based on last 30 days of allocations. Refreshes on demand.</p>
        </div>
        <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={fetchForecast} disabled={forecastLoading}>
          <RefreshCw className={`w-3.5 h-3.5 ${forecastLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      {!forecastLoading && forecast.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Critical Items"  value={critical} sub="Stock runs out in 30 days"  color="text-red-600" />
          <StatCard label="Warning Items"   value={warning}  sub="Below or near reorder level" color="text-yellow-600" />
          <StatCard label="Healthy Items"   value={healthy}  sub="Sufficient stock"            color="text-green-600" />
        </div>
      )}

      {/* Forecast table */}
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
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground text-sm">No forecast data available. Add items and allocations to generate forecasts.</td></tr>
              ) : (
                // Sort: critical first, then warning, then healthy
                [...forecast]
                  .sort((a, b) => {
                    const order = { critical: 0, warning: 1, healthy: 2 };
                    return order[a.status] - order[b.status];
                  })
                  .map((f, i) => {
                    const cfg = FORECAST_STATUS[f.status] ?? FORECAST_STATUS.healthy;
                    const Icon = cfg.icon;
                    return (
                      <motion.tr key={f.item_id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{f.item_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.sku}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.category}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${f.current_stock <= 0 ? "text-red-600" : f.current_stock <= f.reorder_level ? "text-yellow-600" : "text-green-600"}`}>
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

## FILE 8 — CREATE `src/pages/inventory/InventoryPage.tsx`

```tsx
import { useEffect } from "react";
import { useUI } from "@/hooks/useUI";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import CategoriesTab from "./tabs/CategoriesTab";
import ItemsTab      from "./tabs/ItemsTab";
import ForecastTab   from "./tabs/ForecastTab";

const TABS = [
  { value: "items",      label: "Items" },
  { value: "categories", label: "Categories" },
  { value: "forecast",   label: "Forecast" },
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

## KEY IMPLEMENTATION NOTES

- **`total_stock` is read-only** — never send it in POST/PATCH body. It's auto-calculated by the backend on every transaction and allocation.
- **`branch` field in category POST** — only sent for `super_admin`. All other roles omit it; backend infers from user profile.
- **Item category dropdown** in the Create Item dialog is populated from the `categories` already in Redux state — no extra API call needed. Make sure `CategoriesTab` has fetched first, OR fetch categories inside `ItemsTab` as well on mount.
- **Transaction types shown in Add Stock dialog**: only `purchase`, `damage`, `adjustment`. Never show `allocation` or `return` — those are created automatically by the backend.
- **After a successful stock transaction** — always call `fetchItems()` to refresh `total_stock` values in the table.
- **Forecast API returns a plain array** (not paginated) — handle with `Array.isArray(res)` check before falling back to `res?.data`.
- **Forecast table sorted**: critical → warning → healthy for immediate visibility.
- **Row click → Sheet drawer** on Categories and Items tables. `e.stopPropagation()` on all action button cells.
- **No item allocation in this page** — that is a separate page entirely. Do not add allocation UI here.
