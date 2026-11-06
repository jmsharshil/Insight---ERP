import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  FileSpreadsheet,
  Upload,
  Download,
  Building2,
  Info,
  CheckCircle2,
  Search,
  X,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { leaveActions, dropdownActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setHolidays,
  setHolidaysLoading,
  addHoliday,
  updateHolidayInList,
  removeHoliday,
  type PublicHoliday,
} from "@/redux/slices/leaveSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { downloadExcel } from "@/lib/exportUtils";
import { axiosRequest } from "@/service/axiosRequest";

const MONTHS = [
  { value: "all", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40 last:border-0">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <p className="text-xs font-medium text-right text-foreground">{value || "—"}</p>
    </div>
  );
}

function HolidayDetail({ item }: { item: PublicHoliday }) {
  return (
    <div className="space-y-3 mt-4 text-sm">
      <DetailRow label="Holiday Name" value={item.name} />
      <DetailRow label="Date" value={item.date} />
      <DetailRow label="Year" value={String(item.year)} />
      <DetailRow label="Branch" value={item.branch_name || item.branch || "All Branches (Global)"} />
      <DetailRow label="Description" value={item.description || "None provided"} />
      <DetailRow
        label="Created At"
        value={item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
      />
    </div>
  );
}

export default function HolidaysTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { holidays, holidaysLoading } = useSelector((s: RootState) => s.leave);

  const isSuperAdmin = user?.role === "super_admin";
  const canManageHolidays = ["super_admin", "branch_manager", "admin_senior_executive"].includes(
    user?.role ?? ""
  );

  // ── Filters
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [branches, setBranches] = useState<{ id: string; name: string; city: string }[]>([]);

  // ── Create & Edit
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PublicHoliday | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PublicHoliday | null>(null);
  const [form, setForm] = useState({
    name: "",
    date: "",
    description: "",
    branch_id: "all",
  });

  // ── Drawer Details
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<PublicHoliday | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // ── Excel Bulk Upload & Template
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBranch, setUploadBranch] = useState("all");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load branches
  useEffect(() => {
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
  }, [dispatch]);

  // Fetch holidays with filters: year, month, branch_id
  const fetchHolidays = () => {
    const params = new URLSearchParams();
    if (yearFilter && yearFilter.trim()) params.set("year", yearFilter.trim());
    if (monthFilter && monthFilter !== "all") params.set("month", monthFilter);
    if (selectedBranch && selectedBranch !== "all") params.set("branch_id", selectedBranch);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    dispatch({
      type: leaveActions.GET_HOLIDAYS,
      method: "GET",
      endPoint: `${API.LEAVE.HOLIDAYS}${queryString}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setHolidaysLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        dispatch(setHolidays(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load holidays"),
    });
  };

  useEffect(() => {
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearFilter, monthFilter, selectedBranch]);

  // Handle row click for details
  const handleRowClick = (holiday: PublicHoliday) => {
    setDrawerOpen(true);
    setDrawerItem(null);
    setDrawerLoading(true);
    dispatch({
      type: leaveActions.GET_HOLIDAY_DETAIL,
      method: "GET",
      endPoint: API.LEAVE.HOLIDAY_DETAIL(holiday.id),
      auth: true,
      getResponse: (res: any) => {
        setDrawerItem(res?.data ?? null);
        setDrawerLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to load details");
        setDrawerLoading(false);
      },
    });
  };

  // Create single holiday
  const handleCreate = () => {
    if (!form.name.trim() || !form.date) {
      toast.error("Please provide both Holiday Name and Date.");
      return;
    }

    const body: Record<string, any> = {
      name: form.name.trim(),
      date: form.date,
    };
    if (form.description.trim()) {
      body.description = form.description.trim();
    }
    if (form.branch_id && form.branch_id !== "all") {
      body.branch_id = form.branch_id;
    } else if (selectedBranch && selectedBranch !== "all") {
      body.branch_id = selectedBranch;
    }

    dispatch({
      type: leaveActions.CREATE_HOLIDAY,
      method: "POST",
      endPoint: API.LEAVE.HOLIDAYS,
      body,
      auth: true,
      setLoading: (v: boolean) => setCreateLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addHoliday(res.data));
          toast.success("Public holiday created successfully.");
          setCreateOpen(false);
          setForm({ name: "", date: "", description: "", branch_id: "all" });
          fetchHolidays();
        } else {
          toast.error("Failed to create holiday.");
        }
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || err?.message || "Failed to create holiday"),
    });
  };

  // Update single holiday
  const handleUpdate = () => {
    if (!editTarget) return;
    if (!editTarget.name.trim() || !editTarget.date) {
      toast.error("Holiday Name and Date cannot be empty.");
      return;
    }

    const body: Record<string, any> = {
      name: editTarget.name.trim(),
      date: editTarget.date,
    };
    if (editTarget.description !== undefined) {
      body.description = editTarget.description.trim();
    }
    if (editTarget.branch) {
      body.branch_id = editTarget.branch;
    }

    dispatch({
      type: leaveActions.UPDATE_HOLIDAY,
      method: "PATCH",
      endPoint: API.LEAVE.HOLIDAY_DETAIL(editTarget.id),
      body,
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) {
          dispatch(updateHolidayInList(res.data));
          toast.success("Holiday updated successfully.");
          setEditOpen(false);
          setEditTarget(null);
          fetchHolidays();
        } else {
          toast.error("Unexpected response from server.");
        }
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || err?.message || "Failed to update holiday"),
    });
  };

  // Delete holiday
  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: leaveActions.DELETE_HOLIDAY,
      method: "DELETE",
      endPoint: API.LEAVE.HOLIDAY_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => {
        dispatch(removeHoliday(deleteTarget.id));
        toast.success("Public holiday deleted successfully.");
        setDeleteTarget(null);
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || err?.message || "Failed to delete holiday"),
    });
  };

  // Download Excel Template
  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadExcel(
        API.LEAVE.HOLIDAYS_EXCEL_TEMPLATE,
        {},
        "public_holiday_upload_template.xlsx"
      );
      toast.success("Sample Excel template downloaded.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to download Excel template"
      );
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // Upload Excel file
  const handleUploadExcel = async () => {
    if (!uploadFile) {
      toast.error("Please select an Excel (.xlsx, .xls) or CSV file to upload.");
      return;
    }
    setUploadLoading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", uploadFile);
    if (uploadBranch && uploadBranch !== "all") {
      formData.append("branch_id", uploadBranch);
    }

    try {
      const loginDataRaw = localStorage.getItem("Insight_Login_Data");
      const token = loginDataRaw ? JSON.parse(loginDataRaw)?.access : "";

      const response = await axiosRequest({
        baseURL: import.meta.env.VITE_APP_BASE_URL,
        url: API.LEAVE.HOLIDAYS_UPLOAD_EXCEL,
        method: "POST",
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response?.data;
      toast.success(data?.message || "Public holidays processed successfully!");
      setUploadResult(data);
      fetchHolidays();

      if (!data?.errors || data?.errors?.length === 0) {
        setTimeout(() => {
          setUploadOpen(false);
          setUploadFile(null);
          setUploadResult(null);
        }, 1200);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Failed to upload Excel file. Please ensure columns match the required format.";
      toast.error(errorMsg);
      if (err?.response?.data) {
        setUploadResult(err.response.data);
      }
    } finally {
      setUploadLoading(false);
    }
  };

  // Filtered holidays by search query
  const filteredHolidays = holidays.filter((h) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = h.name?.toLowerCase().includes(query);
    const dateMatch = h.date?.toLowerCase().includes(query);
    const branchMatch = h.branch_name?.toLowerCase().includes(query);
    const descMatch = h.description?.toLowerCase().includes(query);
    return nameMatch || dateMatch || branchMatch || descMatch;
  });

  return (
    <div className="space-y-4">
      {/* ── Filters & Action Bar ── */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left filters: Search, Year, Month, Branch */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search holidays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-xs sm:text-sm"
              />
            </div>

            {/* Year */}
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                min="2000"
                max="2100"
                placeholder="Year"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-9 text-xs sm:text-sm w-24 font-mono"
              />
            </div>

            {/* Month */}
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-9 text-xs sm:text-sm w-36">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Branch */}
            {branches.length > 0 && (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-9 text-xs sm:text-sm w-44">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches (Global)</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(yearFilter !== String(new Date().getFullYear()) ||
              monthFilter !== "all" ||
              selectedBranch !== "all" ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setYearFilter(String(new Date().getFullYear()));
                  setMonthFilter("all");
                  setSelectedBranch("all");
                  setSearchQuery("");
                }}
                className="h-9 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>

          {/* Right actions: Download Template, Bulk Upload, Add Holiday */}
          <div className="flex items-center gap-2">
            {canManageHolidays && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="h-9 text-xs gap-1.5 border-border hover:bg-muted/40 cursor-pointer"
                  title="Download sample pre-formatted Excel template"
                >
                  {downloadingTemplate ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Template</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadFile(null);
                    setUploadResult(null);
                    setUploadBranch(selectedBranch !== "all" ? selectedBranch : "all");
                    setUploadOpen(true);
                  }}
                  className="h-9 text-xs gap-1.5 border-border hover:bg-muted/40 cursor-pointer"
                  title="Upload holidays from Excel or CSV file"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Upload Excel</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setForm({
                      name: "",
                      date: "",
                      description: "",
                      branch_id: selectedBranch !== "all" ? selectedBranch : "all",
                    });
                    setCreateOpen(true);
                  }}
                  className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Holiday</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Info stats line */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>
            Showing <strong className="text-foreground">{filteredHolidays.length}</strong> of{" "}
            {holidays.length} holiday(s)
          </span>
          {canManageHolidays && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
              <Sparkles className="w-3 h-3 text-amber-500" /> Bulk upload automatically corrects
              attendance & syncs payslips
            </span>
          )}
        </div>
      </div>

      {/* ── Holidays Table ── */}
      {holidaysLoading ? (
        <TableSkeleton columns={5} rows={6} />
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Branch</th>
                  <th className="text-left px-4 py-3">Holiday Name</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Year</th>
                  <th className="text-left px-4 py-3">Description</th>
                  {canManageHolidays && <th className="text-right px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredHolidays.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManageHolidays ? 6 : 5}
                      className="text-center py-12 text-muted-foreground text-xs sm:text-sm"
                    >
                      <CalendarDays className="w-9 h-9 mx-auto mb-2 text-muted-foreground/40" />
                      No public holidays found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredHolidays.map((h, i) => (
                    <motion.tr
                      key={h.id}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015 }}
                      onClick={() => handleRowClick(h)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      {/* Branch */}
                      <td className="px-4 py-3 text-xs">
                        {h.branch_name ? (
                          <Badge variant="outline" className="text-[11px] font-normal bg-slate-50">
                            {h.branch_name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">All Branches</span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 font-semibold text-foreground text-xs sm:text-sm">
                        {h.name}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {h.date}
                      </td>

                      {/* Year */}
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        {h.year}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[240px] truncate">
                        {h.description || "—"}
                      </td>

                      {/* Actions */}
                      {canManageHolidays && (
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditTarget(h);
                                setEditOpen(true);
                              }}
                              title="Edit Holiday"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-muted-foreground hover:text-red-600"
                              onClick={() => setDeleteTarget(h)}
                              title="Delete Holiday"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create Individual Holiday Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Public Holiday</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a calendar public holiday for one or all branches.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs mb-1 block">
                Holiday Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Republic Day, Diwali"
                className="h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>

            {branches.length > 0 && (
              <div>
                <Label className="text-xs mb-1 block">Applicable Branch</Label>
                <Select
                  value={form.branch_id}
                  onValueChange={(val) => setForm((f) => ({ ...f, branch_id: val }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Branches (Global)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches (Global)</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} — {b.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs mb-1 block">Description / Note (Optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Additional notes about the holiday..."
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createLoading || !form.name.trim() || !form.date}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createLoading ? "Creating..." : "Create Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Individual Holiday Dialog ── */}
      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
          </DialogHeader>

          {editTarget && (
            <div className="space-y-3.5 py-2">
              <div>
                <Label className="text-xs mb-1 block">Holiday Name *</Label>
                <Input
                  value={editTarget.name}
                  onChange={(e) =>
                    setEditTarget((p) => (p ? { ...p, name: e.target.value } : null))
                  }
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs mb-1 block">Date *</Label>
                <Input
                  type="date"
                  value={editTarget.date}
                  onChange={(e) =>
                    setEditTarget((p) => (p ? { ...p, date: e.target.value } : null))
                  }
                  className="h-9 text-sm"
                />
              </div>

              {branches.length > 0 && isSuperAdmin && (
                <div>
                  <Label className="text-xs mb-1 block">Branch</Label>
                  <Select
                    value={editTarget.branch || "all"}
                    onValueChange={(val) =>
                      setEditTarget((p) =>
                        p ? { ...p, branch: val === "all" ? "" : val } : null
                      )
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All Branches (Global)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches (Global)</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} — {b.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-xs mb-1 block">Description / Note</Label>
                <Textarea
                  value={editTarget.description || ""}
                  onChange={(e) =>
                    setEditTarget((p) => (p ? { ...p, description: e.target.value } : null))
                  }
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={editLoading || !editTarget?.name.trim() || !editTarget?.date}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {editLoading ? "Saving..." : "Update Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Excel Bulk Upload Modal ── */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg">
                  Bulk Upload Public Holidays
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Import multiple holidays using an Excel (.xlsx, .xls) or CSV spreadsheet.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Automatic side effects banner */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-1 text-amber-950">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Automatic Side Effects on Upload
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                1. <strong>Attendance Correction:</strong> Employees scheduled on holiday dates are
                automatically marked <em>Present</em>.
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                2. <strong>Payroll Synchronization:</strong> Payslips in affected draft payroll runs
                are updated in real time.
              </p>
            </div>

            {/* Supported Columns Guide & Template Link */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Supported Columns:</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  {downloadingTemplate ? "Downloading..." : "Download Sample Template"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="font-medium text-slate-900">• Date:</span> Required (YYYY-MM-DD
                  or Excel date)
                </div>
                <div>
                  <span className="font-medium text-slate-900">• Name / Holiday Name:</span>{" "}
                  Required
                </div>
                <div>
                  <span className="font-medium text-slate-900">• Description / Note:</span>{" "}
                  Optional
                </div>
                <div>
                  <span className="font-medium text-slate-900">• Branch:</span> Optional (name or
                  ID)
                </div>
              </div>
            </div>

            {/* Optional Branch Override */}
            {branches.length > 0 && (
              <div>
                <Label className="text-xs mb-1 block">Default Branch (Optional)</Label>
                <Select value={uploadBranch} onValueChange={setUploadBranch}>
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All Branches / Global" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches (Global / Default from File)</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} — {b.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Used for rows where the branch column is left empty in the spreadsheet.
                </p>
              </div>
            )}

            {/* File Drag and Drop / Picker */}
            <div>
              <Label className="text-xs mb-1.5 block font-medium">Spreadsheet File *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setUploadFile(f);
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                  uploadFile
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-border hover:border-primary/50 hover:bg-slate-50/50"
                }`}
              >
                {uploadFile ? (
                  <div className="flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                          {uploadFile.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {(uploadFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      Click to choose or drag & drop spreadsheet
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Supports Excel (.xlsx, .xls) and CSV (.csv) up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload results message if available */}
            {uploadResult && (
              <div
                className={`p-3 rounded-xl text-xs space-y-1 border ${
                  uploadResult.errors && uploadResult.errors.length > 0
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {uploadResult.message || "Upload Processed"}
                </div>
                {uploadResult.created_count !== undefined && (
                  <p className="text-[11px]">
                    Created: <strong>{uploadResult.created_count}</strong> | Updated:{" "}
                    <strong>{uploadResult.updated_count || 0}</strong>
                  </p>
                )}
                {Array.isArray(uploadResult.errors) && uploadResult.errors.length > 0 && (
                  <div className="mt-2 text-[11px] space-y-0.5 text-rose-700">
                    <p className="font-medium">Errors encountered:</p>
                    {uploadResult.errors.slice(0, 5).map((err: any, idx: number) => (
                      <p key={idx}>• {typeof err === "string" ? err : JSON.stringify(err)}</p>
                    ))}
                    {uploadResult.errors.length > 5 && (
                      <p className="italic">
                        + {uploadResult.errors.length - 5} more error(s)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadOpen(false)}
              disabled={uploadLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadExcel}
              disabled={uploadLoading || !uploadFile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Sync</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Holiday Detail Drawer ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Holiday Details</SheetTitle>
          </SheetHeader>
          {drawerLoading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading details...
              </span>
            </div>
          ) : drawerItem ? (
            <HolidayDetail item={drawerItem} />
          ) : null}
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This public holiday will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
