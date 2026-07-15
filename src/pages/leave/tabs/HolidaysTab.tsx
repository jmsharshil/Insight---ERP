import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { leaveActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setHolidays, setHolidaysLoading, addHoliday, updateHolidayInList, removeHoliday } from "@/redux/slices/leaveSlice";
import type { PublicHoliday } from "@/redux/slices/leaveSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { dropdownActions } from "@/redux/actions";
import ConfirmDialog from "@/components/common/ConfirmDialog";


function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <p className="text-xs font-medium text-right">{value}</p>
    </div>
  );
}

function HolidayDetail({ item }: { item: PublicHoliday }) {
  return (
    <div className="space-y-3 mt-4 text-sm">
      
      <DetailRow label="Name"       value={item.name} />
      <DetailRow label="Date"       value={item.date} />
      <DetailRow label="Year"       value={String(item.year)} />
      <DetailRow label="Created At" value={new Date(item.created_at).toLocaleString()} />
    </div>
  );
}

export default function HolidaysTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { holidays, holidaysLoading } = useSelector((s: RootState) => s.leave);

  const [yearFilter, setYearFilter]   = useState(String(new Date().getFullYear()));
  const [createOpen, setCreateOpen]   = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<PublicHoliday | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PublicHoliday | null>(null);
  const [form, setForm]               = useState({ name: "", date: "" });

  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [branches, setBranches] = useState<{ id: string; name: string; city: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerItem, setDrawerItem]       = useState<PublicHoliday | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

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
  }, [isSuperAdmin, dispatch]);

  const handleRowClick = (holiday: PublicHoliday) => {
    setDrawerOpen(true);
    setDrawerItem(null);
    setDrawerLoading(true);
    dispatch({
      type: leaveActions.GET_HOLIDAY_DETAIL,
      method: "GET",
      endPoint: API.LEAVE.HOLIDAY_DETAIL(holiday.id),
      auth: true,
      getResponse: (res: any) => { setDrawerItem(res?.data ?? null); setDrawerLoading(false); },
      getError: (err: any) => { toast.error(err?.response?.data?.message || "Failed to load details"); setDrawerLoading(false); },
    });
  };


  const fetchHolidays = () => {
    const params = yearFilter ? `?year=${yearFilter}` : "";
    dispatch({
      type: leaveActions.GET_HOLIDAYS,
      method: "GET",
      endPoint: `${API.LEAVE.HOLIDAYS}${params}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setHolidaysLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        dispatch(setHolidays(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load holidays"),
    });
  };

  useEffect(() => { fetchHolidays(); }, [yearFilter]);

  const handleCreate = () => {
    dispatch({
      type: leaveActions.CREATE_HOLIDAY,
      method: "POST",
      endPoint: API.LEAVE.HOLIDAYS,
      body: {
        ...form,
        ...(isSuperAdmin && selectedBranch ? { branch_id: selectedBranch } : {}),
      },
      auth: true,
      setLoading: (v: boolean) => setCreateLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addHoliday(res.data));
          toast.success("Holiday created.");
          setCreateOpen(false);
          setForm({ name: "", date: "" });
        } else toast.error("Failed to create holiday.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create holiday"),
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: leaveActions.UPDATE_HOLIDAY,
      method: "PATCH",
      endPoint: API.LEAVE.HOLIDAY_DETAIL(editTarget.id),
      body: { name: editTarget.name, date: editTarget.date },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateHolidayInList(res.data)); toast.success("Holiday updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update holiday"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: leaveActions.DELETE_HOLIDAY,
      method: "DELETE",
      endPoint: API.LEAVE.HOLIDAY_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeHoliday(deleteTarget.id)); toast.success("Holiday deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete holiday"),
    });
  };

  return (
    <div className="space-y-4">
      
      {isSuperAdmin && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Label className="text-xs whitespace-nowrap font-medium">Branch *</Label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="h-9 text-sm w-56">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name} — {b.city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-blue-600">Required for super admin context</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <Input type="number" min="0" placeholder="Year" value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="h-9 text-sm w-28" />
          <p className="text-xs text-muted-foreground">{holidays.length} holiday(s)</p>
        </div>
        <Button onClick={() => { setForm({ name: "", date: "" }); setCreateOpen(true); }}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add Holiday
        </Button>
      </div>

      {holidaysLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Branch","Holiday Name", "Date", "Year", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground text-sm">No public holidays found for this year.</td></tr>
              ) : holidays.map((h, i) => (
                <motion.tr key={h.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => handleRowClick(h)}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium">{h.branch_name || "-"}</td>
                  <td className="px-4 py-3 font-medium">{h.name}</td>
                  <td className="px-4 py-3">{h.date}</td>
                  <td className="px-4 py-3">{h.year}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(h); setEditOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(h)}>
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={o => setCreateOpen(o)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Public Holiday</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Holiday Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Independence Day" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createLoading || !form.name.trim() || !form.date || (isSuperAdmin && !selectedBranch)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {createLoading ? "Adding…" : "Add Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Holiday</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs mb-1 block">Name</Label>
                <Input value={editTarget.name} onChange={e => setEditTarget(p => p ? { ...p, name: e.target.value } : null)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Date</Label>
                <Input type="date" value={editTarget.date} onChange={e => setEditTarget(p => p ? { ...p, date: e.target.value } : null)} className="h-9 text-sm" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Holiday Details</SheetTitle></SheetHeader>
          {drawerLoading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sm text-muted-foreground animate-pulse">Loading…</span>
            </div>
          ) : drawerItem ? <HolidayDetail item={drawerItem} /> : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This public holiday will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
