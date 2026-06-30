import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, RotateCcw, Search, Users, Layers, CheckCircle2, Clock } from "lucide-react";
import { inventoryActions, userActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setAllocations,
  setAllocationsLoading,
  addAllocation,
  addAllocations,
  updateAllocationInList,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  notes: string;
}

// One line in bulk allocation
interface BulkAllocLine {
  item: string;
  quantity: string;
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
      <DetailRow label="Item" value={item.item_name} />
      <DetailRow label="Issued To" value={item.student_name ?? item.faculty_name ?? "—"} />
      <DetailRow label="Type" value={item.student ? "Student" : "Faculty"} />
      <DetailRow label="Quantity" value={item.quantity} />
      <DetailRow
        label="Status"
        value={
          item.status === "issued" ? (
            <Badge className="bg-blue-100 text-blue-700 text-xs">Issued</Badge>
          ) : (
            <Badge className="bg-green-100 text-green-700 text-xs">Returned</Badge>
          )
        }
      />
      <DetailRow label="Issued By" value={item.issued_by_name} />
      <DetailRow label="Issued At" value={new Date(item.issued_at).toLocaleString()} />
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
  item: "",
  recipient_type: "student",
  recipient_id: "",
  quantity: "1",
  notes: "",
});

const blankBulkLine = (): BulkAllocLine => ({
  item: "",
  quantity: "1",
  notes: "",
});

export default function AllocationsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { allocations, allocationsCount, allocationsLoading, items } = useSelector(
    (s: RootState) => s.inventory,
  );

  // ── User lists ────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<UserOption[]>([]);
  const [faculty, setFaculty] = useState<UserOption[]>([]);
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

    // Fetch faculty concurrently, using a different action type to avoid takeLatest cancellation
    dispatch({
      type: userActions.GET_USERS_FOR_ASSIGN,
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Drawer ────────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<ItemAllocation | null>(null);

  // ── Issue mode toggle: "single" | "bulk" ─────────────────────────────────
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueMode, setIssueMode] = useState<"single" | "bulk">("single");
  const [issueLoading, setIssueLoading] = useState(false);

  // Single issue form
  const [singleForm, setSingleForm] = useState<SingleAllocForm>(blankSingleForm());

  // Bulk issue form
  const [bulkRecipientType, setBulkRecipientType] = useState<"student" | "faculty">("student");
  const [bulkRecipientId, setBulkRecipientId] = useState("");
  const [bulkLines, setBulkLines] = useState<BulkAllocLine[]>([blankBulkLine()]);

  // ── Return confirm ────────────────────────────────────────────────────────
  const [returnTarget, setReturnTarget] = useState<ItemAllocation | null>(null);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  // ── Fetch allocations ─────────────────────────────────────────────────────
  const fetchAllocations = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    if (search) params.append("search", search);
    const endPoint = `${API.INVENTORY.ALLOCATIONS}${params.toString() ? "?" + params.toString() : ""}`;
    dispatch({
      type: inventoryActions.GET_ALLOCATIONS,
      method: "GET",
      endPoint,
      auth: true,
      setLoading: (v: boolean) => dispatch(setAllocationsLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res?.data)
            ? res.data
            : [];
        const count = res?.count ?? data.length;
        dispatch(setAllocations({ data, count }));
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to load allocations"),
    });
  };

  useEffect(() => {
    fetchAllocations();
  }, [statusFilter]);

  // ── Recipients helper ─────────────────────────────────────────────────────
  const recipientList = (type: "student" | "faculty") => (type === "student" ? students : faculty);

  // ── Single Issue ──────────────────────────────────────────────────────────
  const handleSingleIssue = () => {
    const body: any = {
      item: singleForm.item,
      quantity: Number(singleForm.quantity),
      status: "issued",
      ...(singleForm.notes ? { notes: singleForm.notes } : {}),
    };
    if (singleForm.recipient_type === "student") body.student = singleForm.recipient_id;
    else body.faculty = singleForm.recipient_id;

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
      allocations: bulkLines.map((line) => ({
        item: line.item,
        quantity: Number(line.quantity),
        ...(line.notes ? { notes: line.notes } : {}),
      })),
    };
    if (bulkRecipientType === "student") body.student = bulkRecipientId;
    else body.faculty = bulkRecipientId;

    dispatch({
      type: inventoryActions.BULK_ALLOCATION,
      method: "POST",
      endPoint: API.INVENTORY.ALLOCATION_BULK,
      body,
      auth: true,
      setLoading: (v: boolean) => setIssueLoading(v),
      getResponse: (res: any) => {
        // Bulk returns an array of created allocations
        const created = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
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
  const addBulkLine = () => setBulkLines((prev) => [...prev, blankBulkLine()]);
  const removeBulkLine = (idx: number) => setBulkLines((prev) => prev.filter((_, i) => i !== idx));
  const updateBulkLine = (idx: number, key: keyof BulkAllocLine, value: string) => {
    setBulkLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  };

  const filtered = allocations.filter((a) => {
    if (!search) return true;
    return (
      (a.student_name ?? a.faculty_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      a.item_name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name / item..."
              className="pl-8 h-9 text-sm w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-9 text-sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              fetchAllocations();
            }}
          >
            Clear
          </Button>
          <Button variant="outline" className="h-9 text-sm" onClick={fetchAllocations}>
            Search
          </Button>
        </div>
        <Button
          onClick={() => {
            setIssueOpen(true);
            setIssueMode("single");
            setSingleForm(blankSingleForm());
            setBulkLines([blankBulkLine()]);
            setBulkRecipientId("");
          }}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5"
        >
          <Plus className="w-4 h-4" /> Issue Item
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {allocationsCount} allocation(s) · {filtered.length} shown
      </p>

      {/* Table */}
      {allocationsLoading ? (
        <TableSkeleton />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Item", "Issued To", "Type", "Qty", "Status", "Issued At", "Issued By", "Return"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-muted-foreground text-sm">
                    No allocations found.
                  </td>
                </tr>
              ) : (
                filtered.map((alloc, i) => (
                  <motion.tr
                    key={alloc.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => {
                      setDrawerItem(alloc);
                      setDrawerOpen(true);
                    }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium">{alloc.item_name}</td>
                    <td className="px-4 py-3">{alloc.student_name ?? alloc.faculty_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`text-xs ${alloc.student ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                      >
                        {alloc.student ? "Student" : "Faculty"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{alloc.quantity}</td>
                    <td className="px-4 py-3">
                      {alloc.status === "issued" ? (
                        <Badge className="bg-blue-100 text-blue-700 text-xs gap-1">
                          <Clock className="w-3 h-3" />
                          Issued
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Returned
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(alloc.issued_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {alloc.issued_by_name}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {alloc.status === "issued" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-orange-500 hover:text-orange-600"
                          onClick={() => {
                            setReturnTarget(alloc);
                            setReturnNotes("");
                            setReturnOpen(true);
                          }}
                          title="Return Item"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Allocation Details</SheetTitle>
          </SheetHeader>
          {drawerItem && <AllocationDetail item={drawerItem} />}
        </SheetContent>
      </Sheet>

      {/* Issue Dialog — single + bulk tabs */}
      <Dialog open={issueOpen} onOpenChange={(o) => setIssueOpen(o)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Item(s)</DialogTitle>
          </DialogHeader>

          {/* Mode toggle */}
          <div className="flex gap-2 pt-1">
            <Button
              variant={issueMode === "single" ? "default" : "outline"}
              size="sm"
              className={`gap-1.5 ${issueMode === "single" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setIssueMode("single")}
            >
              <Users className="w-3.5 h-3.5" /> Single Issue
            </Button>
            <Button
              variant={issueMode === "bulk" ? "default" : "outline"}
              size="sm"
              className={`gap-1.5 ${issueMode === "bulk" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setIssueMode("bulk")}
            >
              <Layers className="w-3.5 h-3.5" /> Bulk Issue
            </Button>
          </div>

          {/* ── SINGLE ISSUE ── */}
          {issueMode === "single" && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs mb-1 block">Item *</Label>
                <Select
                  value={singleForm.item}
                  onValueChange={(v) => setSingleForm((f) => ({ ...f, item: v }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
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
                  <Select
                    value={singleForm.recipient_type}
                    onValueChange={(v: "student" | "faculty") =>
                      setSingleForm((f) => ({ ...f, recipient_type: v, recipient_id: "" }))
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Select
                    value={singleForm.recipient_id}
                    onValueChange={(v) => setSingleForm((f) => ({ ...f, recipient_id: v }))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={`Select ${singleForm.recipient_type}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {recipientList(singleForm.recipient_type).map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Quantity *</Label>
                  <Input
                    type="number"
                    value={singleForm.quantity}
                    onChange={(e) => setSingleForm((f) => ({ ...f, quantity: e.target.value }))}
                    min="1"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Notes</Label>
                <Textarea
                  value={singleForm.notes}
                  onChange={(e) => setSingleForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Optional notes..."
                  className="text-sm resize-none"
                />
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
                  <Select
                    value={bulkRecipientType}
                    onValueChange={(v: "student" | "faculty") => {
                      setBulkRecipientType(v);
                      setBulkRecipientId("");
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
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
                      {recipientList(bulkRecipientType).map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Item lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Items to Issue *</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={addBulkLine}
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </Button>
                </div>

                {bulkLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-end p-2 border border-border rounded-lg"
                  >
                    {/* Item select — 6 cols */}
                    <div className="col-span-6">
                      {idx === 0 && <Label className="text-xs mb-1 block">Item</Label>}
                      <Select
                        value={line.item}
                        onValueChange={(v) => updateBulkLine(idx, "item", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
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
                      <Input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateBulkLine(idx, "quantity", e.target.value)}
                        min="1"
                        className="h-8 text-xs"
                      />
                    </div>
                    {/* Notes — 3 cols */}
                    <div className="col-span-3">
                      {idx === 0 && <Label className="text-xs mb-1 block">Notes</Label>}
                      <Input
                        value={line.notes}
                        onChange={(e) => updateBulkLine(idx, "notes", e.target.value)}
                        placeholder="Optional"
                        className="h-8 text-xs"
                      />
                    </div>
                    {/* Remove — 1 col */}
                    <div className="col-span-1">
                      {bulkLines.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeBulkLine(idx)}
                        >
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
            <Button variant="outline" onClick={() => setIssueOpen(false)} disabled={issueLoading}>
              Cancel
            </Button>
            <Button
              onClick={issueMode === "single" ? handleSingleIssue : handleBulkIssue}
              disabled={
                issueLoading ||
                (issueMode === "single" &&
                  (!singleForm.item || !singleForm.recipient_id || !singleForm.quantity)) ||
                (issueMode === "bulk" &&
                  (!bulkRecipientId || bulkLines.some((l) => !l.item || !l.quantity)))
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
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
      <Dialog
        open={returnOpen}
        onOpenChange={(o) => {
          setReturnOpen(o);
          if (!o) {
            setReturnTarget(null);
            setReturnNotes("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return Item</DialogTitle>
            {returnTarget && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold text-foreground">{returnTarget.item_name}</span>{" "}
                issued to{" "}
                <span className="font-semibold text-foreground">
                  {returnTarget.student_name ?? returnTarget.faculty_name}
                </span>
              </p>
            )}
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs mb-1 block">Return Notes</Label>
            <Textarea
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Returned in good condition. Student transferred."
              className="text-sm resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReturnOpen(false);
                setReturnTarget(null);
                setReturnNotes("");
              }}
              disabled={returnLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReturn}
              disabled={returnLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {returnLoading ? "Processing…" : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
