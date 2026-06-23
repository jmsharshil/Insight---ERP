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
  category: "", name: "", description: "",
  size: "", reorder_level: "", unit_price: "",
});
const blankTxnForm = () => ({
  transaction_type: "purchase", quantity: "", reference: "", notes: "",
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
    return item.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name..." className="pl-8 h-9 text-sm w-52"
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
                {["Name", "Category", "Size", "Stock", "Reorder", "Price", "Status", ""].map(h => (
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
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Item Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Uniform Shirt" className="h-9 text-sm" />
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
              disabled={createLoading || !form.name.trim() || !form.category || !form.reorder_level || !form.unit_price}
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
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Quantity *</Label>
                <Input type="number" value={txnForm.quantity}
                  onChange={e => setTxnForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="100" className="h-9 text-sm" />
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
