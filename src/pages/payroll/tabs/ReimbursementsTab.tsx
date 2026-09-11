import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { reimbursementActions } from "@/redux/actions";
import { API } from "@/service/api";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { useDropdown } from "@/hooks/useDropdown";
import StatCard from "@/components/common/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import type { Reimbursement, ReimbursementSummary } from "@/types/reimbursement.types";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Eye, Trash2, FileText, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import ReimbursementFormModal from "../../reimbursements/components/ReimbursementFormModal";
import { useNavigate } from "react-router-dom";

// We'll create these constants locally since they don't exist yet
const ADMIN_ROLES = ['super_admin', 'admin_senior_executive', 'admin_executive', 'accountant'];
const BRANCH_MGR = ['branch_manager'];
const ALL_APPROVERS = [...ADMIN_ROLES, ...BRANCH_MGR];

export default function ReimbursementsTab() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Reimbursement[]>([]);
  const [summary, setSummary] = useState<ReimbursementSummary | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [myClaimsOnly, setMyClaimsOnly] = useState(false);
  const [userIdFilter, setUserIdFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isPaidFilter, setIsPaidFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { options: branchOptions, fetchOptions: fetchBranchOptions } = useDropdown("branches", false);

  const isApprover = user && ALL_APPROVERS.includes(user.role);
  const isGlobalAdmin = user && ADMIN_ROLES.includes(user.role);

  const fetchData = () => {
    const filters: any = {};
    if (statusFilter !== "all") filters.status = statusFilter;
    if (branchFilter !== "all") filters.branch_id = branchFilter;
    if (myClaimsOnly || !isApprover) filters.my = 1;

    if (userIdFilter) filters.user_id = userIdFilter;
    if (search) filters.search = search;
    if (dateFilter) filters.date = dateFilter;
    if (fromDate) filters.from_date = fromDate;
    if (toDate) filters.to_date = toDate;
    if (isPaidFilter !== "all") filters.is_paid = isPaidFilter;

    const qs = new URLSearchParams(filters).toString();
    const query = qs ? `?${qs}` : "";

    dispatch({
      type: reimbursementActions.GET_REIMBURSEMENTS,
      method: "GET",
      endPoint: API.REIMBURSEMENTS.LIST + query,
      auth: true,
      setLoading: (val: boolean) => setLoading(val),
      getResponse: (res: any) => {
        if (res?.success) setData(res.data);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to load reimbursements");
      },
    });

    dispatch({
      type: reimbursementActions.GET_REIMBURSEMENTS_SUMMARY,
      method: "GET",
      endPoint: API.REIMBURSEMENTS.SUMMARY + query,
      auth: true,
      setLoading: () => {}, // Handled by the list call
      getResponse: (res: any) => {
        if (res?.success) setSummary(res.summary);
      },
      getError: () => {},
    });
  };

  useEffect(() => {
    if (isGlobalAdmin) fetchBranchOptions();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statusFilter, branchFilter, myClaimsOnly, isApprover, isGlobalAdmin,
    dateFilter, fromDate, toDate, isPaidFilter
    // search and userIdFilter are omitted to avoid fetching on every keystroke,
    // they can be triggered by a manual refresh button or blur if preferred, 
    // but here we will rely on a Refresh/Search button in the UI.
  ]);

  const handleFormSubmit = (formData: FormData) => {
    dispatch({
      type: reimbursementActions.SUBMIT_REIMBURSEMENT,
      method: "POST",
      endPoint: API.REIMBURSEMENTS.LIST,
      body: formData,
      auth: true,
      setLoading: (val: boolean) => setFormLoading(val),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Claim submitted successfully");
          setIsFormOpen(false);
          fetchData();
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to submit claim");
      },
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    dispatch({
      type: reimbursementActions.DELETE_REIMBURSEMENT,
      method: "DELETE",
      endPoint: API.REIMBURSEMENTS.DETAIL(deleteId),
      auth: true,
      setLoading: () => {},
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Claim deleted");
          fetchData();
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete claim");
      },
    });
    setDeleteId(null);
  };

  const columns = useMemo<ColumnDef<Reimbursement>[]>(() => [
    {
      accessorKey: "title",
      header: "Claim",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[160px]">
          <span className="font-semibold text-text-primary truncate">{row.original.title}</span>
          <span className="text-xs text-muted-foreground truncate">{row.original.description}</span>
        </div>
      ),
    },
    {
      accessorKey: "user_name",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[130px]">
          <span className="text-sm font-medium text-text-primary">{row.original.user_name}</span>
          <span className="text-xs text-muted-foreground">{row.original.branch_name}</span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-sm">₹{Number(row.original.amount).toLocaleString("en-IN")}</span>
      ),
    },
    {
      accessorKey: "expense_date",
      header: "Expense Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.expense_date)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const paid = row.original.is_paid;
        let color = "bg-warning/10 text-warning";
        let icon = <Clock className="w-3.5 h-3.5 mr-1" />;
        let label = "Pending";

        if (s === "approved") {
          color = paid ? "bg-primary/10 text-primary-dark" : "bg-success/10 text-success";
          icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
          label = paid ? "Paid" : "Approved";
        } else if (s === "rejected") {
          color = "bg-destructive/10 text-destructive";
          icon = <XCircle className="w-3.5 h-3.5 mr-1" />;
          label = "Rejected";
        }

        return (
          <div className="flex flex-col gap-1">
            <span className={cn("inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium", color)}>
              {icon} {label}
            </span>
            {s === "approved" && row.original.approved_by_name && (
              <span className="text-[11px] text-muted-foreground">by {row.original.approved_by_name}</span>
            )}
            {s === "rejected" && row.original.rejected_by_name && (
              <span className="text-[11px] text-muted-foreground">by {row.original.rejected_by_name}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "proof",
      header: "Proof",
      cell: ({ row }) => {
        const proof = row.original.proof;
        if (!proof) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <a
            href={proof}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View
          </a>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const r = row.original;
        const canEditOrDelete = r.status === "pending" && (r.user === user?.id || isGlobalAdmin);

        return (
          <div className="flex items-center justify-end gap-1">
            {canEditOrDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteId(r.id)}
                title="Delete Claim"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [user, isGlobalAdmin, navigate]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Reimbursements</h2>
          <p className="text-sm text-muted-foreground">Manage your expense claims</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Submit Claim
        </Button>
      </div>

      {/* Summary Cards */}
      {summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Claimed"
            value={`₹${Number(summary.total_amount).toLocaleString()}`}
            icon={FileText}
            iconClassName="text-primary"
            iconBgClassName="bg-primary/10"
          />
          <StatCard
            title="Pending Approval"
            value={`₹${Number(summary.pending_amount).toLocaleString()}`}
            icon={Clock}
            iconClassName="text-warning"
            iconBgClassName="bg-warning/10"
          />
          <StatCard
            title="Approved (Unpaid)"
            value={`₹${Number(summary.approved_amount).toLocaleString()}`}
            icon={CheckCircle2}
            iconClassName="text-success"
            iconBgClassName="bg-success/10"
          />
          <StatCard
            title="Settled (Paid)"
            value={`₹${Number(summary.paid_amount).toLocaleString()}`}
            icon={CheckCircle2}
            iconClassName="text-primary-dark"
            iconBgClassName="bg-primary-light"
          />
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <Skeleton width={100} height={12} />
              <Skeleton width={80} height={28} />
            </div>
          ))}
        </div>
      ) : null}

      {/* Filters & Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {isGlobalAdmin && (
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branchOptions.map((b) => (
                    <SelectItem key={String(b.value)} value={String(b.value)}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={isPaidFilter} onValueChange={setIsPaidFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Paid Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (Paid/Unpaid)</SelectItem>
                <SelectItem value="true">Paid</SelectItem>
                <SelectItem value="false">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search..."
              className="h-9 w-40 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
            />

            <Input
              type="date"
              title="Date"
              className="h-9 w-[130px] text-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            <Input
              type="date"
              title="From Date"
              className="h-9 w-[130px] text-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />

            <Input
              type="date"
              title="To Date"
              className="h-9 w-[130px] text-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />

            <Input
              placeholder="User UUID..."
              className="h-9 w-[130px] text-sm"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
            />
            <Button variant="outline" size="sm" className="h-9" onClick={fetchData}>
              Search
            </Button>
            
            {(search || dateFilter || fromDate || toDate || userIdFilter || isPaidFilter !== "all" || statusFilter !== "all" || branchFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setSearch("");
                  setDateFilter("");
                  setFromDate("");
                  setToDate("");
                  setUserIdFilter("");
                  setStatusFilter("all");
                  setBranchFilter("all");
                  setIsPaidFilter("all");
                  // The useEffect will trigger fetchData for select changes, but for text inputs we may need to call it manually.
                  setTimeout(fetchData, 0);
                }}
              >
                Clear
              </Button>
            )}
          </div>
          
          {/* <div className="flex items-center gap-2">
            {isApprover && (
              <Button
                variant={myClaimsOnly ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => setMyClaimsOnly(!myClaimsOnly)}
              >
                My Claims
              </Button>
            )}
          </div> */}
        </div>

        <div className="relative overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[minmax(180px,2fr)_minmax(140px,1.5fr)_90px_100px_110px_60px_90px_40px] items-center gap-4 py-2">
                  {/* Claim */}
                  <div className="flex flex-col gap-1.5">
                    <Skeleton width="80%" height={14} />
                    <Skeleton width="55%" height={10} />
                  </div>
                  {/* Employee */}
                  <div className="flex flex-col gap-1.5">
                    <Skeleton width="75%" height={14} />
                    <Skeleton width="50%" height={10} />
                  </div>
                  {/* Amount */}
                  <Skeleton width={70} height={14} />
                  {/* Expense Date */}
                  <Skeleton width={85} height={14} />
                  {/* Status */}
                  <Skeleton width={90} height={24} borderRadius={12} />
                  {/* Proof */}
                  <Skeleton width={45} height={14} />
                  {/* Submitted */}
                  <Skeleton width={80} height={14} />
                  {/* Actions */}
                  <Skeleton width={32} height={32} borderRadius={6} />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/reimbursements/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-48 text-center text-muted-foreground">
                      No reimbursement claims found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        
        {/* Pagination placeholder if needed */}
      </div>

      <ReimbursementFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={formLoading}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Reimbursement Claim"
        description="Are you sure you want to delete this claim? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete Claim"
        variant="danger"
      />
    </div>
  );
}
