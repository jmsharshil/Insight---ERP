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
